import { useCallback, useEffect, useRef, useState } from 'react'
import type { SelectionAiAction } from '../../../shared/ai'
import type { EditorApi, EditorTextSelection } from '../../lib/editor-api'
import { SelectionAiServiceError, streamSelectionAi } from '../../services/selection-ai'

export type SelectionAiStatus = 'loading' | 'success' | 'error'

export interface SelectionAiOperation {
  id: string
  action: SelectionAiAction
  selection: EditorTextSelection
  status: SelectionAiStatus
  result: string
  error: string | null
}

export function useSelectionAi(api: EditorApi | null) {
  const [operation, setOperation] = useState<SelectionAiOperation | null>(null)
  const requestRef = useRef<{ id: string; controller: AbortController } | null>(null)

  const runAction = useCallback(
    async (action: SelectionAiAction, selectionOverride?: EditorTextSelection) => {
      if (!api || requestRef.current) return

      const selection = selectionOverride ?? api.getTextSelection()
      if (!selection?.text.trim()) return

      const id = crypto.randomUUID()
      const controller = new AbortController()
      requestRef.current = { id, controller }
      setOperation({ id, action, selection, status: 'loading', result: '', error: null })

      try {
        await streamSelectionAi(
          {
            selection: selection.text,
            action,
            document: api.getDocumentText() || undefined,
          },
          (content) => {
            setOperation((current) =>
              current?.id === id ? { ...current, result: current.result + content } : current,
            )
          },
          controller.signal,
        )
        setOperation((current) =>
          current?.id === id ? { ...current, status: 'success' } : current,
        )
      } catch (reason) {
        if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
          const message =
            reason instanceof SelectionAiServiceError
              ? reason.message
              : 'Selection AI encountered an unexpected error. Please try again.'
          setOperation((current) =>
            current?.id === id
              ? { ...current, status: 'error', result: '', error: message }
              : current,
          )
        }
      } finally {
        if (requestRef.current?.id === id) requestRef.current = null
      }
    },
    [api],
  )

  const tryAgain = useCallback(() => {
    if (operation) void runAction(operation.action, operation.selection)
  }, [operation, runAction])

  const cancel = useCallback(() => {
    requestRef.current?.controller.abort()
    requestRef.current = null
    setOperation(null)
    api?.clearTextSelection()
  }, [api])

  const replaceSelection = useCallback(() => {
    if (!api || !operation?.result.trim()) return

    if (api.replaceTextSelection(operation.selection, operation.result)) {
      setOperation(null)
      return
    }

    setOperation((current) =>
      current
        ? {
            ...current,
            status: 'error',
            error: 'The selected text changed while AI was working. Select it again and retry.',
          }
        : current,
    )
  }, [api, operation])

  useEffect(
    () => () => {
      requestRef.current?.controller.abort()
    },
    [],
  )

  return {
    operation,
    runAction,
    tryAgain,
    cancel,
    replaceSelection,
  }
}
