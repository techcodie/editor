import { getFieldDefinition } from './fieldRegistry'
import type {
  FormField,
  FormFieldOption,
  FormFieldPatch,
  FormFieldType,
} from '../types/field'

function defaultOptions(type: FormFieldType): FormFieldOption[] {
  if (type !== 'radio-group' && type !== 'dropdown') return []
  return ['Option 1', 'Option 2'].map((label, index) => ({
    id: crypto.randomUUID(),
    label,
    value: `option-${index + 1}`,
  }))
}

export function createFormField(type: FormFieldType, page = 1): FormField {
  const definition = getFieldDefinition(type)
  return {
    id: crypto.randomUUID(),
    type,
    label: definition.label,
    placeholder: definition.defaultPlaceholder,
    required: false,
    readonly: false,
    defaultValue: type === 'checkbox' ? false : '',
    helpText: '',
    validation: {
      email: type === 'email' || undefined,
      phone: type === 'phone' || undefined,
      numeric: type === 'number' || type === 'currency' || undefined,
      date: type === 'date' || undefined,
    },
    options: defaultOptions(type),
    position: { x: 0, y: 0 },
    page: Math.max(1, page),
    width: definition.defaultWidth,
    height: definition.defaultHeight,
    visibility: 'visible',
    metadata: {},
  }
}

export function updateFormField(field: FormField, patch: FormFieldPatch): FormField {
  return {
    ...field,
    ...patch,
    label: patch.label === undefined ? field.label : patch.label.slice(0, 120),
    placeholder: patch.placeholder === undefined
      ? field.placeholder
      : patch.placeholder.slice(0, 180),
    helpText: patch.helpText === undefined ? field.helpText : patch.helpText.slice(0, 240),
    width: Math.min(100, Math.max(25, patch.width ?? field.width)),
    height: Math.min(240, Math.max(36, patch.height ?? field.height)),
    page: Math.max(1, Math.round(patch.page ?? field.page)),
    validation: patch.validation
      ? { ...field.validation, ...patch.validation }
      : field.validation,
    position: patch.position ? { ...field.position, ...patch.position } : field.position,
    metadata: patch.metadata ? { ...field.metadata, ...patch.metadata } : field.metadata,
  }
}
