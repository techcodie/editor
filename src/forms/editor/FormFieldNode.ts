import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { normalizeSerializedField } from '../services/formSerializer'
import { FormFieldNodeView } from './FormFieldNodeView'

function parseField(value: string | null) {
  if (!value) return null
  try { return normalizeSerializedField(JSON.parse(value)) } catch { return null }
}

export const FormFieldNode = Node.create({
  name: 'formField',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      field: {
        default: null,
        parseHTML: (element) => parseField(element.getAttribute('data-field-definition')),
        renderHTML: (attributes) => ({
          'data-field-definition': JSON.stringify(attributes.field ?? {}),
        }),
      },
    }
  },

  parseHTML() { return [{ tag: 'div[data-form-field]' }] },

  renderHTML({ HTMLAttributes }) {
    const field = normalizeSerializedField(HTMLAttributes.field)
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-form-field': '',
      'data-form-field-id': field?.id ?? '',
      'aria-label': field ? `${field.label || 'Unlabelled'} form field` : 'Form field',
    })]
  },

  addNodeView() { return ReactNodeViewRenderer(FormFieldNodeView) },
})
