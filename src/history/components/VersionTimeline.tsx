import { Clock3 } from 'lucide-react'
import type { VersionGroup } from '../types/history'
import type { Version } from '../types/version'
import { SnapshotCard } from './SnapshotCard'

interface VersionTimelineProps {
  groups: VersionGroup[]
  selectedId: string | null
  busy: boolean
  onSelect: (id: string | null) => void
  onUpdate: (version: Version, patch: { name?: string; description?: string; bookmarked?: boolean; favorite?: boolean }) => void
  onCompare: (version: Version) => void
  onRestore: (version: Version) => void
  onExport: (version: Version) => void
  onDelete: (version: Version) => void
}

export function VersionTimeline({ groups, selectedId, busy, onSelect, onUpdate, onCompare, onRestore, onExport, onDelete }: VersionTimelineProps) {
  if (groups.length === 0) return (
    <div className="flex min-h-64 flex-col items-center justify-center px-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-400"><Clock3 size={18} aria-hidden /></span>
      <h3 className="mt-3 text-xs font-semibold text-neutral-900">No versions found</h3>
      <p className="mt-1 max-w-56 text-[10px] leading-4 text-neutral-500">Save a snapshot to create a recoverable point in this document’s timeline.</p>
    </div>
  )
  return <div className="space-y-5 p-3">{groups.map((group) => <section key={group.id} aria-labelledby={`history-group-${group.id}`}><div className="mb-2 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-neutral-300" /><h3 id={`history-group-${group.id}`} className="text-[9px] font-semibold uppercase text-neutral-400">{group.label}</h3><span className="h-px flex-1 bg-neutral-100" /></div><div className="space-y-2 pl-2">{group.versions.map((version) => <SnapshotCard key={version.id} version={version} expanded={selectedId === version.id} busy={busy} onToggle={() => onSelect(selectedId === version.id ? null : version.id)} onUpdate={(patch) => onUpdate(version, patch)} onCompare={() => onCompare(version)} onRestore={() => onRestore(version)} onExport={() => onExport(version)} onDelete={() => onDelete(version)} />)}</div></section>)}</div>
}
