import { useCallback, useMemo, useState } from 'react'
import type { KnowledgeSource } from '../types/source'

export function useDocumentPreview(sources: KnowledgeSource[]) {
  const [previewSourceId, setPreviewSourceId] = useState<string | null>(null)
  const [previewFocusVersion, setPreviewFocusVersion] = useState(0)
  const previewSource = useMemo(
    () => sources.find((source) => source.id === previewSourceId) ?? null,
    [previewSourceId, sources],
  )

  const openPreview = useCallback((source: KnowledgeSource) => {
    if (source.status === 'uploaded' && source.parseStatus === 'ready') {
      setPreviewSourceId(source.id)
      setPreviewFocusVersion((version) => version + 1)
    }
  }, [])

  const closePreview = useCallback(() => {
    setPreviewSourceId(null)
  }, [])

  return {
    previewSource,
    previewFocusVersion,
    openPreview,
    closePreview,
  }
}
