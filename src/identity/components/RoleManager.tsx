import { Crown, Shield, UserRound } from 'lucide-react'
import type { IdentityRole } from '../types/roles'

interface RoleManagerProps {
  roles: IdentityRole[]
  assignedRoleIds: readonly string[]
}

export function RoleManager({ roles, assignedRoleIds }: RoleManagerProps) {
  return (
    <section aria-labelledby="identity-roles-title">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h3 id="identity-roles-title" className="text-xs font-semibold text-neutral-950 dark:text-white">
            Role registry
          </h3>
          <p className="mt-0.5 text-[10px] text-neutral-500">
            Built-in and host-registered roles
          </p>
        </div>
        <span className="text-[9px] tabular-nums text-neutral-400">{roles.length} roles</span>
      </div>
      <div className="space-y-2">
        {roles.map((role) => {
          const assigned = assignedRoleIds.includes(role.id)
          const Icon = role.id === 'owner' || role.id === 'administrator'
            ? Crown
            : role.builtIn
              ? Shield
              : UserRound
          return (
            <article
              key={role.id}
              className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <div className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
                  <Icon size={14} strokeWidth={1.8} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h4 className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100">
                      {role.name}
                    </h4>
                    {assigned && (
                      <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[8px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        Assigned
                      </span>
                    )}
                    {!role.builtIn && (
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[8px] font-semibold text-neutral-500 dark:bg-neutral-900">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[9px] leading-4 text-neutral-500">{role.description}</p>
                  <p className="mt-1.5 text-[9px] font-medium text-neutral-400">
                    {role.permissions.length} permissions
                  </p>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
