import type {
  IdentityAuditEvent,
  IdentityAuditInput,
  IdentityConfig,
  IdentityManagerApi,
  IdentityManagerSnapshot,
  IdentityOrganizationContext,
  IdentityPrincipal,
  IdentitySession,
  IdentityToken,
  ResolvedIdentityConfig,
} from '../types/identity'
import type {
  PermissionDecision,
  PermissionOverride,
  PermissionRequest,
} from '../types/permissions'
import type { CustomIdentityRole } from '../types/roles'
import { IdentityProviderRegistry } from './providerRegistry'
import { PermissionEngine } from './permissionEngine'
import { RoleEngine } from './roleEngine'
import { SessionManager } from './sessionManager'

const DEFAULT_CONTEXT: IdentityOrganizationContext = {
  tenantId: 'local-tenant',
  organizationId: 'local-organization',
  workspaceId: 'local-workspace',
}

const DEFAULT_PRINCIPAL: IdentityPrincipal = {
  id: 'local-administrator',
  displayName: 'Local Administrator',
  roleIds: ['administrator'],
}

function resolveConfig(config: IdentityConfig = {}): ResolvedIdentityConfig {
  return {
    providers: [...(config.providers ?? [])],
    defaultProviderId: config.defaultProviderId,
    principal: config.principal ?? DEFAULT_PRINCIPAL,
    token: config.token,
    context: {
      ...DEFAULT_CONTEXT,
      ...config.context,
      attributes: config.context?.attributes
        ? { ...config.context.attributes }
        : undefined,
    },
    roles: [...(config.roles ?? [])],
    permissionOverrides: [...(config.permissionOverrides ?? [])],
    auditAdapter: config.auditAdapter,
    auditBufferSize: Math.min(2_000, Math.max(50, config.auditBufferSize ?? 250)),
    permissionCacheTtlMs: Math.min(
      15 * 60_000,
      Math.max(1_000, config.permissionCacheTtlMs ?? 5 * 60_000),
    ),
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : 'The identity provider could not resolve the current user.'
}

function normalizePrincipal(principal: IdentityPrincipal): IdentityPrincipal {
  if (
    !principal ||
    typeof principal.id !== 'string' ||
    !principal.id.trim() ||
    typeof principal.displayName !== 'string' ||
    !principal.displayName.trim() ||
    !Array.isArray(principal.roleIds)
  ) {
    throw new Error('Identity principals require id, displayName, and roleIds.')
  }
  return {
    ...principal,
    id: principal.id.trim(),
    displayName: principal.displayName.trim(),
    roleIds: [...new Set(principal.roleIds.filter(Boolean))],
    groupIds: principal.groupIds ? [...new Set(principal.groupIds.filter(Boolean))] : undefined,
    attributes: principal.attributes ? { ...principal.attributes } : undefined,
  }
}

export class IdentityManager implements IdentityManagerApi {
  private readonly config: ResolvedIdentityConfig
  private readonly providers: IdentityProviderRegistry
  private readonly roles: RoleEngine
  private readonly sessions = new SessionManager()
  private readonly permissions: PermissionEngine
  private readonly listeners = new Set<() => void>()
  private readonly auditListeners = new Set<() => void>()
  private token?: IdentityToken
  private context: IdentityOrganizationContext
  private auditEvents: IdentityAuditEvent[] = []
  private status: IdentityManagerSnapshot['status'] = 'ready'
  private error: string | null = null
  private version = 0
  private snapshot!: IdentityManagerSnapshot

  constructor(config: ResolvedIdentityConfig) {
    this.config = config
    this.providers = new IdentityProviderRegistry(config.providers)
    this.roles = new RoleEngine(config.roles)
    this.token = config.token ? { ...config.token } : undefined
    this.context = config.context
    this.sessions.start(
      normalizePrincipal(config.principal),
      config.context,
      config.defaultProviderId ?? null,
      config.token,
    )
    this.permissions = new PermissionEngine({
      roles: this.roles,
      getPrincipal: () => {
        const session = this.sessions.getCurrent()
        if (
          !session ||
          session.status !== 'active' ||
          (session.expiresAt !== undefined && session.expiresAt <= Date.now())
        ) return null
        return session.principal
      },
      getContext: () => this.context,
      cacheTtlMs: config.permissionCacheTtlMs,
      onDecision: (decision) => this.recordPermissionDecision(decision),
    })
    this.permissions.setOverrides(config.permissionOverrides)
    this.refreshSnapshot()
    this.audit({
      category: 'session',
      action: 'session.started',
      outcome: 'success',
      details: { providerId: config.defaultProviderId ?? 'host' },
    })
  }

  getSnapshot = (): IdentityManagerSnapshot => this.snapshot

  getAuditEvents = (): readonly IdentityAuditEvent[] => this.auditEvents

  getSessions = (): readonly IdentitySession[] => this.sessions.list()

  getPermissionVersion = (): number => this.permissions.getVersion()

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  subscribePermissions = (listener: () => void): (() => void) =>
    this.permissions.subscribe(listener)

  subscribeAudit = (listener: () => void): (() => void) => {
    this.auditListeners.add(listener)
    return () => this.auditListeners.delete(listener)
  }

  registerProvider = (provider: Parameters<IdentityProviderRegistry['register']>[0]): (() => void) => {
    const unregister = this.providers.register(provider)
    this.changed()
    this.audit({
      category: 'administration',
      action: 'provider.registered',
      outcome: 'success',
      resourceId: provider.id,
      details: { protocol: provider.protocol },
    })
    return () => {
      unregister()
      this.changed()
      this.audit({
        category: 'administration',
        action: 'provider.unregistered',
        outcome: 'success',
        resourceId: provider.id,
      })
    }
  }

  registerRole = (role: CustomIdentityRole): (() => void) => {
    const unregister = this.roles.register(role)
    this.permissions.invalidate()
    this.changed()
    this.audit({
      category: 'administration',
      action: 'role.registered',
      outcome: 'success',
      resourceId: role.id,
    })
    return () => {
      unregister()
      this.permissions.invalidate()
      this.changed()
      this.audit({
        category: 'administration',
        action: 'role.unregistered',
        outcome: 'success',
        resourceId: role.id,
      })
    }
  }

  setPermissionOverrides = (overrides: PermissionOverride[]): void => {
    this.permissions.setOverrides(overrides)
    this.audit({
      category: 'administration',
      action: 'permission-overrides.updated',
      outcome: 'success',
      details: { count: overrides.length },
    })
  }

  setIdentityToken = (token?: IdentityToken): void => {
    this.token = token ? { ...token } : undefined
    this.audit({
      category: 'identity',
      action: token ? 'token.provided' : 'token.cleared',
      outcome: 'success',
      details: { hasToken: Boolean(token?.value) },
    })
  }

  setOrganizationContext = (
    context: Partial<IdentityOrganizationContext>,
  ): void => {
    this.context = {
      ...this.context,
      ...context,
      attributes: context.attributes
        ? { ...context.attributes }
        : this.context.attributes,
    }
    const principal = this.sessions.getCurrent()?.principal
    if (principal) {
      this.sessions.start(
        principal,
        this.context,
        this.sessions.getCurrent()?.providerId ?? null,
        this.token,
      )
    }
    this.permissions.invalidate()
    this.changed()
    this.audit({
      category: 'identity',
      action: 'organization-context.updated',
      outcome: 'success',
    })
  }

  setPrincipal = (principal: IdentityPrincipal): void => {
    this.sessions.start(normalizePrincipal(principal), this.context, null, this.token)
    this.status = 'ready'
    this.error = null
    this.permissions.invalidate()
    this.changed()
    this.audit({
      category: 'session',
      action: 'session.started',
      outcome: 'success',
      details: { providerId: 'host' },
    })
  }

  resolveSession = async (
    providerId = this.config.defaultProviderId,
    signal?: AbortSignal,
  ): Promise<IdentitySession> => {
    if (!providerId) throw new Error('No identity provider was selected.')
    const provider = this.providers.get(providerId)
    if (!provider) throw new Error(`Identity provider "${providerId}" is not registered.`)
    this.status = 'resolving'
    this.error = null
    this.changed()
    try {
      const principal = normalizePrincipal(await provider.resolveIdentity({
        token: this.token,
        context: this.context,
        signal,
      }))
      if (signal?.aborted) throw new DOMException('Identity resolution was cancelled.', 'AbortError')
      const session = this.sessions.start(
        principal,
        this.context,
        provider.id,
        this.token,
      )
      this.status = 'ready'
      this.permissions.invalidate()
      this.changed()
      this.audit({
        category: 'session',
        action: 'session.resolved',
        outcome: 'success',
        resourceId: provider.id,
        details: { protocol: provider.protocol },
      })
      return session
    } catch (error) {
      this.status = 'error'
      this.error = errorMessage(error)
      this.changed()
      this.audit({
        category: 'session',
        action: 'session.resolve',
        outcome: 'failure',
        resourceId: provider.id,
      })
      throw error
    }
  }

  endSession = (): void => {
    this.sessions.end()
    this.permissions.invalidate()
    this.changed()
    this.audit({
      category: 'session',
      action: 'session.ended',
      outcome: 'success',
    })
  }

  decide = (request: PermissionRequest): PermissionDecision =>
    this.permissions.decide(request)

  peek = (request: PermissionRequest): PermissionDecision =>
    this.permissions.peek(request)

  can = (
    permission: PermissionRequest['permission'],
    action?: string,
  ): boolean => this.permissions.can(permission, action)

  audit = (input: IdentityAuditInput): IdentityAuditEvent => {
    const session = this.sessions.getCurrent()
    const event: IdentityAuditEvent = {
      id: crypto.randomUUID(),
      ...input,
      timestamp: Date.now(),
      principalId: session?.principal.id ?? null,
      principalName: session?.principal.displayName ?? null,
      sessionId: session?.id ?? null,
      context: { ...this.context },
    }
    this.auditEvents = [event, ...this.auditEvents].slice(
      0,
      this.config.auditBufferSize,
    )
    for (const listener of this.auditListeners) listener()
    try {
      void Promise.resolve(this.config.auditAdapter?.write(event)).catch(() => {})
    } catch {
      // Host audit adapters must never interrupt editor operations.
    }
    return event
  }

  private recordPermissionDecision(decision: PermissionDecision): void {
    this.audit({
      category: 'permission',
      action: `permission.${decision.permission}`,
      outcome: decision.allowed ? 'allowed' : 'denied',
      resourceId: decision.resource?.id,
      details: {
        permission: decision.permission,
        source: decision.source,
        cached: decision.cached,
        action: decision.action ?? null,
      },
    })
  }

  private changed(): void {
    this.version += 1
    this.refreshSnapshot()
    for (const listener of this.listeners) listener()
  }

  private refreshSnapshot(): void {
    this.snapshot = {
      status: this.status,
      principal: this.sessions.getCurrent()?.principal ?? null,
      session: this.sessions.getCurrent(),
      context: { ...this.context },
      providers: this.providers.list(),
      roles: this.roles.list(),
      error: this.error,
      version: this.version,
    }
  }
}

export function createIdentityManager(
  config: IdentityConfig = {},
): IdentityManager {
  return new IdentityManager(resolveConfig(config))
}
