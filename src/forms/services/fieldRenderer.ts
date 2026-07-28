import type { FormField, FormFieldValue } from '../types/field'

export function fieldInputType(field: FormField): string {
  if (field.type === 'email') return 'email'
  if (field.type === 'phone') return 'tel'
  if (field.type === 'date') return 'date'
  if (field.type === 'time') return 'time'
  if (field.type === 'number' || field.type === 'currency') return 'number'
  if (field.type === 'file-upload') return 'file'
  return 'text'
}

export function fieldDisplayValue(field: FormField, value: FormFieldValue): string {
  if (field.type === 'checkbox') return value ? 'Selected' : 'Not selected'
  if (field.type === 'currency' && value !== '') {
    const amount = Number(value)
    if (Number.isFinite(amount)) return amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
  }
  return String(value ?? '')
}
