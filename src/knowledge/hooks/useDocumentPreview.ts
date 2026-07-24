import { useCallback, useState } from 'react'
import type { KnowledgeSource } from '../types/source'

export function useDocumentPreview() {
  const [previewSource, setPreviewSource] = useState<KnowledgeSource | null>(null)

  const openPreview = useCallback((source: KnowledgeSource) => {
    if (source.status === 'uploaded' && source.parseStatus === 'ready') {
      setPreviewSource(source)
    }
  }, [])

  const closePreview = useCallback(() => {
    setPreviewSource(null)
  }, [])

  return {
    previewSource,
    openPreview,
    closePreview,
  }
}
