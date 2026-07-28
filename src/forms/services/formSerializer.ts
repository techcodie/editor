import type { EditorDocumentNode } from '../../lib/editor-api'
import { createFormField, updateFormField } from './formEngine'
import type { FormDefinition } from '../types/form'
import type { FormField, FormFieldType } from '../types/field'
import { FORM_FIELD_DEFINITIONS } from './fieldRegistry'

const supportedTypes = new Set(FORM_FIELD_DEFINITIONS.map((item) => item.type))

export function normalizeSerializedField(value: unknown): FormField | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const input = value as Partial<FormField>
  if (!input.id || !input.type || !supportedTypes.has(input.type as FormFieldType)) return null
  const base = createFormField(input.type as FormFieldType, input.page)
  return {
    ...updateFormField(base, input),
    id: String(input.id),
    type: input.type as FormFieldType,
    options: Array.isArray(input.options)
      ? input.options.flatMap((option) => option && typeof option === 'object'
        ? [{
            id: String(option.id || crypto.randomUUID()),
            label: String(option.label || '').slice(0, 100),
            value: String(option.value || '').slice(0, 100),
          }]
        : [])
      : base.options,
  }
}

export function extractFormFields(document: EditorDocumentNode): FormField[] {
  const fields: FormField[] = []
  const visit = (node: EditorDocumentNode) => {
    if (node.type === 'formField') {
      const field = normalizeSerializedField(node.attrs?.field)
      if (field) fields.push(field)
    }
    node.content?.forEach(visit)
  }
  visit(document)
  return fields
}

export function serializeForm(document: EditorDocumentNode, title = 'Document form'): FormDefinition {
  return {
    id: crypto.randomUUID(),
    title,
    version: 1,
    fields: extractFormFields(document),
  }
}
