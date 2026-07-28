import { useEffect, useRef, useState } from 'react'
import { Eye, Layers3, ListChecks, MousePointerClick, X } from 'lucide-react'
import type { EditorApi } from '../../lib/editor-api'
import { useFormBuilder } from '../hooks/useFormBuilder'
import type { FormFieldPatch, FormFieldType } from '../types/field'
import { FieldPalette } from './FieldPalette'
import { FieldProperties } from './FieldProperties'
import { FormPreview } from './FormPreview'

interface FormBuilderPanelProps { isOpen: boolean; api: EditorApi | null; currentPage: number; onClose: () => void }

export function FormBuilderPanel({ isOpen, api, currentPage, onClose }: FormBuilderPanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const [mode, setMode] = useState<'build' | 'preview'>('build')
  const [notice, setNotice] = useState('')
  const { fields, selectedField, addField, updateField, removeField, selectField } = useFormBuilder(api, currentPage)
  useEffect(() => { if (!isOpen) return; requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>('[aria-label="Close form builder"]')?.focus()) }, [isOpen])
  useEffect(() => {
    if (!isOpen) return
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [isOpen, onClose])
  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [notice])
  if (!isOpen) return null
  const add = (type: FormFieldType) => { setNotice(addField(type) ? 'Field added to the document.' : 'Place the cursor in the document and try again.') }
  const update = (patch: FormFieldPatch) => { if (selectedField) updateField(selectedField.id, patch) }
  return (
    <><button type="button" aria-label="Close form builder" onClick={onClose} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] lg:hidden" /><aside ref={panelRef} id="form-builder-panel" role="dialog" aria-modal="true" aria-labelledby="form-builder-title" className="form-builder-panel fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-hidden border-l border-neutral-200 bg-white shadow-[var(--document-editor-shadow-overlay)] [animation:review-sidebar-in_180ms_ease-out] sm:max-w-[28rem] lg:sticky lg:top-6 lg:z-30 lg:h-[calc(100vh-3rem)] lg:w-[27rem] lg:rounded-lg lg:border"><header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 px-4"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-700"><ListChecks size={16} aria-hidden /></span><div className="min-w-0"><h2 id="form-builder-title" className="truncate text-sm font-semibold text-neutral-950">Form builder</h2><p className="text-[10px] text-neutral-500">{fields.length} field{fields.length === 1 ? '' : 's'} · Page {currentPage}</p></div><button type="button" aria-label="Close form builder" onClick={onClose} className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><X size={15} /></button></header><div className="grid shrink-0 grid-cols-2 border-b border-neutral-200 bg-neutral-50 p-1.5"><button type="button" onClick={() => setMode('build')} aria-pressed={mode === 'build'} className={`flex h-8 items-center justify-center gap-1.5 rounded text-[10px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 ${mode === 'build' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}><Layers3 size={12} />Build</button><button type="button" onClick={() => setMode('preview')} aria-pressed={mode === 'preview'} className={`flex h-8 items-center justify-center gap-1.5 rounded text-[10px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 ${mode === 'preview' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}><Eye size={12} />Preview</button></div>{notice && <p role="status" className="border-b border-indigo-100 bg-indigo-50 px-4 py-2 text-[10px] text-indigo-800">{notice}</p>}<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{mode === 'preview' ? <FormPreview fields={fields} /> : selectedField ? <FieldProperties field={selectedField} onChange={update} onDelete={() => { removeField(selectedField.id); setNotice('Field removed.') }} /> : <><FieldPalette onAdd={add} />{fields.length > 0 && <section className="border-t border-neutral-200 p-4"><h3 className="mb-2 text-[10px] font-semibold uppercase text-neutral-500">Document fields</h3><div className="space-y-1">{fields.map((field, index) => <button key={field.id} type="button" onClick={() => selectField(field.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"><span className="w-5 text-center text-[9px] tabular-nums text-neutral-400">{index + 1}</span><span className="min-w-0 flex-1 truncate text-[11px] font-medium text-neutral-700">{field.label || 'Unlabelled field'}</span><span className="text-[9px] text-neutral-400">{field.type.replace('-', ' ')}</span></button>)}</div></section>}</>}</div>{mode === 'build' && !selectedField && <footer className="shrink-0 border-t border-neutral-200 bg-neutral-50 px-4 py-3"><p className="flex items-center justify-center gap-2 text-[10px] text-neutral-500"><MousePointerClick size={13} aria-hidden />Select a document field to configure it.</p></footer>}</aside></>
  )
}
