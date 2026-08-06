import { Building2, KeyRound, ScrollText, ShieldCheck, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { PanelShell } from '../../components/ui/PanelShell'
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
  const [view, setView] = useState<IdentityView>('access')
  const identity = useIdentity(manager)
  const permissions = usePermissions(manager, ADMIN_PERMISSION)
  const canAdminister = permissions.can('administration')

  const requiresAdministration = view === 'roles' || view === 'audit' || view === 'providers'

  return (
    <PanelShell
      isOpen={isOpen}
      onClose={onClose}
      initialFocusSelector='[aria-label="Close identity & access"]'
      title="Identity & access"
      subtitle={`${identity.principal?.displayName ?? 'No active identity'} · ${identity.context.workspaceId}`}
      icon={ShieldCheck}
      iconTone="accent"
      labelledById="identity-settings-title"
      panelId="identity-settings"
      widthClassName="sm:max-w-[32rem] lg:w-[31rem]"
      footer={<div className="-mx-4 -my-3 flex items-center justify-between bg-neutral-50 px-4 py-2.5 text-[9px] text-neutral-500 dark:bg-neutral-900"><span>{identity.context.organizationId}</span><span className="font-medium">{identity.status === 'resolving' ? 'Resolving identity' : 'Host-controlled identity'}</span></div>}
    >
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
    </PanelShell>
  )
}
