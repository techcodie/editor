import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Code2, Copy, ExternalLink, Share2, X } from 'lucide-react'
import type { EditorApi } from '../../lib/editor-api'
import { serializeForm } from '../../forms/services/formSerializer'
import {
  createFormShareArtifact,
  revokeFormShareArtifact,
} from '../services/shareEngine'
import type { FormShareArtifact } from '../types/viewer'

interface ShareDialogProps {
  isOpen: boolean
  api: EditorApi | null
  onArtifactCreated: (shareId: string) => void
  onClose: () => void
}

export function ShareDialog({ isOpen, api, onArtifactCreated, onClose }: ShareDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [title, setTitle] = useState('Shared document form')
  const [artifact, setArtifact] = useState<FormShareArtifact | null>(null)
  const [status, setStatus] = useState('')
  const form = useMemo(
    () => isOpen && api ? serializeForm(api.getDocumentSnapshot(), title) : null,
    [api, isOpen, title],
  )

  useEffect(() => {
    if (!isOpen || !api || !form) return
    const next = createFormShareArtifact(form, {
      title,
      description: 'Complete the requested fields below.',
      documentText: api.getDocumentText(),
    })
    onArtifactCreated(next.id)
    setArtifact((current) => {
      revokeFormShareArtifact(current)
      return next
    })
    return () => revokeFormShareArtifact(next)
  }, [api, form, isOpen, onArtifactCreated, title])

  useEffect(() => {
    if (!isOpen) return
    const previous = document.activeElement as HTMLElement | null
    requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>('input')?.focus())
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previous?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setStatus(message)
    } catch {
      setStatus('Clipboard access is unavailable. Open or download the form instead.')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/35 p-3 backdrop-blur-[2px] sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div ref={dialogRef} id="form-share-dialog" role="dialog" aria-modal="true" aria-labelledby="form-share-title" className="flex max-h-[min(42rem,calc(100vh-1.5rem))] w-full max-w-[34rem] flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-[var(--document-editor-shadow-overlay)]">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 px-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-700"><Share2 size={16} aria-hidden /></span>
          <div className="min-w-0"><h2 id="form-share-title" className="truncate text-sm font-semibold text-neutral-950">Share HTML form</h2><p className="text-[10px] text-neutral-500">{form?.fields.length ?? 0} form fields</p></div>
          <button type="button" onClick={onClose} aria-label="Close form sharing" className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><X size={16} aria-hidden /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <label htmlFor="form-share-name" className="mb-1.5 block text-[11px] font-semibold text-neutral-700">Form title</label>
          <input id="form-share-name" value={title} maxLength={120} onChange={(event) => { setTitle(event.target.value); setStatus('') }} className="h-10 w-full rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
          <section className="mt-4 border-y border-neutral-200 py-4">
            <div className="flex items-center gap-2"><Code2 size={15} className="text-neutral-500" aria-hidden /><h3 className="text-xs font-semibold text-neutral-900">Standalone HTML</h3><span className="ml-auto rounded bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">Ready</span></div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-[10px]"><div><dt className="text-neutral-500">Template</dt><dd className="mt-0.5 font-semibold text-neutral-800">Read only</dd></div><div><dt className="text-neutral-500">Persistence</dt><dd className="mt-0.5 font-semibold text-neutral-800">Host callback</dd></div></dl>
          </section>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button type="button" disabled={!artifact} onClick={() => artifact && window.open(artifact.url, '_blank', 'noopener,noreferrer')} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-neutral-900 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><ExternalLink size={14} aria-hidden />Open form</button>
            <button type="button" disabled={!artifact} onClick={() => artifact && void copy(artifact.url, 'Session link copied.')} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><Copy size={14} aria-hidden />Copy link</button>
            <button type="button" disabled={!artifact} onClick={() => artifact && void copy(artifact.html, 'HTML copied.')} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><Code2 size={14} aria-hidden />Copy HTML</button>
            <a href={artifact?.url} download={artifact?.fileName} aria-disabled={!artifact} onClick={(event) => { if (!artifact) event.preventDefault() }} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><Share2 size={14} aria-hidden />Download</a>
          </div>
          <p role="status" aria-live="polite" className="mt-3 min-h-5 text-center text-[10px] text-emerald-700">{status && <><Check size={12} className="mr-1 inline" aria-hidden />{status}</>}</p>
        </div>
      </div>
    </div>
  )
}
