import type { IdentityPermission } from './permissions'

export const BUILT_IN_ROLE_IDS = [
  'viewer',
  'commenter',
  'reviewer',
  'editor',
  'approver',
  'owner',
  'administrator',
] as const

export type BuiltInRoleId = (typeof BUILT_IN_ROLE_IDS)[number]

export interface IdentityRole {
  id: string
  name: string
  description: string
  permissions: IdentityPermission[]
  builtIn?: boolean
}

export interface CustomIdentityRole extends IdentityRole {
  builtIn?: false
}
