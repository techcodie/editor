import { useCallback, useState } from 'react'
import {
  CURRENT_DOCUMENT_SOURCE,
  getKnowledgeSourceType,
  type KnowledgeSource,
} from '../types/source'

export function useKnowledgeSources() {
  const [sources, setSources] = useState<KnowledgeSource[]>([CURRENT_DOCUMENT_SOURCE])

  const addFiles = useCallback((files: File[]) => {
    const uploadedSources = files.flatMap<KnowledgeSource>((file) => {
      const type = getKnowledgeSourceType(file)
      if (!type) return []

      return [
        {
          id: crypto.randomUUID(),
          name: file.name,
          type,
          size: file.size,
          status: 'uploaded',
        },
      ]
    })

    if (uploadedSources.length > 0) {
      setSources((current) => [...current, ...uploadedSources])
    }
  }, [])

  const removeSource = useCallback((sourceId: string) => {
    setSources((current) =>
      current.filter((source) => source.status === 'current' || source.id !== sourceId),
    )
  }, [])

  return {
    sources,
    addFiles,
    removeSource,
  }
}
