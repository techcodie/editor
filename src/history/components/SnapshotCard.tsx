import { useEffect, useState } from 'react'
import { Bookmark, Download, GitCompareArrows, MoreHorizontal, RotateCcw, Star, Trash2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { Version } from '../types/version'
import { VersionMetadata } from './VersionMetadata'

interface SnapshotCardProps {
  version: Version
  expanded: boolean
  busy: boolean
  onToggle: () => void
  onUpdate: (patch: { name?: string; description?: string; bookmarked?: boolean; favorite?: boolean }) => void
  onCompare: () => void
  onRestore: () => void
  onExport: () => void
  onDelete: () => void
}

export function SnapshotCard({ version, expanded, busy, onToggle, onUpdate, onCompare, onRestore, onExport, onDelete }: SnapshotCardProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(version.name)
  const [description, setDescription] = useState(version.description)
  useEffect(() => { setName(version.name); setDescription(version.description) }, [version.description, version.name])
  const save = () => { onUpdate({ name, description }); setEditing(false) }
  return (
    <article className={cn('rounded-lg border bg-white transition-[border-color,box-shadow] [content-visibility:auto] [contain-intrinsic-size:0_180px]', expanded ? 'border-indigo-200 shadow-[0_6px_20px_rgba(23,23,23,0.07)]' : 'border-neutral-200 hover:border-neutral-300')}>
      <div className="flex items-start gap-2 p-3">
        <button type="button" onClick={onToggle} aria-expanded={expanded} className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35">
          <span className="flex items-center gap-2">
            <span className="truncate text-xs font-semibold text-neutral-950">{version.name}</span>
            {version.metadata.source !== 'manual' && <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase', version.metadata.source === 'recovery' ? 'bg-amber-50 text-amber-700' : version.metadata.source === 'collaboration' ? 'bg-emerald-50 text-emerald-700' : version.metadata.source === 'contract' ? 'bg-cyan-50 text-cyan-700' : 'bg-indigo-50 text-indigo-700')}>{version.metadata.source === 'recovery' ? 'Recovery' : version.metadata.source === 'collaboration' ? 'Collaboration' : version.metadata.source === 'contract' ? 'Contract' : 'Workflow'}</span>}
          </span>
          <span className="mt-1 block text-[10px] text-neutral-500">{new Date(version.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · {version.author.name}</span>
          {version.description && <span className="mt-1.5 line-clamp-2 block text-[10px] leading-4 text-neutral-600">{version.description}</span>}
        </button>
        <button type="button" onClick={() => onUpdate({ bookmarked: !version.metadata.bookmarked })} disabled={busy} aria-label={version.metadata.bookmarked ? 'Remove bookmark' : 'Bookmark version'} className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35', version.metadata.bookmarked && 'text-indigo-600')}><Bookmark size={13} fill={version.metadata.bookmarked ? 'currentColor' : 'none'} aria-hidden /></button>
        <button type="button" onClick={() => onUpdate({ favorite: !version.metadata.favorite })} disabled={busy} aria-label={version.metadata.favorite ? 'Remove from favourites' : 'Add to favourites'} className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35', version.metadata.favorite && 'text-amber-500')}><Star size={13} fill={version.metadata.favorite ? 'currentColor' : 'none'} aria-hidden /></button>
      </div>
      {expanded && (
        <div className="border-t border-neutral-100 px-3 pb-3 pt-2.5">
          {editing ? (
            <div className="space-y-2">
              <label className="block"><span className="sr-only">Version name</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} className="h-8 w-full rounded-md border border-neutral-200 px-2.5 text-[11px] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15" /></label>
              <label className="block"><span className="sr-only">Version description</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={2} placeholder="Description" className="w-full resize-none rounded-md border border-neutral-200 px-2.5 py-2 text-[10px] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15" /></label>
              <div className="flex justify-end gap-1.5"><button type="button" onClick={() => setEditing(false)} className="h-7 rounded px-2.5 text-[10px] font-semibold text-neutral-500 hover:bg-neutral-100">Cancel</button><button type="button" onClick={save} className="h-7 rounded bg-neutral-900 px-2.5 text-[10px] font-semibold text-white hover:bg-neutral-800">Save</button></div>
            </div>
          ) : <VersionMetadata version={version} />}
          {!editing && (
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              <button type="button" onClick={onCompare} disabled={busy} className="flex h-8 items-center justify-center gap-1 rounded-md bg-neutral-100 text-[9px] font-semibold text-neutral-700 hover:bg-neutral-200 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><GitCompareArrows size={12} aria-hidden />Compare</button>
              <button type="button" onClick={onRestore} disabled={busy} className="flex h-8 items-center justify-center gap-1 rounded-md bg-indigo-50 text-[9px] font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><RotateCcw size={12} aria-hidden />Restore</button>
              <button type="button" onClick={onExport} disabled={busy} className="flex h-8 items-center justify-center gap-1 rounded-md bg-neutral-100 text-[9px] font-semibold text-neutral-700 hover:bg-neutral-200 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><Download size={12} aria-hidden />Export</button>
              <button type="button" onClick={() => setEditing(true)} disabled={busy} className="flex h-8 items-center justify-center gap-1 rounded-md bg-neutral-100 text-[9px] font-semibold text-neutral-700 hover:bg-neutral-200 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><MoreHorizontal size={12} aria-hidden />Edit</button>
            </div>
          )}
          {!editing && <button type="button" onClick={onDelete} disabled={busy} className="mt-2 flex h-7 w-full items-center justify-center gap-1 text-[9px] font-medium text-neutral-400 hover:text-red-600 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"><Trash2 size={11} aria-hidden />Delete snapshot</button>}
        </div>
      )}
    </article>
  )
}
