import {
  IDENTITY_PERMISSIONS,
  type IdentityPermission,
} from '../types/permissions'
import {
  type CustomIdentityRole,
  type IdentityRole,
} from '../types/roles'

const ROLE_DEFINITIONS: IdentityRole[] = [
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Can read documents and use search.',
    permissions: ['document.read', 'search'],
  },
  {
    id: 'commenter',
    name: 'Commenter',
    description: 'Can read, search, and participate in comment discussions.',
    permissions: ['document.read', 'search', 'comment'],
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    description: 'Can comment, review tracked changes, and inspect document intelligence.',
    permissions: [
      'document.read',
      'search',
      'comment',
      'track-changes',
      'ai.access',
      'contract-intelligence',
    ],
  },
  {
    id: 'editor',
    name: 'Editor',
    description: 'Can author, review, export, redact, and build forms.',
    permissions: [
      'document.read',
      'document.edit',
      'comment',
      'track-changes',
      'export',
      'redact',
      'ai.access',
      'form-builder',
      'contract-intelligence',
      'search',
    ],
  },
  {
    id: 'approver',
    name: 'Approver',
    description: 'Can review and make approval workflow decisions.',
    permissions: [
      'document.read',
      'comment',
      'track-changes',
      'approve',
      'export',
      'ai.access',
      'workflow',
      'contract-intelligence',
      'search',
    ],
  },
  {
    id: 'owner',
    name: 'Owner',
    description: 'Can manage all document and workspace capabilities.',
    permissions: IDENTITY_PERMISSIONS.filter(
      (permission) => permission !== 'administration',
    ),
  },
  {
    id: 'administrator',
    name: 'Administrator',
    description: 'Can manage identity settings and every editor capability.',
    permissions: [...IDENTITY_PERMISSIONS],
  },
]

function normalizeRole(role: IdentityRole, builtIn: boolean): IdentityRole {
  const permissions = [...new Set(role.permissions)].filter((permission) =>
    IDENTITY_PERMISSIONS.includes(permission),
  )
  if (!role.id.trim() || !role.name.trim()) {
    throw new Error('Roles require a non-empty id and name.')
  }
  return {
    ...role,
    id: role.id.trim(),
    name: role.name.trim(),
    description: role.description.trim(),
    permissions,
    builtIn,
  }
}

export class RoleEngine {
  private readonly roles = new Map<string, IdentityRole>()

  constructor(customRoles: readonly CustomIdentityRole[] = []) {
    for (const role of ROLE_DEFINITIONS) {
      this.roles.set(role.id, normalizeRole(role, true))
    }
    for (const role of customRoles) this.register(role)
  }

  register(role: CustomIdentityRole): () => void {
    if (this.roles.get(role.id)?.builtIn) {
      throw new Error(`Built-in role "${role.id}" cannot be replaced.`)
    }
    const normalized = normalizeRole(role, false)
    this.roles.set(normalized.id, normalized)
    return () => this.roles.delete(normalized.id)
  }

  get(roleId: string): IdentityRole | null {
    return this.roles.get(roleId) ?? null
  }

  list(): IdentityRole[] {
    return [...this.roles.values()]
  }

  permissionsFor(roleIds: readonly string[]): Set<IdentityPermission> {
    const permissions = new Set<IdentityPermission>()
    for (const roleId of roleIds) {
      for (const permission of this.roles.get(roleId)?.permissions ?? []) {
        permissions.add(permission)
      }
    }
    return permissions
  }
}

export function getBuiltInIdentityRoles(): IdentityRole[] {
  return ROLE_DEFINITIONS.map((role) => normalizeRole(role, true))
}
