import { Activity, CheckCircle2, ShieldX } from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'
import type {
  IdentityAuditCategory,
  IdentityManagerApi,
} from '../types/identity'

const CATEGORIES: Array<'all' | IdentityAuditCategory> = [
  'all',
  'permission',
  'workflow',
  'export',
  'redaction',
  'ai',
  'session',
  'administration',
]

interface AuditViewerProps {
  manager: IdentityManagerApi
}

function auditTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(timestamp)
}

export function AuditViewer({ manager }: AuditViewerProps) {
  const events = useSyncExternalStore(
    manager.subscribeAudit,
    manager.getAuditEvents,
    manager.getAuditEvents,
  )
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('all')
  const visible = category === 'all'
    ? events
    : events.filter((event) => event.category === category)

  return (
    <section aria-labelledby="identity-audit-title">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 id="identity-audit-title" className="text-xs font-semibold text-neutral-950 dark:text-white">Audit stream</h3>
          <p className="mt-0.5 text-[10px] text-neutral-500">Bounded local view with host adapter forwarding</p>
        </div>
        <label>
          <span className="sr-only">Filter audit category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-[9px] font-semibold capitalize outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 dark:border-neutral-700 dark:bg-neutral-900">
            {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-3 space-y-1.5">
        {!visible.length && (
          <div className="flex min-h-40 flex-col items-center justify-center text-center">
            <Activity size={18} className="text-neutral-300" aria-hidden />
            <p className="mt-2 text-[10px] text-neutral-500">No matching audit events</p>
          </div>
        )}
        {visible.map((event) => {
          const allowed = event.outcome === 'allowed' || event.outcome === 'success'
          const Icon = allowed ? CheckCircle2 : ShieldX
          return (
            <article key={event.id} className="flex items-start gap-2.5 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
              <span className={allowed ? 'mt-0.5 text-emerald-600' : 'mt-0.5 text-red-600'}>
                <Icon size={13} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[9px] font-semibold text-neutral-800 dark:text-neutral-200">{event.action}</p>
                  <span className="ml-auto text-[8px] tabular-nums text-neutral-400">{auditTime(event.timestamp)}</span>
                </div>
                <p className="mt-0.5 truncate text-[8px] text-neutral-500">
                  {event.principalName ?? 'Anonymous'} · {event.category} · {event.outcome}
                </p>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
