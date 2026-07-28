import { Check, CircleAlert, LoaderCircle } from 'lucide-react'
import type { CollaborationSyncStatus } from '../types/collaboration'

export function SyncStatus({ status }: { status: CollaborationSyncStatus }) {
  if (status === 'syncing') {
    return <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500"><LoaderCircle size={12} className="animate-spin" aria-hidden />Syncing</span>
  }
  if (status === 'conflict') {
    return <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-700"><CircleAlert size={12} aria-hidden />Reconciled</span>
  }
  if (status === 'synced') {
    return <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500"><Check size={12} aria-hidden />All changes synced</span>
  }
  return <span className="text-[11px] text-neutral-400">Waiting for changes</span>
}
