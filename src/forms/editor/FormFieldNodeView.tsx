import { Check, ChevronDown, FileUp, GripVertical, PenLine } from 'lucide-react'
import { NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react'
import { normalizeSerializedField } from '../services/formSerializer'
import { SignaturePlaceholder } from '../components/SignaturePlaceholder'

export function FormFieldNodeView({ node, selected }: ReactNodeViewProps) {
  const field = normalizeSerializedField(node.attrs.field)
  if (!field) return <NodeViewWrapper className="my-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">Invalid form field</NodeViewWrapper>
  const isChoice = field.type === 'radio-group' || field.type === 'dropdown'
  return (
    <NodeViewWrapper
      className="form-field-node my-4"
      data-form-field-id={field.id}
      data-form-field-type={field.type}
      contentEditable={false}
      style={{ width: `${field.width}%`, minHeight: field.height }}
    >
      <div className={`group relative rounded-md border bg-white px-3 py-2.5 transition-[border-color,box-shadow,background-color] ${selected ? 'border-indigo-500 bg-indigo-50/30 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]' : 'border-neutral-250 hover:border-neutral-400'}`}>
        <span data-drag-handle className="absolute -left-7 top-1/2 hidden h-7 w-6 -translate-y-1/2 cursor-grab items-center justify-center text-neutral-400 group-hover:flex" aria-hidden><GripVertical size={14} /></span>
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-neutral-800">{field.label || 'Unlabelled field'}{field.required && <span className="ml-0.5 text-red-600" aria-label="required">*</span>}</span>
          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-neutral-500">{field.type.replace('-', ' ')}</span>
        </div>
        {field.type === 'signature' || field.type === 'initials' ? (
          <SignaturePlaceholder compact={field.type === 'initials'} label={field.placeholder || field.label} />
        ) : field.type === 'checkbox' ? (
          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500"><span className="flex h-4 w-4 items-center justify-center rounded border border-neutral-300"><Check size={11} className="opacity-0" /></span>{field.placeholder || 'Select this option'}</div>
        ) : field.type === 'file-upload' ? (
          <div className="mt-2 flex h-9 items-center justify-center gap-2 rounded border border-dashed border-neutral-300 bg-neutral-50 text-[11px] text-neutral-500"><FileUp size={13} />{field.placeholder}</div>
        ) : field.type === 'paragraph' ? (
          <div className="mt-2 min-h-14 rounded border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-[11px] text-neutral-400">{field.placeholder}</div>
        ) : (
          <div className="mt-2 flex h-8 items-center rounded border border-neutral-200 bg-neutral-50 px-2.5 text-[11px] text-neutral-400"><span className="truncate">{isChoice ? field.placeholder || 'Select an option' : field.placeholder || 'Enter a value'}</span>{isChoice && <ChevronDown size={12} className="ml-auto" />}</div>
        )}
        {field.helpText && <p className="mt-1.5 text-[10px] leading-4 text-neutral-500">{field.helpText}</p>}
        {selected && <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm" aria-hidden><PenLine size={10} /></span>}
      </div>
    </NodeViewWrapper>
  )
}
