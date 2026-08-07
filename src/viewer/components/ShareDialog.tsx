import { useEffect, useMemo, useState } from 'react'
import { Check, Code2, Copy, ExternalLink, Share2 } from 'lucide-react'
import { Dialog } from '../../components/ui/Dialog'
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

  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setStatus(message)
    } catch {
      setStatus('Clipboard access is unavailable. Open or download the form instead.')
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      id="form-share-dialog"
      title="Share HTML form"
      subtitle={`${form?.fields.length ?? 0} form fields`}
      icon={Share2}
      iconTone="accent"
      maxWidthClassName="max-w-[34rem]"
    >
      <div>
        <label htmlFor="form-share-name" className="mb-1.5 block text-[11px] font-semibold text-neutral-700">Form title</label>
        <input id="form-share-name" value={title} maxLength={120} onChange={(event) => { setTitle(event.target.value); setStatus('') }} className="h-10 w-full rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-[var(--document-editor-focus-ring)]" />
      </div>
      <section className="border-y border-neutral-200 py-4">
        <div className="flex items-center gap-2"><Code2 size={15} className="text-neutral-500" aria-hidden /><h3 className="text-xs font-semibold text-neutral-900">Standalone HTML</h3><span className="ml-auto rounded bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">Ready</span></div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-[10px]"><div><dt className="text-neutral-500">Template</dt><dd className="mt-0.5 font-semibold text-neutral-800">Read only</dd></div><div><dt className="text-neutral-500">Persistence</dt><dd className="mt-0.5 font-semibold text-neutral-800">Host callback</dd></div></dl>
      </section>
      <div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" disabled={!artifact} onClick={() => artifact && window.open(artifact.url, '_blank', 'noopener,noreferrer')} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-neutral-900 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"><ExternalLink size={14} aria-hidden />Open form</button>
          <button type="button" disabled={!artifact} onClick={() => artifact && void copy(artifact.url, 'Session link copied.')} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"><Copy size={14} aria-hidden />Copy link</button>
          <button type="button" disabled={!artifact} onClick={() => artifact && void copy(artifact.html, 'HTML copied.')} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"><Code2 size={14} aria-hidden />Copy HTML</button>
          <a href={artifact?.url} download={artifact?.fileName} aria-disabled={!artifact} onClick={(event) => { if (!artifact) event.preventDefault() }} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"><Share2 size={14} aria-hidden />Download</a>
        </div>
        <p role="status" aria-live="polite" className="mt-3 min-h-5 text-center text-[10px] text-emerald-700">{status && <><Check size={12} className="mr-1 inline" aria-hidden />{status}</>}</p>
      </div>
    </Dialog>
  )
}
