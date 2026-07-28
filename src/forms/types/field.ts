export type FormFieldType =
  | 'text'
  | 'paragraph'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'time'
  | 'checkbox'
  | 'radio-group'
  | 'dropdown'
  | 'signature'
  | 'file-upload'
  | 'initials'
  | 'currency'

export type FormFieldVisibility = 'visible' | 'hidden'
export type FormFieldValue = string | number | boolean

export interface FormFieldOption {
  id: string
  label: string
  value: string
}

export interface FormFieldValidation {
  minLength?: number
  maxLength?: number
  pattern?: string
  email?: boolean
  phone?: boolean
  numeric?: boolean
  date?: boolean
  customValidator?: string
}

export interface FormFieldPosition {
  x: number
  y: number
}

export interface FormField {
  id: string
  type: FormFieldType
  label: string
  placeholder: string
  required: boolean
  readonly: boolean
  defaultValue: FormFieldValue
  helpText: string
  validation: FormFieldValidation
  options: FormFieldOption[]
  position: FormFieldPosition
  page: number
  width: number
  height: number
  visibility: FormFieldVisibility
  metadata: Record<string, string | number | boolean>
}

export type FormFieldPatch = Partial<Omit<FormField, 'id' | 'type'>>

export interface FormFieldDocumentEntry {
  field: FormField
  from: number
  to: number
}
