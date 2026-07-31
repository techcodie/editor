import type { AuditAdapter } from '../services/auditAdapter'
import type {
  PermissionDecision,
  PermissionOverride,
  PermissionRequest,
} from './permissions'
import type { CustomIdentityRole, IdentityRole } from './roles'

export type IdentityProviderProtocol =
  | 'host'
  | 'azure-ad'
  | 'okta'
  | 'auth0'
  | 'google-workspace'
  | 'keycloak'
  | 'ldap'
  | 'saml'
  | 'oidc'
  | 'custom'

export type IdentityProviderCapability =
  | 'identity'
  | 'groups'
  | 'roles'
  | 'token-refresh'
  | 'single-sign-on'

export interface IdentityToken {
  value: string
  type?: string
  expiresAt?: number
}

export interface IdentityOrganizationContext {
  tenantId: string
  organizationId: string
  workspaceId: string
  departmentId?: string
  projectId?: string
  attributes?: Record<string, string>
}

export interface IdentityPrincipal {
  id: string
  displayName: string
  email?: string
  avatarUrl?: string
  roleIds: string[]
  groupIds?: string[]
  attributes?: Record<string, string>
}

export interface IdentityResolutionRequest {
  token?: IdentityToken
  context: IdentityOrganizationContext
  signal?: AbortSignal
}

export interface IdentityProvider {
  id: string
  name: string
  protocol: IdentityProviderProtocol
  capabilities?: IdentityProviderCapability[]
  resolveIdentity(
    request: IdentityResolutionRequest,
  ): IdentityPrincipal | Promise<IdentityPrincipal>
}

export type IdentitySessionStatus = 'active' | 'expired' | 'ended'

export interface IdentitySession {
  id: string
  principal: IdentityPrincipal
  providerId: string | null
  context: IdentityOrganizationContext
  status: IdentitySessionStatus
  startedAt: number
  lastActiveAt: number
  endedAt?: number
  expiresAt?: number
  hasToken: boolean
}

export type IdentityAuditCategory =
  | 'identity'
  | 'session'
  | 'permission'
  | 'workflow'
  | 'export'
  | 'redaction'
  | 'ai'
  | 'administration'

export type IdentityAuditOutcome = 'allowed' | 'denied' | 'success' | 'failure'

export interface IdentityAuditEvent {
  id: string
  category: IdentityAuditCategory
  action: string
  outcome: IdentityAuditOutcome
  timestamp: number
  principalId: string | null
  principalName: string | null
  sessionId: string | null
  context: IdentityOrganizationContext
  resourceId?: string
  details?: Record<string, string | number | boolean | null>
}

export interface IdentityAuditInput {
  category: IdentityAuditCategory
  action: string
  outcome: IdentityAuditOutcome
  resourceId?: string
  details?: Record<string, string | number | boolean | null>
}

export interface IdentityConfig {
  providers?: IdentityProvider[]
  defaultProviderId?: string
  principal?: IdentityPrincipal
  token?: IdentityToken
  context?: Partial<IdentityOrganizationContext>
  roles?: CustomIdentityRole[]
  permissionOverrides?: PermissionOverride[]
  auditAdapter?: AuditAdapter
  auditBufferSize?: number
  permissionCacheTtlMs?: number
}

export interface ResolvedIdentityConfig {
  providers: IdentityProvider[]
  defaultProviderId?: string
  principal: IdentityPrincipal
  token?: IdentityToken
  context: IdentityOrganizationContext
  roles: CustomIdentityRole[]
  permissionOverrides: PermissionOverride[]
  auditAdapter?: AuditAdapter
  auditBufferSize: number
  permissionCacheTtlMs: number
}

export type IdentityManagerStatus = 'ready' | 'resolving' | 'error'

export interface IdentityManagerSnapshot {
  status: IdentityManagerStatus
  principal: IdentityPrincipal | null
  session: IdentitySession | null
  context: IdentityOrganizationContext
  providers: IdentityProvider[]
  roles: IdentityRole[]
  error: string | null
  version: number
}

export interface IdentityManagerApi {
  getSnapshot(): IdentityManagerSnapshot
  getAuditEvents(): readonly IdentityAuditEvent[]
  getSessions(): readonly IdentitySession[]
  getPermissionVersion(): number
  subscribe(listener: () => void): () => void
  subscribePermissions(listener: () => void): () => void
  subscribeAudit(listener: () => void): () => void
  registerProvider(provider: IdentityProvider): () => void
  registerRole(role: CustomIdentityRole): () => void
  setPermissionOverrides(overrides: PermissionOverride[]): void
  setIdentityToken(token?: IdentityToken): void
  setOrganizationContext(context: Partial<IdentityOrganizationContext>): void
  setPrincipal(principal: IdentityPrincipal): void
  resolveSession(providerId?: string, signal?: AbortSignal): Promise<IdentitySession>
  endSession(): void
  peek(request: PermissionRequest): PermissionDecision
  decide(request: PermissionRequest): PermissionDecision
  can(permission: PermissionRequest['permission'], action?: string): boolean
  audit(input: IdentityAuditInput): IdentityAuditEvent
}
