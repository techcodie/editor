import { useCallback, useState } from 'react'
import {
  CURRENT_DOCUMENT_SOURCE,
  getKnowledgeSourceType,
  type KnowledgeSource,
} from '../types/source'
import { parseKnowledgeSourceFile } from '../services/fileParser'

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
          isActive: true,
          file,
          parseStatus: 'parsing',
        },
      ]
    })

    if (uploadedSources.length > 0) {
      setSources((current) => [...current, ...uploadedSources])
    }

    for (const source of uploadedSources) {
      const file = source.file
      if (!file) continue

      void new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
        .then(() => parseKnowledgeSourceFile(file, source.type))
        .then((parsed) => {
          setSources((current) =>
            current.map((item) =>
              item.id === source.id
                ? {
                    ...item,
                    parseStatus: 'ready',
                    parsedContent: parsed.text,
                    previewHtml: parsed.html,
                    pageCount: parsed.pageCount,
                    errorMessage: undefined,
                  }
                : item,
            ),
          )
        })
        .catch((error: unknown) => {
          const errorMessage =
            error instanceof Error ? error.message : 'This file could not be prepared for preview.'
          setSources((current) =>
            current.map((item) =>
              item.id === source.id
                ? {
                    ...item,
                    parseStatus: 'error',
                    isActive: false,
                    errorMessage,
                  }
                : item,
            ),
          )
        })
    }
  }, [])

  const removeSource = useCallback((sourceId: string) => {
    setSources((current) =>
      current.filter((source) => source.status === 'current' || source.id !== sourceId),
    )
  }, [])

  const setSourceActive = useCallback((sourceId: string, isActive: boolean) => {
    setSources((current) =>
      current.map((source) =>
        source.id === sourceId &&
        source.status === 'uploaded' &&
        source.parseStatus === 'ready'
          ? { ...source, isActive }
          : source,
      ),
    )
  }, [])

  return {
    sources,
    addFiles,
    removeSource,
    setSourceActive,
  }
}
