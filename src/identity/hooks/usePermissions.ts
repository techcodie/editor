import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import type { IdentityManagerApi } from '../types/identity'
import type {
  IdentityPermission,
  PermissionDecision,
  PermissionRequest,
} from '../types/permissions'

const EMPTY_SUBSCRIBE = () => () => {}
const ZERO_VERSION = () => 0
const EMPTY_PERMISSIONS: readonly IdentityPermission[] = []

export function usePermissions(
  manager: IdentityManagerApi | null,
  requested: readonly IdentityPermission[] = EMPTY_PERMISSIONS,
) {
  const identityVersion = useSyncExternalStore(
    manager?.subscribe ?? EMPTY_SUBSCRIBE,
    () => manager?.getSnapshot().version ?? 0,
    ZERO_VERSION,
  )
  const permissionVersion = useSyncExternalStore(
    manager?.subscribePermissions ?? EMPTY_SUBSCRIBE,
    manager?.getPermissionVersion ?? ZERO_VERSION,
    ZERO_VERSION,
  )

  const decisions = useMemo(() => {
    void identityVersion
    void permissionVersion
    const map = new Map<IdentityPermission, PermissionDecision>()
    if (!manager) {
      for (const permission of requested) {
        map.set(permission, {
          id: `disabled-${permission}`,
          permission,
          allowed: true,
          effect: 'allow',
          source: 'role',
          reason: 'Identity enforcement is disabled.',
          principalId: null,
          roleIds: [],
          evaluatedAt: Date.now(),
          cached: false,
        })
      }
      return map
    }
    for (const permission of requested) {
      map.set(permission, manager.peek({ permission }))
    }
    return map
  }, [identityVersion, manager, permissionVersion, requested])

  useEffect(() => {
    if (!manager) return
    for (const permission of requested) manager.decide({ permission })
  }, [identityVersion, manager, permissionVersion, requested])

  const can = useCallback(
    (permission: IdentityPermission, action?: string) => {
      const decision = decisions.get(permission)
      if (decision && !action) return decision.allowed
      return manager?.can(permission, action) ?? true
    },
    [decisions, manager],
  )

  const decide = useCallback(
    (request: PermissionRequest) =>
      manager?.decide(request) ?? {
        id: `disabled-${request.permission}`,
        permission: request.permission,
        allowed: true,
        effect: 'allow' as const,
        source: 'role' as const,
        reason: 'Identity enforcement is disabled.',
        principalId: null,
        roleIds: [],
        resource: request.resource,
        action: request.action,
        evaluatedAt: Date.now(),
        cached: false,
      },
    [manager],
  )

  return { decisions, can, decide }
}
