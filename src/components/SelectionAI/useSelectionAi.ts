import { useCallback, useEffect, useRef, useState } from 'react'
import type { SelectionAiAction } from '../../../shared/ai'
import type { EditorApi, EditorTextSelection } from '../../lib/editor-api'
import { createFrameStreamBuffer } from '../../services/frame-stream-buffer'
import type { InternalDocumentEditorEvents } from '../../sdk/events'
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

interface SelectionAiOptions {
  endpoint: string
  streaming: boolean
  events: InternalDocumentEditorEvents
}

export function useSelectionAi(api: EditorApi | null, options: SelectionAiOptions) {
  const [operation, setOperation] = useState<SelectionAiOperation | null>(null)
  const requestRef = useRef<{ id: string; controller: AbortController } | null>(null)

  const runAction = useCallback(
    async (action: SelectionAiAction, selectionOverride?: EditorTextSelection) => {
      if (!api || requestRef.current) return

      const selection = selectionOverride ?? api.getTextSelection()
      if (!selection?.text.trim()) return

      const id = crypto.randomUUID()
      const controller = new AbortController()
      let responseContent = ''
      const streamBuffer = createFrameStreamBuffer((content) => {
        setOperation((current) =>
          current?.id === id ? { ...current, result: current.result + content } : current,
        )
      })
      requestRef.current = { id, controller }
      setOperation({ id, action, selection, status: 'loading', result: '', error: null })
      const startedAt = performance.now()
      options.events.emit('aiRequest', {
        workflow: 'selection',
        requestId: id,
        action,
      })

      try {
        await streamSelectionAi(
          {
            selection: selection.text,
            action,
            document: api.getDocumentText() || undefined,
          },
          (content) => {
            responseContent += content
            if (options.streaming) streamBuffer.push(content)
          },
          controller.signal,
          options.endpoint,
        )
        if (!options.streaming) streamBuffer.push(responseContent)
        streamBuffer.flush()
        setOperation((current) =>
          current?.id === id ? { ...current, status: 'success' } : current,
        )
        options.events.emit('aiResponse', {
          workflow: 'selection',
          responseId: id,
          content: responseContent,
          responseTime: Math.max(0, Math.round(performance.now() - startedAt)),
        })
      } catch (reason) {
        streamBuffer.cancel()
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
          options.events.emit('error', {
            scope: 'ai',
            message,
            cause: reason,
          })
        }
      } finally {
        if (requestRef.current?.id === id) requestRef.current = null
      }
    },
    [api, options.endpoint, options.events, options.streaming],
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
