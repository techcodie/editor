import type { FormFieldType } from '../types/field'

export type FormFieldCategory = 'Input' | 'Choice' | 'Verification'

export interface FormFieldDefinition {
  type: FormFieldType
  label: string
  description: string
  category: FormFieldCategory
  defaultPlaceholder: string
  defaultWidth: number
  defaultHeight: number
  supportsOptions: boolean
}

export const FORM_FIELD_DEFINITIONS: readonly FormFieldDefinition[] = [
  { type: 'text', label: 'Text', description: 'Single-line response', category: 'Input', defaultPlaceholder: 'Enter text', defaultWidth: 100, defaultHeight: 44, supportsOptions: false },
  { type: 'paragraph', label: 'Paragraph', description: 'Multi-line response', category: 'Input', defaultPlaceholder: 'Enter a detailed response', defaultWidth: 100, defaultHeight: 96, supportsOptions: false },
  { type: 'number', label: 'Number', description: 'Numeric value', category: 'Input', defaultPlaceholder: '0', defaultWidth: 50, defaultHeight: 44, supportsOptions: false },
  { type: 'email', label: 'Email', description: 'Email address', category: 'Input', defaultPlaceholder: 'name@company.com', defaultWidth: 75, defaultHeight: 44, supportsOptions: false },
  { type: 'phone', label: 'Phone', description: 'Telephone number', category: 'Input', defaultPlaceholder: '+1 555 000 0000', defaultWidth: 65, defaultHeight: 44, supportsOptions: false },
  { type: 'date', label: 'Date', description: 'Calendar date', category: 'Input', defaultPlaceholder: '', defaultWidth: 50, defaultHeight: 44, supportsOptions: false },
  { type: 'time', label: 'Time', description: 'Time of day', category: 'Input', defaultPlaceholder: '', defaultWidth: 42, defaultHeight: 44, supportsOptions: false },
  { type: 'currency', label: 'Currency', description: 'Monetary amount', category: 'Input', defaultPlaceholder: '0.00', defaultWidth: 50, defaultHeight: 44, supportsOptions: false },
  { type: 'checkbox', label: 'Checkbox', description: 'Yes or no selection', category: 'Choice', defaultPlaceholder: '', defaultWidth: 100, defaultHeight: 40, supportsOptions: false },
  { type: 'radio-group', label: 'Radio group', description: 'Choose one option', category: 'Choice', defaultPlaceholder: '', defaultWidth: 100, defaultHeight: 76, supportsOptions: true },
  { type: 'dropdown', label: 'Dropdown', description: 'Select from a list', category: 'Choice', defaultPlaceholder: 'Select an option', defaultWidth: 75, defaultHeight: 44, supportsOptions: true },
  { type: 'signature', label: 'Signature', description: 'Signature placeholder', category: 'Verification', defaultPlaceholder: 'Signature', defaultWidth: 75, defaultHeight: 76, supportsOptions: false },
  { type: 'initials', label: 'Initials', description: 'Initials placeholder', category: 'Verification', defaultPlaceholder: 'Initials', defaultWidth: 36, defaultHeight: 64, supportsOptions: false },
  { type: 'file-upload', label: 'File upload', description: 'Attachment placeholder', category: 'Verification', defaultPlaceholder: 'Choose a file', defaultWidth: 100, defaultHeight: 64, supportsOptions: false },
] as const

const definitionsByType = new Map(
  FORM_FIELD_DEFINITIONS.map((definition) => [definition.type, definition]),
)

export function getFieldDefinition(type: FormFieldType): FormFieldDefinition {
  return definitionsByType.get(type) ?? FORM_FIELD_DEFINITIONS[0]
}
