import { useEffect, useState } from 'react'
import type { EditorApi } from '../../lib/editor-api'
import type { FormFieldDocumentEntry } from '../types/field'

export function useFieldSelection(api: EditorApi | null) {
  const [selection, setSelection] = useState<FormFieldDocumentEntry | null>(null)

  useEffect(() => {
    if (!api) {
      setSelection(null)
      return
    }
    const sync = () => setSelection((current) => {
      const next = api.getSelectedFormField()
      if (
        current?.field.id === next?.field.id &&
        JSON.stringify(current?.field) === JSON.stringify(next?.field)
      ) return current
      return next
    })
    sync()
    return api.subscribe(sync)
  }, [api])

  return selection
}
