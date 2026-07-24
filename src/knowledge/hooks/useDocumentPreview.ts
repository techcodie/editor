import { useCallback, useMemo, useState } from 'react'
import type { KnowledgeSource } from '../types/source'
import type { InternalDocumentEditorEvents } from '../../sdk/events'
import { toKnowledgeSourceEventData } from '../../sdk/knowledge-events'

export function useDocumentPreview(
  sources: KnowledgeSource[],
  events: InternalDocumentEditorEvents,
  enabled: boolean,
) {
  const [previewSourceId, setPreviewSourceId] = useState<string | null>(null)
  const [previewFocusVersion, setPreviewFocusVersion] = useState(0)
  const previewSource = useMemo(
    () => sources.find((source) => source.id === previewSourceId) ?? null,
    [previewSourceId, sources],
  )

  const openPreview = useCallback((source: KnowledgeSource) => {
    if (enabled && source.status === 'uploaded' && source.parseStatus === 'ready') {
      setPreviewSourceId(source.id)
      setPreviewFocusVersion((version) => version + 1)
      events.emit('previewOpen', {
        source: toKnowledgeSourceEventData(source),
      })
    }
  }, [enabled, events])

  const closePreview = useCallback(() => {
    const source = sources.find((item) => item.id === previewSourceId)
    setPreviewSourceId(null)
    if (source) {
      events.emit('previewClose', {
        source: toKnowledgeSourceEventData(source),
      })
    }
  }, [events, previewSourceId, sources])

  return {
    previewSource,
    previewFocusVersion,
    openPreview,
    closePreview,
  }
}
