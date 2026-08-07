import { useEffect, useState } from 'react'
import { Eye, Layers3, ListChecks, MousePointerClick } from 'lucide-react'
import type { EditorApi } from '../../lib/editor-api'
import { PanelShell } from '../../components/ui/PanelShell'
import { useFormBuilder } from '../hooks/useFormBuilder'
import type { FormFieldPatch, FormFieldType } from '../types/field'
import { FieldPalette } from './FieldPalette'
import { FieldProperties } from './FieldProperties'
import { FormPreview } from './FormPreview'

interface FormBuilderPanelProps { isOpen: boolean; api: EditorApi | null; currentPage: number; onClose: () => void }

export function FormBuilderPanel({ isOpen, api, currentPage, onClose }: FormBuilderPanelProps) {
  const [mode, setMode] = useState<'build' | 'preview'>('build')
  const [notice, setNotice] = useState('')
  const { fields, selectedField, addField, updateField, removeField, selectField } = useFormBuilder(api, currentPage)
  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [notice])
  const add = (type: FormFieldType) => { setNotice(addField(type) ? 'Field added to the document.' : 'Place the cursor in the document and try again.') }
  const update = (patch: FormFieldPatch) => { if (selectedField) updateField(selectedField.id, patch) }
  return (
    <PanelShell
      isOpen={isOpen}
      onClose={onClose}
      initialFocusSelector='[aria-label="Close form builder"]'
      title="Form builder"
      subtitle={`${fields.length} field${fields.length === 1 ? '' : 's'} · Page ${currentPage}`}
      icon={ListChecks}
      iconTone="accent"
      labelledById="form-builder-title"
      panelId="form-builder-panel"
      className="form-builder-panel"
      widthClassName="sm:max-w-[28rem] lg:w-[27rem]"
      footer={mode === 'build' && !selectedField ? (
        <div className="-mx-4 -my-3 bg-neutral-50 px-4 py-3">
          <p className="flex items-center justify-center gap-2 text-[10px] text-neutral-500"><MousePointerClick size={13} aria-hidden />Select a document field to configure it.</p>
        </div>
      ) : undefined}
    >
      <div className="grid shrink-0 grid-cols-2 border-b border-neutral-200 bg-neutral-50 p-1.5"><button type="button" onClick={() => setMode('build')} aria-pressed={mode === 'build'} className={`flex h-8 items-center justify-center gap-1.5 rounded text-[10px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] ${mode === 'build' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}><Layers3 size={12} />Build</button><button type="button" onClick={() => setMode('preview')} aria-pressed={mode === 'preview'} className={`flex h-8 items-center justify-center gap-1.5 rounded text-[10px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] ${mode === 'preview' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}><Eye size={12} />Preview</button></div>
      {notice && <p role="status" className="border-b border-indigo-100 bg-indigo-50 px-4 py-2 text-[10px] text-indigo-800">{notice}</p>}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{mode === 'preview' ? <FormPreview fields={fields} /> : selectedField ? <FieldProperties field={selectedField} onChange={update} onDelete={() => { removeField(selectedField.id); setNotice('Field removed.') }} /> : <><FieldPalette onAdd={add} />{fields.length > 0 && <section className="border-t border-neutral-200 p-4"><h3 className="mb-2 text-[10px] font-semibold uppercase text-neutral-500">Document fields</h3><div className="space-y-1">{fields.map((field, index) => <button key={field.id} type="button" onClick={() => selectField(field.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"><span className="w-5 text-center text-[9px] tabular-nums text-neutral-400">{index + 1}</span><span className="min-w-0 flex-1 truncate text-[11px] font-medium text-neutral-700">{field.label || 'Unlabelled field'}</span><span className="text-[9px] text-neutral-400">{field.type.replace('-', ' ')}</span></button>)}</div></section>}</>}</div>
    </PanelShell>
  )
}
