import { Check, Minus } from 'lucide-react'
import { useState } from 'react'
import {
  IDENTITY_PERMISSIONS,
  type IdentityPermission,
} from '../types/permissions'
import type { IdentityRole } from '../types/roles'

const PERMISSION_LABELS: Record<IdentityPermission, string> = {
  'document.read': 'Document read',
  'document.edit': 'Document edit',
  comment: 'Comment',
  'track-changes': 'Track changes',
  approve: 'Approve',
  export: 'Export',
  redact: 'Redact',
  'ai.access': 'AI access',
  'form-builder': 'Form builder',
  workflow: 'Workflow',
  'contract-intelligence': 'Contract intelligence',
  search: 'Search',
  administration: 'Administration',
}

interface PermissionMatrixProps {
  roles: IdentityRole[]
  initialRoleId?: string
}

export function PermissionMatrix({ roles, initialRoleId }: PermissionMatrixProps) {
  const [roleId, setRoleId] = useState(
    initialRoleId && roles.some((role) => role.id === initialRoleId)
      ? initialRoleId
      : roles[0]?.id ?? '',
  )
  const role = roles.find((item) => item.id === roleId) ?? roles[0]
  const granted = new Set(role?.permissions ?? [])

  return (
    <section aria-labelledby="permission-matrix-title">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 id="permission-matrix-title" className="text-xs font-semibold text-neutral-950 dark:text-white">
            Permission matrix
          </h3>
          <p className="mt-0.5 text-[10px] text-neutral-500">Effective grants by role</p>
        </div>
        <label className="min-w-32">
          <span className="sr-only">Role to inspect</span>
          <select
            value={role?.id ?? ''}
            onChange={(event) => setRoleId(event.target.value)}
            className="h-8 w-full rounded-md border border-neutral-200 bg-white px-2 text-[10px] font-semibold text-neutral-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
          >
            {roles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
        {IDENTITY_PERMISSIONS.map((permission) => {
          const allowed = granted.has(permission)
          return (
            <div
              key={permission}
              className="flex h-9 items-center gap-3 border-b border-neutral-100 px-3 last:border-b-0 dark:border-neutral-900"
            >
              <span
                className={
                  allowed
                    ? 'flex h-5 w-5 items-center justify-center rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'flex h-5 w-5 items-center justify-center rounded bg-neutral-100 text-neutral-400 dark:bg-neutral-900'
                }
              >
                {allowed ? <Check size={11} strokeWidth={2.2} aria-hidden /> : <Minus size={11} aria-hidden />}
              </span>
              <span className="text-[10px] font-medium text-neutral-700 dark:text-neutral-300">
                {PERMISSION_LABELS[permission]}
              </span>
              <span className="ml-auto font-mono text-[8px] text-neutral-400">{permission}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
