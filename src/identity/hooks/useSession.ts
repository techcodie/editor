import { useIdentity } from './useIdentity'
import type { IdentityManagerApi } from '../types/identity'

export function useSession(manager: IdentityManagerApi | null) {
  const identity = useIdentity(manager)
  return {
    session: identity.session,
    principal: identity.principal,
    context: identity.context,
    status: identity.status,
    error: identity.error,
  }
}
