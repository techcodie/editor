import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react'
import type {
  EditorApi,
  EditorInsertionTarget,
  EditorTextSelection,
} from '../../lib/editor-api'
import {
  applyEditorInsertion,
  prepareEditorInsertion,
  type AiResponseInsertion,
  type PreparedEditorInsertion,
} from '../services/editorInsertion'
import type { InternalDocumentEditorEvents } from '../../sdk/events'

export interface EditorInsertionFeedback {
  responseId: string
  status: 'success' | 'error'
  message: string
}

export interface PendingReplacement {
  prepared: PreparedEditorInsertion
  original: string
  selection: EditorTextSelection
}

export function useEditorInsertion(
  api: EditorApi | null,
  events?: InternalDocumentEditorEvents,
) {
  const [pendingReplacement, setPendingReplacement] =
    useState<PendingReplacement | null>(null)
  const [feedback, setFeedback] = useState<EditorInsertionFeedback | null>(null)

  const subscribe = useCallback(
    (listener: () => void) => api?.subscribe(listener) ?? (() => {}),
    [api],
  )
  const getSnapshot = useCallback(() => api?.getSnapshot() ?? null, [api])
  useSyncExternalStore(subscribe, getSnapshot, () => null)

  const currentSelection = api?.getTextSelection() ?? null
  const canInsert = api !== null
  const canReplaceSelection = api !== null && currentSelection !== null

  useEffect(() => {
    if (!feedback) return
    const timeout = window.setTimeout(() => setFeedback(null), 3200)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  const reportResult = useCallback(
    (
      responseId: string,
      result: { success: boolean; message: string },
      hasTableFallback: boolean,
    ) => {
      setFeedback({
        responseId,
        status: result.success ? 'success' : 'error',
        message:
          result.success && hasTableFallback
            ? `${result.message}. Table rows were converted to paragraphs.`
            : result.message,
      })
    },
    [],
  )

  const insertResponse = useCallback(
    async (
      response: AiResponseInsertion,
      target: Exclude<EditorInsertionTarget, 'selection'>,
    ) => {
      const prepared = await prepareEditorInsertion(response)
      if (!prepared) {
        setFeedback({
          responseId: response.responseId,
          status: 'error',
          message: 'This response does not contain insertable content.',
        })
        return
      }

      const result = applyEditorInsertion(api, prepared, target)
      reportResult(
        response.responseId,
        result,
        prepared.content.unsupportedBlocks.includes('table'),
      )
      if (result.success) {
        events?.emit('insert', {
          responseId: response.responseId,
          sourceIds: response.sourceIds,
          target,
        })
      }
    },
    [api, events, reportResult],
  )

  const requestReplacement = useCallback(
    async (response: AiResponseInsertion) => {
      const selection = api?.getTextSelection() ?? null
      if (!selection) {
        setFeedback({
          responseId: response.responseId,
          status: 'error',
          message: 'Select text in the editor before replacing it.',
        })
        return
      }

      const prepared = await prepareEditorInsertion(response)
      if (!prepared) {
        setFeedback({
          responseId: response.responseId,
          status: 'error',
          message: 'This response does not contain insertable content.',
        })
        return
      }

      setFeedback(null)
      setPendingReplacement({
        prepared,
        original: selection.text,
        selection,
      })
    },
    [api],
  )

  const applyReplacement = useCallback(() => {
    if (!pendingReplacement) return

    const result = applyEditorInsertion(
      api,
      pendingReplacement.prepared,
      'selection',
      pendingReplacement.selection,
    )
    reportResult(
      pendingReplacement.prepared.response.responseId,
      result,
      pendingReplacement.prepared.content.unsupportedBlocks.includes('table'),
    )
    if (result.success) {
      events?.emit('insert', {
        responseId: pendingReplacement.prepared.response.responseId,
        sourceIds: pendingReplacement.prepared.response.sourceIds,
        target: 'selection',
      })
    }
    setPendingReplacement(null)
  }, [api, events, pendingReplacement, reportResult])

  const cancelReplacement = useCallback(() => {
    setPendingReplacement(null)
  }, [])

  return {
    canInsert,
    canReplaceSelection,
    feedback,
    pendingReplacement,
    insertResponse,
    requestReplacement,
    applyReplacement,
    cancelReplacement,
  }
}
