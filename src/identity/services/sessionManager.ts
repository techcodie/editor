import type {
  IdentityOrganizationContext,
  IdentityPrincipal,
  IdentitySession,
  IdentityToken,
} from '../types/identity'

const SESSION_HISTORY_LIMIT = 20

function copyPrincipal(principal: IdentityPrincipal): IdentityPrincipal {
  return {
    ...principal,
    roleIds: [...principal.roleIds],
    groupIds: principal.groupIds ? [...principal.groupIds] : undefined,
    attributes: principal.attributes ? { ...principal.attributes } : undefined,
  }
}

function copyContext(
  context: IdentityOrganizationContext,
): IdentityOrganizationContext {
  return {
    ...context,
    attributes: context.attributes ? { ...context.attributes } : undefined,
  }
}

export class SessionManager {
  private current: IdentitySession | null = null
  private sessions: IdentitySession[] = []

  start(
    principal: IdentityPrincipal,
    context: IdentityOrganizationContext,
    providerId: string | null,
    token?: IdentityToken,
  ): IdentitySession {
    if (this.current?.status === 'active') this.end()
    const now = Date.now()
    const session: IdentitySession = {
      id: crypto.randomUUID(),
      principal: copyPrincipal(principal),
      providerId,
      context: copyContext(context),
      status: token?.expiresAt && token.expiresAt <= now ? 'expired' : 'active',
      startedAt: now,
      lastActiveAt: now,
      expiresAt: token?.expiresAt,
      hasToken: Boolean(token?.value),
    }
    this.current = session
    this.sessions = [session, ...this.sessions].slice(0, SESSION_HISTORY_LIMIT)
    return session
  }

  touch(): void {
    if (!this.current || this.current.status !== 'active') return
    this.current = { ...this.current, lastActiveAt: Date.now() }
    this.sessions = this.sessions.map((session) =>
      session.id === this.current?.id ? this.current : session,
    )
  }

  end(): IdentitySession | null {
    if (!this.current) return null
    const ended: IdentitySession = {
      ...this.current,
      status: 'ended',
      endedAt: Date.now(),
    }
    this.sessions = this.sessions.map((session) =>
      session.id === ended.id ? ended : session,
    )
    this.current = null
    return ended
  }

  getCurrent(): IdentitySession | null {
    if (
      this.current?.expiresAt &&
      this.current.expiresAt <= Date.now() &&
      this.current.status === 'active'
    ) {
      this.current = { ...this.current, status: 'expired' }
      this.sessions = this.sessions.map((session) =>
        session.id === this.current?.id ? this.current : session,
      )
    }
    return this.current
  }

  list(): readonly IdentitySession[] {
    this.getCurrent()
    return this.sessions
  }
}
