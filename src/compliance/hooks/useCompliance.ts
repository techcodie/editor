import { useCallback, useEffect, useRef, useState } from 'react'
import { createDocumentModelFromText } from '../../intelligence/services/documentIntelligence'
import type { EditorApi } from '../../lib/editor-api'
import type { InternalDocumentEditorEvents } from '../../sdk/events'
import {
  analyzeCompliance,
  fingerprintDocument,
} from '../services/complianceEngine'
import type { ComplianceProgress, ComplianceReport } from '../types/compliance'

const IDLE_PROGRESS: ComplianceProgress = {
  stage: 'idle',
  progress: 0,
  message: 'Ready to analyze',
}

interface UseComplianceOptions {
  api: EditorApi | null
  active: boolean
  aiEndpoint?: string
  events: InternalDocumentEditorEvents
}

export function useCompliance({ api, active, aiEndpoint, events }: UseComplianceOptions) {
  const [report, setReport] = useState<ComplianceReport | null>(null)
  const [progress, setProgress] = useState<ComplianceProgress>(IDLE_PROGRESS)
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const lastFingerprintRef = useRef('')

  const cancel = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setProgress((current) => current.stage === 'complete'
      ? current
      : { stage: 'cancelled', progress: current.progress, message: 'Analysis stopped' })
  }, [])

  const analyze = useCallback(async (force = false) => {
    if (!api) return
    const text = api.getDocumentText().trim()
    if (!text) {
      setReport(null)
      setError('Add document content before running compliance analysis.')
      setProgress(IDLE_PROGRESS)
      return
    }
    const documentFingerprint = fingerprintDocument(text)
    if (!force && documentFingerprint === lastFingerprintRef.current) return
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    const requestId = crypto.randomUUID()
    const startedAt = performance.now()
    setError(null)
    events.emit('aiRequest', { workflow: 'compliance', requestId })
    try {
      const model = createDocumentModelFromText(text)
      const nextReport = await analyzeCompliance(
        { model, documentFingerprint },
        {
          signal: controller.signal,
          aiEndpoint,
          useCache: !force,
          onProgress: setProgress,
        },
      )
      if (controller.signal.aborted) return
      lastFingerprintRef.current = documentFingerprint
      setReport(nextReport)
      events.emit('aiResponse', {
        workflow: 'compliance',
        responseId: nextReport.id,
        content: JSON.stringify(nextReport),
        responseTime: performance.now() - startedAt,
      })
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return
      const message = cause instanceof Error ? cause.message : 'Compliance analysis failed.'
      setError(message)
      setProgress({ stage: 'error', progress: 0, message })
      events.emit('error', { scope: 'compliance', message, cause })
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }, [aiEndpoint, api, events])

  useEffect(() => {
    if (!active || !api) return
    void analyze()
    let timeout: number | undefined
    const unsubscribe = api.subscribe(() => {
      window.clearTimeout(timeout)
      timeout = window.setTimeout(() => { void analyze() }, 900)
    })
    return () => {
      window.clearTimeout(timeout)
      unsubscribe()
    }
  }, [active, analyze, api])

  useEffect(() => () => controllerRef.current?.abort(), [])

  return {
    report,
    progress,
    error,
    isAnalyzing: !['idle', 'complete', 'error', 'cancelled'].includes(progress.stage),
    analyze,
    cancel,
  }
}
