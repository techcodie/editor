import { useCallback, useEffect, useState } from 'react'
import type { EditorApi } from '../../lib/editor-api'
import { createFormField } from '../services/formEngine'
import type { FormField, FormFieldPatch, FormFieldType } from '../types/field'
import { useFieldSelection } from './useFieldSelection'

export function useFormBuilder(api: EditorApi | null, currentPage: number) {
  const [fields, setFields] = useState<FormField[]>([])
  const selection = useFieldSelection(api)

  useEffect(() => {
    if (!api) {
      setFields([])
      return
    }
    const sync = () => setFields((current) => {
      const next = api.getFormFields().map((entry) => entry.field)
      return JSON.stringify(current) === JSON.stringify(next) ? current : next
    })
    sync()
    return api.subscribe(sync)
  }, [api])

  const addField = useCallback((type: FormFieldType) => {
    if (!api) return false
    return api.insertFormField(createFormField(type, currentPage))
  }, [api, currentPage])

  const updateField = useCallback((fieldId: string, patch: FormFieldPatch) =>
    api?.updateFormField(fieldId, patch) ?? false, [api])

  const removeField = useCallback((fieldId: string) =>
    api?.removeFormField(fieldId) ?? false, [api])

  const selectField = useCallback((fieldId: string) =>
    api?.focusFormField(fieldId) ?? false, [api])

  return {
    fields,
    selectedField: selection?.field ?? null,
    addField,
    updateField,
    removeField,
    selectField,
  }
}
