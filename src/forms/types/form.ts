import type { FormField, FormFieldValue } from './field'

export interface FormDefinition {
  id: string
  title: string
  version: 1
  fields: FormField[]
}

export interface FormValidationError {
  fieldId: string
  code:
    | 'required'
    | 'min-length'
    | 'max-length'
    | 'pattern'
    | 'email'
    | 'phone'
    | 'numeric'
    | 'date'
    | 'custom'
    | 'invalid-definition'
  message: string
}

export interface FormPreviewState {
  values: Record<string, FormFieldValue>
  errors: FormValidationError[]
}

export type CustomFormValidator = (
  value: FormFieldValue,
  field: FormField,
) => string | null
