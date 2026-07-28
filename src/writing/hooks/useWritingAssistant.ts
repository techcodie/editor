import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { EditorApi } from '../../lib/editor-api'
import type { InternalDocumentEditorEvents } from '../../sdk/events'
import { useHistory } from '../../history/hooks/useHistory'
import { createHistoryStorage } from '../../history/services/historyStorage'
import { analyzeWriting } from '../services/writingAnalysis'
import {
  createLocalRewrite,
  requestWritingRewrite,
  WritingRewriteError,
} from '../services/rewriteEngine'
import type { WritingSuggestion } from '../types/suggestion'
import type {
  WritingAnalysis,
  WritingAnalysisProgress,
  WritingRewriteAction,
  WritingRewriteResult,
  WritingRewriteScope,
} from '../types/writing'

const IDLE_PROGRESS: WritingAnalysisProgress = {
  stage: 'idle', progress: 0, message: 'Ready to analyze',
}

interface UseWritingAssistantOptions {
  api: EditorApi | null
  active: boolean
  namespace: string
  author: { id: string; name: string }
  aiEndpoint?: string
  events: InternalDocumentEditorEvents
  onAnalysisChange?: (analysis: WritingAnalysis | null) => void
}

export function useWritingAssistant(options: UseWritingAssistantOptions) {
  const { api, active, namespace, author, aiEndpoint, events, onAnalysisChange } = options
  const storage = useMemo(() => createHistoryStorage(namespace), [namespace])
  const history = useHistory({ api, storage, author })
  const analysisControllerRef = useRef<AbortController | null>(null)
  const rewriteControllerRef = useRef<AbortController | null>(null)
  const analysisRunningRef = useRef(false)
  const rewriteRunningRef = useRef(false)
  const [analysis, setAnalysis] = useState<WritingAnalysis | null>(null)
  const [progress, setProgress] = useState<WritingAnalysisProgress>(IDLE_PROGRESS)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [rewrite, setRewrite] = useState<WritingRewriteResult | null>(null)
  const [isRewriting, setIsRewriting] = useState(false)
  const [documentTick, setDocumentTick] = useState(0)

  useEffect(() => {
    if (!api) return
    let timeout: number | undefined
    const unsubscribe = api.subscribeDocumentChanges((change) => {
      if (!change.docChanged) return
      window.clearTimeout(timeout)
      timeout = window.setTimeout(() => setDocumentTick((value) => value + 1), 500)
    })
    return () => {
      window.clearTimeout(timeout)
      unsubscribe()
    }
  }, [api])

  const run = useCallback(async (force = false) => {
    if (!api || analysisRunningRef.current) return null
    analysisControllerRef.current?.abort()
    const controller = new AbortController()
    analysisControllerRef.current = controller
    analysisRunningRef.current = true
    setIsAnalyzing(true)
    setError(null)
    setProgress({ stage: 'grammar', progress: 5, message: 'Preparing document analysis' })
    try {
      const next = await analyzeWriting(api.getDocumentText(), {
        force,
        signal: controller.signal,
        onProgress: setProgress,
      })
      if (controller.signal.aborted) return null
      setAnalysis(next)
      setDismissedIds([])
      onAnalysisChange?.(next)
      return next
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return null
      const message = reason instanceof Error ? reason.message : 'Writing analysis could not be completed.'
      setError(message)
      events.emit('error', { scope: 'editor', message, cause: reason })
      return null
    } finally {
      if (analysisControllerRef.current === controller) analysisControllerRef.current = null
      analysisRunningRef.current = false
      setIsAnalyzing(false)
    }
  }, [api, events, onAnalysisChange])

  useEffect(() => {
    if (!active || !api) return
    const timeout = window.setTimeout(() => { void run(false) }, 80)
    return () => window.clearTimeout(timeout)
  }, [active, api, documentTick, run])

  const startRewrite = useCallback(async (
    action: WritingRewriteAction,
    scope: WritingRewriteScope,
    sourceText?: string,
  ) => {
    if (!api || rewriteRunningRef.current) return null
    const selectedText = api.getTextSelection()?.text.trim()
    const originalText = sourceText?.trim() || (scope === 'selection' ? selectedText : api.getDocumentText().trim())
    if (!originalText) {
      setError(scope === 'selection' ? 'Select text or choose a suggestion before rewriting.' : 'The document is empty.')
      return null
    }
    rewriteControllerRef.current?.abort()
    const controller = new AbortController()
    rewriteControllerRef.current = controller
    rewriteRunningRef.current = true
    const id = crypto.randomUUID()
    const startedAt = performance.now()
    setIsRewriting(true)
    setRewrite(null)
    setError(null)
    const localRewrite = createLocalRewrite(originalText, action)
    let rewrittenText = localRewrite
    let assistedByAi = false
    try {
      if (aiEndpoint) {
        events.emit('aiRequest', { workflow: 'writing', requestId: id })
        try {
          rewrittenText = await requestWritingRewrite({
            text: originalText,
            action,
            document: api.getDocumentText() || undefined,
          }, controller.signal, aiEndpoint)
          assistedByAi = true
          events.emit('aiResponse', {
            workflow: 'writing', responseId: id, content: rewrittenText,
            responseTime: Math.max(0, Math.round(performance.now() - startedAt)),
          })
        } catch (reason) {
          if (reason instanceof DOMException && reason.name === 'AbortError') throw reason
          if (!localRewrite || localRewrite === originalText) throw reason
          const message = reason instanceof Error ? reason.message : 'Writing AI is unavailable.'
          setError(`${message} Showing a local rewrite instead.`)
          events.emit('error', { scope: 'ai', message, cause: reason })
          rewrittenText = localRewrite
        }
      }
      if (!rewrittenText || rewrittenText === originalText) {
        throw new WritingRewriteError(
          action === 'expand' && !aiEndpoint
            ? 'Expand requires the configured writing AI endpoint.'
            : 'The rewrite did not produce a meaningful change.',
        )
      }
      const result: WritingRewriteResult = {
        id, action, scope, originalText, rewrittenText,
        createdAt: Date.now(), assistedByAi,
      }
      setRewrite(result)
      return result
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return null
      const message = reason instanceof Error ? reason.message : 'The rewrite could not be completed.'
      setError(message)
      events.emit('error', { scope: aiEndpoint ? 'ai' : 'editor', message, cause: reason })
      return null
    } finally {
      if (rewriteControllerRef.current === controller) rewriteControllerRef.current = null
      rewriteRunningRef.current = false
      setIsRewriting(false)
    }
  }, [aiEndpoint, api, events])

  const cancel = useCallback(() => {
    analysisControllerRef.current?.abort()
    analysisControllerRef.current = null
    analysisRunningRef.current = false
    setIsAnalyzing(false)
    setProgress(IDLE_PROGRESS)
  }, [])

  const cancelRewrite = useCallback(() => {
    rewriteControllerRef.current?.abort()
    rewriteControllerRef.current = null
    rewriteRunningRef.current = false
    setIsRewriting(false)
    setRewrite(null)
  }, [])

  const saveAnalysisSnapshot = useCallback(async (label = 'Writing analysis') => {
    if (!analysis) return null
    return history.saveSnapshot({
      name: `${label} · ${analysis.score}/100`,
      description: `${analysis.suggestions.length} writing suggestions; ${analysis.tone.primary} tone; readability ${analysis.readability.score}/100.`,
      reason: 'Writing assistant analysis checkpoint',
      comments: `Correctness ${analysis.scoreBreakdown.correctness}; clarity ${analysis.scoreBreakdown.clarity}; engagement ${analysis.scoreBreakdown.engagement}; delivery ${analysis.scoreBreakdown.delivery}.`,
      source: 'writing',
    })
  }, [analysis, history])

  const visibleSuggestions = useMemo(() => analysis?.suggestions.map((suggestion) => ({
    ...suggestion,
    status: dismissedIds.includes(suggestion.id) ? 'dismissed' as const : 'open' as const,
  })) ?? [], [analysis?.suggestions, dismissedIds])

  useEffect(() => () => {
    analysisControllerRef.current?.abort()
    rewriteControllerRef.current?.abort()
  }, [])

  return {
    analysis,
    progress,
    isAnalyzing,
    error: error ?? history.error,
    clearError: () => { setError(null); history.clearError() },
    suggestions: visibleSuggestions,
    openSuggestions: visibleSuggestions.filter((item) => item.status === 'open'),
    rewrite,
    isRewriting,
    run,
    cancel,
    startRewrite,
    cancelRewrite,
    clearRewrite: () => setRewrite(null),
    dismissSuggestion: (suggestion: WritingSuggestion) => setDismissedIds((current) => [...new Set([...current, suggestion.id])]),
    restoreSuggestion: (suggestion: WritingSuggestion) => setDismissedIds((current) => current.filter((id) => id !== suggestion.id)),
    saveAnalysisSnapshot,
    isSavingSnapshot: history.saving,
  }
}
