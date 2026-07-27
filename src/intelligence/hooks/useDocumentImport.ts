import { useCallback, useEffect, useRef, useState } from 'react'
import { analyzeDocument } from '../services/documentIntelligence'
import type {
  DocumentImportProgress,
  DocumentModel,
} from '../types/documentModel'

const INITIAL_PROGRESS: DocumentImportProgress = {
  stage: 'idle',
  progress: 0,
  message: 'Choose a document to begin',
}

export function useDocumentImport() {
  const controllerRef = useRef<AbortController | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [model, setModel] = useState<DocumentModel | null>(null)
  const [progress, setProgress] = useState<DocumentImportProgress>(INITIAL_PROGRESS)
  const [error, setError] = useState<string | null>(null)
  const isProcessing = !['idle', 'complete', 'error', 'cancelled'].includes(progress.stage)

  const cancel = useCallback(() => controllerRef.current?.abort(), [])
  const clear = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setFile(null)
    setModel(null)
    setError(null)
    setProgress(INITIAL_PROGRESS)
  }, [])

  const importDocument = useCallback(async (nextFile: File) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setFile(nextFile)
    setModel(null)
    setError(null)
    setProgress({ stage: 'analyzing', progress: 1, message: 'Preparing document' })

    try {
      const nextModel = await analyzeDocument(nextFile, {
        signal: controller.signal,
        onProgress: setProgress,
      })
      if (!controller.signal.aborted) setModel(nextModel)
      return nextModel
    } catch (caught) {
      if (controller.signal.aborted) {
        setProgress({ stage: 'cancelled', progress: 0, message: 'Import cancelled' })
        return null
      }
      const message = caught instanceof Error ? caught.message : 'This document could not be analyzed.'
      setError(message)
      setProgress({ stage: 'error', progress: 0, message })
      return null
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }, [])

  useEffect(() => () => controllerRef.current?.abort(), [])

  return {
    file,
    model,
    progress,
    error,
    isProcessing,
    importDocument,
    cancel,
    clear,
  }
}
