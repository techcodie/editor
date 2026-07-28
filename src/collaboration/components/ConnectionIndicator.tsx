import { CircleAlert, Cloud, CloudOff, LoaderCircle } from 'lucide-react'
import type { CollaborationConnectionStatus } from '../types/collaboration'

export function ConnectionIndicator({ status }: { status: CollaborationConnectionStatus }) {
  const details = {
    connected: { label: 'Connected', Icon: Cloud, className: 'text-emerald-600' },
    connecting: { label: 'Connecting', Icon: LoaderCircle, className: 'animate-spin text-neutral-400' },
    reconnecting: { label: 'Reconnecting', Icon: LoaderCircle, className: 'animate-spin text-amber-600' },
    error: { label: 'Connection error', Icon: CircleAlert, className: 'text-red-600' },
    disconnected: { label: 'Disconnected', Icon: CloudOff, className: 'text-neutral-400' },
  }[status]
  const { Icon } = details

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${details.className}`}>
      <Icon size={13} strokeWidth={1.9} aria-hidden />
      {details.label}
    </span>
  )
}
