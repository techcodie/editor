export const IDENTITY_PERMISSIONS = [
  'document.read',
  'document.edit',
  'comment',
  'track-changes',
  'approve',
  'export',
  'redact',
  'ai.access',
  'form-builder',
  'workflow',
  'contract-intelligence',
  'search',
  'administration',
] as const

export type IdentityPermission = (typeof IDENTITY_PERMISSIONS)[number]
export type PermissionEffect = 'allow' | 'deny'
export type PermissionDecisionSource =
  | 'role'
  | 'override'
  | 'default-deny'
  | 'no-session'

export interface PermissionResource {
  type: 'document' | 'workspace' | 'organization' | 'tenant' | 'feature'
  id?: string
}

export interface PermissionRequest {
  permission: IdentityPermission
  action?: string
  resource?: PermissionResource
}

export interface PermissionDecision {
  id: string
  permission: IdentityPermission
  allowed: boolean
  effect: PermissionEffect
  source: PermissionDecisionSource
  reason: string
  principalId: string | null
  roleIds: string[]
  resource?: PermissionResource
  action?: string
  evaluatedAt: number
  cached: boolean
}

export interface PermissionOverride {
  id: string
  effect: PermissionEffect
  permissions: IdentityPermission[]
  reason?: string
  principalIds?: string[]
  roleIds?: string[]
  tenantIds?: string[]
  organizationIds?: string[]
  workspaceIds?: string[]
  departmentIds?: string[]
  projectIds?: string[]
  resourceIds?: string[]
}
