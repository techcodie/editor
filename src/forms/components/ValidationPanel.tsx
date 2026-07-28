import type { FormField, FormFieldPatch, FormFieldValidation } from '../types/field'

const inputClass = 'h-8 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-[11px] text-neutral-800 outline-none transition-shadow focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15'

interface ValidationPanelProps { field: FormField; onChange: (patch: FormFieldPatch) => void }

export function ValidationPanel({ field, onChange }: ValidationPanelProps) {
  const setValidation = (patch: Partial<FormFieldValidation>) => onChange({ validation: { ...field.validation, ...patch } })
  return (
    <section className="space-y-3 border-t border-neutral-200 pt-4" aria-labelledby="field-validation-title">
      <div><h3 id="field-validation-title" className="text-[11px] font-semibold text-neutral-900">Validation</h3><p className="mt-0.5 text-[9px] text-neutral-500">Rules run in interactive preview.</p></div>
      {!['checkbox', 'radio-group', 'dropdown', 'signature', 'initials', 'file-upload'].includes(field.type) && <div className="grid grid-cols-2 gap-2"><label className="text-[10px] font-medium text-neutral-600">Minimum length<input className={`${inputClass} mt-1`} type="number" min="0" value={field.validation.minLength ?? ''} onChange={(event) => setValidation({ minLength: event.target.value ? Number(event.target.value) : undefined })} /></label><label className="text-[10px] font-medium text-neutral-600">Maximum length<input className={`${inputClass} mt-1`} type="number" min="1" value={field.validation.maxLength ?? ''} onChange={(event) => setValidation({ maxLength: event.target.value ? Number(event.target.value) : undefined })} /></label></div>}
      <label className="block text-[10px] font-medium text-neutral-600">Regular expression<input className={`${inputClass} mt-1 font-mono`} value={field.validation.pattern ?? ''} placeholder="Optional pattern" onChange={(event) => setValidation({ pattern: event.target.value || undefined })} /></label>
      <label className="block text-[10px] font-medium text-neutral-600">Custom validator key<input className={`${inputClass} mt-1`} value={field.validation.customValidator ?? ''} placeholder="Host-provided hook key" onChange={(event) => setValidation({ customValidator: event.target.value || undefined })} /></label>
    </section>
  )
}
