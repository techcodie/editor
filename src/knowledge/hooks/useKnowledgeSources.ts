import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CURRENT_DOCUMENT_SOURCE,
  getKnowledgeSourceType,
  type KnowledgeSource,
  type PreparedKnowledgeSource,
} from '../types/source'
import { parseKnowledgeSourceFile } from '../services/fileParser'
import type { InternalDocumentEditorEvents } from '../../sdk/events'
import { toKnowledgeSourceEventData } from '../../sdk/knowledge-events'

export function useKnowledgeSources(events: InternalDocumentEditorEvents) {
  const [sources, setSources] = useState<KnowledgeSource[]>([CURRENT_DOCUMENT_SOURCE])
  const sourcesRef = useRef(sources)

  useEffect(() => {
    sourcesRef.current = sources
  }, [sources])

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
      for (const source of uploadedSources) {
        events.emit('knowledgeSourceAdded', {
          source: toKnowledgeSourceEventData(source),
        })
      }
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
          events.emit('error', {
            scope: 'knowledge',
            message: errorMessage,
            cause: error,
          })
        })
    }
  }, [events])

  const addPreparedSource = useCallback((prepared: PreparedKnowledgeSource) => {
    const source: KnowledgeSource = {
      id: crypto.randomUUID(),
      name: prepared.name,
      type: prepared.type,
      size: prepared.size,
      status: 'uploaded',
      isActive: true,
      file: prepared.file,
      parseStatus: 'ready',
      parsedContent: prepared.text,
      previewHtml: prepared.html,
      pageCount: prepared.pageCount,
    }
    setSources((current) => [...current, source])
    events.emit('knowledgeSourceAdded', {
      source: toKnowledgeSourceEventData(source),
    })
    return source
  }, [events])

  const removeSource = useCallback((sourceId: string) => {
    const source = sourcesRef.current.find((item) => item.id === sourceId)
    setSources((current) =>
      current.filter((source) => source.status === 'current' || source.id !== sourceId),
    )
    if (source?.status === 'uploaded') {
      events.emit('knowledgeSourceRemoved', {
        source: toKnowledgeSourceEventData(source),
      })
    }
  }, [events])

  const setSourceActive = useCallback((sourceId: string, isActive: boolean) => {
    const source = sourcesRef.current.find((item) => item.id === sourceId)
    setSources((current) =>
      current.map((source) =>
        source.id === sourceId &&
        source.status === 'uploaded' &&
        source.parseStatus === 'ready'
          ? { ...source, isActive }
          : source,
      ),
    )
    if (source?.status === 'uploaded' && source.parseStatus === 'ready') {
      events.emit('knowledgeSourceActivated', {
        source: toKnowledgeSourceEventData({ ...source, isActive }),
        isActive,
      })
    }
  }, [events])

  return {
    sources,
    addFiles,
    addPreparedSource,
    removeSource,
    setSourceActive,
  }
}
