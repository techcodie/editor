import { Building2, KeyRound, ScrollText, ShieldCheck, UsersRound, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useIdentity } from '../hooks/useIdentity'
import { usePermissions } from '../hooks/usePermissions'
import type { IdentityManagerApi } from '../types/identity'
import { AccessDenied } from './AccessDenied'
import { AuditViewer } from './AuditViewer'
import { PermissionMatrix } from './PermissionMatrix'
import { ProviderSettings } from './ProviderSettings'
import { RoleManager } from './RoleManager'
import { SessionViewer } from './SessionViewer'

type IdentityView = 'access' | 'roles' | 'sessions' | 'audit' | 'providers'

const ADMIN_PERMISSION = ['administration'] as const

interface IdentitySettingsProps {
  isOpen: boolean
  manager: IdentityManagerApi
  onClose: () => void
}

const VIEWS: Array<{ id: IdentityView; label: string; icon: typeof ShieldCheck }> = [
  { id: 'access', label: 'Access', icon: ShieldCheck },
  { id: 'roles', label: 'Roles', icon: UsersRound },
  { id: 'sessions', label: 'Sessions', icon: KeyRound },
  { id: 'audit', label: 'Audit', icon: ScrollText },
  { id: 'providers', label: 'Providers', icon: Building2 },
]

export function IdentitySettings({ isOpen, manager, onClose }: IdentitySettingsProps) {
  const panelRef = useRef<HTMLElement>(null)
  const [view, setView] = useState<IdentityView>('access')
  const identity = useIdentity(manager)
  const permissions = usePermissions(manager, ADMIN_PERMISSION)
  const canAdminister = permissions.can('administration')

  useEffect(() => {
    if (!isOpen) return
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>('[aria-label="Close identity settings"]')?.focus())
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const requiresAdministration = view === 'roles' || view === 'audit' || view === 'providers'

  return (
    <>
      <button type="button" aria-label="Close identity settings" onClick={onClose} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] lg:hidden" />
      <aside ref={panelRef} id="identity-settings" role="dialog" aria-modal="true" aria-labelledby="identity-settings-title" className="fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-hidden border-l border-neutral-200 bg-white shadow-[var(--document-editor-shadow-overlay)] [animation:review-sidebar-in_180ms_ease-out] dark:border-neutral-800 dark:bg-neutral-950 sm:max-w-[32rem] lg:sticky lg:top-6 lg:z-30 lg:h-[calc(100vh-3rem)] lg:w-[31rem] lg:rounded-lg lg:border">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"><ShieldCheck size={16} aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <h2 id="identity-settings-title" className="truncate text-sm font-semibold text-neutral-950 dark:text-white">Identity & access</h2>
            <p className="truncate text-[10px] text-neutral-500">{identity.principal?.displayName ?? 'No active identity'} · {identity.context.workspaceId}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close identity settings" className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 dark:hover:bg-neutral-800 dark:hover:text-white"><X size={15} aria-hidden /></button>
        </header>
        <nav className="grid shrink-0 grid-cols-5 border-b border-neutral-200 bg-neutral-50 p-1.5 dark:border-neutral-800 dark:bg-neutral-900" aria-label="Identity settings views">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setView(id)} aria-pressed={view === id} className={view === id ? 'flex h-9 min-w-0 items-center justify-center gap-1 rounded-md bg-white px-1 text-[9px] font-semibold text-neutral-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 dark:bg-neutral-800 dark:text-white' : 'flex h-9 min-w-0 items-center justify-center gap-1 rounded-md px-1 text-[9px] font-semibold text-neutral-500 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 dark:hover:text-neutral-200'}>
              <Icon size={11} aria-hidden />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          {requiresAdministration && !canAdminister ? (
            <AccessDenied permission="administration" />
          ) : view === 'access' ? (
            <PermissionMatrix roles={identity.roles} initialRoleId={identity.principal?.roleIds[0]} />
          ) : view === 'roles' ? (
            <RoleManager roles={identity.roles} assignedRoleIds={identity.principal?.roleIds ?? []} />
          ) : view === 'sessions' ? (
            <SessionViewer session={identity.session} sessions={manager.getSessions()} />
          ) : view === 'audit' ? (
            <AuditViewer manager={manager} />
          ) : (
            <ProviderSettings providers={identity.providers} />
          )}
        </div>
        <footer className="flex shrink-0 items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-2.5 text-[9px] text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
          <span>{identity.context.organizationId}</span>
          <span className="font-medium">{identity.status === 'resolving' ? 'Resolving identity' : 'Host-controlled identity'}</span>
        </footer>
      </aside>
    </>
  )
}
