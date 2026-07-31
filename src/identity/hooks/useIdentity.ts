import { useSyncExternalStore } from 'react'
import type {
  IdentityManagerApi,
  IdentityManagerSnapshot,
} from '../types/identity'

const EMPTY_SNAPSHOT: IdentityManagerSnapshot = {
  status: 'ready',
  principal: null,
  session: null,
  context: {
    tenantId: '',
    organizationId: '',
    workspaceId: '',
  },
  providers: [],
  roles: [],
  error: null,
  version: 0,
}

export function useIdentity(manager: IdentityManagerApi | null) {
  return useSyncExternalStore(
    manager?.subscribe ?? (() => () => {}),
    manager?.getSnapshot ?? (() => EMPTY_SNAPSHOT),
    manager?.getSnapshot ?? (() => EMPTY_SNAPSHOT),
  )
}
