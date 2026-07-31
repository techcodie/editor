import type {
  IdentityOrganizationContext,
  IdentityPrincipal,
} from '../types/identity'
import type {
  PermissionDecision,
  PermissionOverride,
  PermissionRequest,
} from '../types/permissions'
import type { RoleEngine } from './roleEngine'

interface PermissionEngineOptions {
  roles: RoleEngine
  getPrincipal: () => IdentityPrincipal | null
  getContext: () => IdentityOrganizationContext
  cacheTtlMs: number
  onDecision: (decision: PermissionDecision) => void
}

interface CachedDecision {
  decision: PermissionDecision
  expiresAt: number
}

function intersects(left: readonly string[] | undefined, right: readonly string[]): boolean {
  return !left?.length || left.some((value) => right.includes(value))
}

function matchesScope(
  override: PermissionOverride,
  principal: IdentityPrincipal,
  context: IdentityOrganizationContext,
  request: PermissionRequest,
): boolean {
  if (!override.permissions.includes(request.permission)) return false
  if (!intersects(override.principalIds, [principal.id])) return false
  if (!intersects(override.roleIds, principal.roleIds)) return false
  if (!intersects(override.tenantIds, [context.tenantId])) return false
  if (!intersects(override.organizationIds, [context.organizationId])) return false
  if (!intersects(override.workspaceIds, [context.workspaceId])) return false
  if (!intersects(override.departmentIds, context.departmentId ? [context.departmentId] : [])) return false
  if (!intersects(override.projectIds, context.projectId ? [context.projectId] : [])) return false
  if (!intersects(override.resourceIds, request.resource?.id ? [request.resource.id] : [])) return false
  return true
}

function decisionId(): string {
  return crypto.randomUUID()
}

export class PermissionEngine {
  private overrides: PermissionOverride[] = []
  private cache = new Map<string, CachedDecision>()
  private version = 0
  private readonly listeners = new Set<() => void>()
  private readonly options: PermissionEngineOptions

  constructor(options: PermissionEngineOptions) {
    this.options = options
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getVersion(): number {
    return this.version
  }

  setOverrides(overrides: readonly PermissionOverride[]): void {
    this.overrides = overrides.map((override) => ({
      ...override,
      permissions: [...override.permissions],
      principalIds: override.principalIds ? [...override.principalIds] : undefined,
      roleIds: override.roleIds ? [...override.roleIds] : undefined,
    }))
    this.invalidate()
  }

  invalidate(): void {
    this.cache.clear()
    this.version += 1
    for (const listener of this.listeners) listener()
  }

  decide(request: PermissionRequest): PermissionDecision {
    return this.evaluate(request, true)
  }

  peek(request: PermissionRequest): PermissionDecision {
    return this.evaluate(request, false)
  }

  private evaluate(
    request: PermissionRequest,
    emitDecision: boolean,
  ): PermissionDecision {
    const principal = this.options.getPrincipal()
    const context = this.options.getContext()
    const cacheKey = JSON.stringify([
      this.version,
      principal?.id ?? '',
      principal?.roleIds ?? [],
      context.tenantId,
      context.organizationId,
      context.workspaceId,
      context.departmentId ?? '',
      context.projectId ?? '',
      request.permission,
      request.action ?? '',
      request.resource?.type ?? '',
      request.resource?.id ?? '',
    ])
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      const decision = {
        ...cached.decision,
        id: decisionId(),
        evaluatedAt: Date.now(),
        cached: true,
      }
      if (emitDecision) this.options.onDecision(decision)
      return decision
    }

    const roleIds = principal?.roleIds ?? []
    let allowed = false
    let source: PermissionDecision['source'] = 'no-session'
    let reason = 'No active identity session is available.'

    if (principal) {
      const matching = this.overrides.filter((override) =>
        matchesScope(override, principal, context, request),
      )
      const denied = matching.find((override) => override.effect === 'deny')
      const granted = matching.find((override) => override.effect === 'allow')
      if (denied) {
        source = 'override'
        reason = denied.reason || `Denied by permission override "${denied.id}".`
      } else if (granted) {
        allowed = true
        source = 'override'
        reason = granted.reason || `Allowed by permission override "${granted.id}".`
      } else if (this.options.roles.permissionsFor(roleIds).has(request.permission)) {
        allowed = true
        source = 'role'
        reason = 'Allowed by an assigned role.'
      } else {
        source = 'default-deny'
        reason = 'No assigned role grants this permission.'
      }
    }

    const decision: PermissionDecision = {
      id: decisionId(),
      permission: request.permission,
      allowed,
      effect: allowed ? 'allow' : 'deny',
      source,
      reason,
      principalId: principal?.id ?? null,
      roleIds: [...roleIds],
      resource: request.resource,
      action: request.action,
      evaluatedAt: Date.now(),
      cached: false,
    }
    this.cache.set(cacheKey, {
      decision,
      expiresAt: Date.now() + this.options.cacheTtlMs,
    })
    if (emitDecision) this.options.onDecision(decision)
    return decision
  }

  can(permission: PermissionRequest['permission'], action?: string): boolean {
    return this.decide({ permission, action }).allowed
  }
}
