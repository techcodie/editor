import { LockKeyhole } from 'lucide-react'
import type { IdentityPermission } from '../types/permissions'

interface AccessDeniedProps {
  permission: IdentityPermission
  reason?: string
  compact?: boolean
}

export function AccessDenied({
  permission,
  reason = 'Your current role does not grant this capability.',
  compact = false,
}: AccessDeniedProps) {
  return (
    <div
      role="alert"
      className={
        compact
          ? 'flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
          : 'flex min-h-56 flex-col items-center justify-center px-6 text-center'
      }
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-amber-200 bg-white text-amber-700 dark:border-amber-800 dark:bg-neutral-950 dark:text-amber-300">
        <LockKeyhole size={16} strokeWidth={1.8} aria-hidden />
      </span>
      <div className={compact ? 'min-w-0' : 'mt-3'}>
        <h3 className="text-xs font-semibold">Access restricted</h3>
        <p className="mt-1 text-[10px] leading-4 opacity-80">{reason}</p>
        <p className="mt-1 font-mono text-[9px] opacity-60">{permission}</p>
      </div>
    </div>
  )
}
