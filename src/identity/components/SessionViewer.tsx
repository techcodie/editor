import { Building2, Clock3, KeyRound, UserRound } from 'lucide-react'
import type { IdentitySession } from '../types/identity'

interface SessionViewerProps {
  session: IdentitySession | null
  sessions: readonly IdentitySession[]
}

function timeLabel(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp)
}

export function SessionViewer({ session, sessions }: SessionViewerProps) {
  if (!session) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
        <UserRound size={20} className="text-neutral-300" aria-hidden />
        <p className="mt-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200">No active session</p>
        <p className="mt-1 text-[10px] text-neutral-500">The host can provide a principal or resolve one through a registered provider.</p>
      </div>
    )
  }

  return (
    <section aria-labelledby="active-session-title" className="space-y-4">
      <div>
        <h3 id="active-session-title" className="text-xs font-semibold text-neutral-950 dark:text-white">
          Active session
        </h3>
        <p className="mt-0.5 text-[10px] text-neutral-500">Token values are never displayed or audited</p>
      </div>
      <article className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            <UserRound size={16} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-neutral-950 dark:text-white">{session.principal.displayName}</p>
            <p className="truncate text-[9px] text-neutral-500">{session.principal.email ?? session.principal.id}</p>
          </div>
          <span className="ml-auto rounded bg-emerald-50 px-2 py-1 text-[8px] font-semibold uppercase text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {session.status}
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-md bg-neutral-50 p-2.5 dark:bg-neutral-900">
            <dt className="flex items-center gap-1 text-[8px] uppercase text-neutral-400"><Building2 size={10} aria-hidden />Workspace</dt>
            <dd className="mt-1 truncate text-[9px] font-semibold text-neutral-700 dark:text-neutral-300">{session.context.workspaceId}</dd>
          </div>
          <div className="rounded-md bg-neutral-50 p-2.5 dark:bg-neutral-900">
            <dt className="flex items-center gap-1 text-[8px] uppercase text-neutral-400"><KeyRound size={10} aria-hidden />Token</dt>
            <dd className="mt-1 text-[9px] font-semibold text-neutral-700 dark:text-neutral-300">{session.hasToken ? 'Provided by host' : 'Direct context'}</dd>
          </div>
        </dl>
      </article>
      <div>
        <h4 className="mb-2 text-[10px] font-semibold text-neutral-700 dark:text-neutral-300">Recent sessions</h4>
        <div className="space-y-1.5">
          {sessions.map((item) => (
            <article key={item.id} className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800">
              <Clock3 size={12} className="text-neutral-400" aria-hidden />
              <div className="min-w-0">
                <p className="truncate text-[9px] font-semibold text-neutral-700 dark:text-neutral-300">{item.principal.displayName}</p>
                <p className="text-[8px] text-neutral-400">{timeLabel(item.startedAt)}</p>
              </div>
              <span className="ml-auto text-[8px] font-semibold uppercase text-neutral-400">{item.status}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
