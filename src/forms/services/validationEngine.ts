import type { CustomFormValidator, FormValidationError } from '../types/form'
import type { FormField, FormFieldValue } from '../types/field'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[+()\d\s.-]{7,24}$/

function isEmpty(value: FormFieldValue): boolean {
  return value === '' || value === false || value === null || value === undefined
}

export function validateField(
  field: FormField,
  value: FormFieldValue,
  customValidator?: CustomFormValidator,
): FormValidationError[] {
  const errors: FormValidationError[] = []
  const text = String(value ?? '').trim()
  if (field.required && isEmpty(value)) {
    errors.push({ fieldId: field.id, code: 'required', message: `${field.label || 'This field'} is required.` })
    return errors
  }
  if (isEmpty(value)) return errors
  if (field.validation.minLength !== undefined && text.length < field.validation.minLength) {
    errors.push({ fieldId: field.id, code: 'min-length', message: `Use at least ${field.validation.minLength} characters.` })
  }
  if (field.validation.maxLength !== undefined && text.length > field.validation.maxLength) {
    errors.push({ fieldId: field.id, code: 'max-length', message: `Use no more than ${field.validation.maxLength} characters.` })
  }
  if (field.validation.pattern) {
    try {
      if (!new RegExp(field.validation.pattern).test(text)) {
        errors.push({ fieldId: field.id, code: 'pattern', message: 'The value does not match the required format.' })
      }
    } catch {
      errors.push({ fieldId: field.id, code: 'invalid-definition', message: 'The validation pattern is invalid.' })
    }
  }
  if (field.validation.email && !EMAIL_PATTERN.test(text)) {
    errors.push({ fieldId: field.id, code: 'email', message: 'Enter a valid email address.' })
  }
  if (field.validation.phone && !PHONE_PATTERN.test(text)) {
    errors.push({ fieldId: field.id, code: 'phone', message: 'Enter a valid phone number.' })
  }
  if (field.validation.numeric && !Number.isFinite(Number(text))) {
    errors.push({ fieldId: field.id, code: 'numeric', message: 'Enter a valid number.' })
  }
  if (field.validation.date && Number.isNaN(Date.parse(text))) {
    errors.push({ fieldId: field.id, code: 'date', message: 'Enter a valid date.' })
  }
  if (field.validation.customValidator && customValidator) {
    const message = customValidator(value, field)
    if (message) errors.push({ fieldId: field.id, code: 'custom', message })
  }
  return errors
}

export function validateForm(
  fields: FormField[],
  values: Record<string, FormFieldValue>,
): FormValidationError[] {
  return fields.flatMap((field) => validateField(field, values[field.id] ?? field.defaultValue))
}

export interface FormDefinitionIssue {
  fieldId: string
  type: 'empty-label' | 'duplicate-field' | 'invalid-validation' | 'missing-required-field'
  message: string
}

export function analyzeFieldDefinitions(fields: FormField[]): FormDefinitionIssue[] {
  const issues: FormDefinitionIssue[] = []
  const labels = new Map<string, string>()
  for (const field of fields) {
    const label = field.label.trim().toLocaleLowerCase()
    if (!label) issues.push({ fieldId: field.id, type: 'empty-label', message: 'This field has no label.' })
    if (label && labels.has(label)) {
      issues.push({ fieldId: field.id, type: 'duplicate-field', message: `The label duplicates another “${field.label}” field.` })
    } else if (label) labels.set(label, field.id)
    if (
      field.validation.minLength !== undefined &&
      field.validation.maxLength !== undefined &&
      field.validation.minLength > field.validation.maxLength
    ) {
      issues.push({ fieldId: field.id, type: 'invalid-validation', message: 'Minimum length exceeds maximum length.' })
    }
    if (field.validation.pattern) {
      try { new RegExp(field.validation.pattern) } catch {
        issues.push({ fieldId: field.id, type: 'invalid-validation', message: 'The regular expression is invalid.' })
      }
    }
  }
  if (fields.length > 0 && !fields.some((field) => field.required)) {
    issues.push({ fieldId: fields[0].id, type: 'missing-required-field', message: 'The form does not define any required fields.' })
  }
  return issues
}
