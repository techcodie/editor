import {
  CalendarDays,
  CheckSquare2,
  ChevronDown,
  Clock3,
  DollarSign,
  FileUp,
  Hash,
  ListChecks,
  Mail,
  Pilcrow,
  Phone,
  Signature,
  TextCursorInput,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { FORM_FIELD_DEFINITIONS, type FormFieldCategory } from '../services/fieldRegistry'
import type { FormFieldType } from '../types/field'

const icons: Record<FormFieldType, LucideIcon> = {
  text: TextCursorInput,
  paragraph: Pilcrow,
  number: Hash,
  email: Mail,
  phone: Phone,
  date: CalendarDays,
  time: Clock3,
  checkbox: CheckSquare2,
  'radio-group': ListChecks,
  dropdown: ChevronDown,
  signature: Signature,
  'file-upload': FileUp,
  initials: Signature,
  currency: DollarSign,
}
const categories: FormFieldCategory[] = ['Input', 'Choice', 'Verification']

interface FieldPaletteProps { onAdd: (type: FormFieldType) => void }

export function FieldPalette({ onAdd }: FieldPaletteProps) {
  return (
    <div className="space-y-4 p-4" aria-label="Form field palette">
      {categories.map((category) => (
        <section key={category}>
          <h3 className="mb-2 text-[10px] font-semibold uppercase text-neutral-500">{category}</h3>
          <div className="grid grid-cols-2 gap-2">
            {FORM_FIELD_DEFINITIONS.filter((item) => item.category === category).map((item) => {
              const Icon = icons[item.type]
              return <button key={item.type} type="button" onClick={() => onAdd(item.type)} className="group flex min-h-14 items-center gap-2.5 rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-left transition-[border-color,background-color,box-shadow,transform] hover:-translate-y-px hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-neutral-100 text-neutral-600 group-hover:bg-indigo-50 group-hover:text-indigo-700"><Icon size={14} strokeWidth={1.8} aria-hidden /></span><span className="min-w-0"><span className="block truncate text-[11px] font-semibold text-neutral-800">{item.label}</span><span className="block truncate text-[9px] text-neutral-500">{item.description}</span></span></button>
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
