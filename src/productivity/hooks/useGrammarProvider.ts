import { useCallback, useEffect, useRef, useState } from 'react'
import type { EditorApi } from '../../lib/editor-api'
import type { WritingAnalysis, WritingAnalysisProgress } from '../../writing/types/writing'
import type { GrammarProvider } from '../types/provider'

export type GrammarAnalysisScope = 'document' | 'selection'

export function useGrammarProvider(provider: GrammarProvider, api: EditorApi | null) {
  const [analysis, setAnalysis] = useState<WritingAnalysis | null>(null)
  const [scope, setScope] = useState<GrammarAnalysisScope>('document')
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'error'>('idle')
  const [progress, setProgress] = useState<WritingAnalysisProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setStatus('idle')
  }, [])

  useEffect(() => cancel, [cancel])

  const analyze = useCallback(async (nextScope: GrammarAnalysisScope = scope, force = false) => {
    if (!api || controllerRef.current || status === 'analyzing') return null
    const text = nextScope === 'selection'
      ? api.getTextSelection()?.text ?? ''
      : api.getDocumentText()
    if (!text.trim()) {
      setError(nextScope === 'selection' ? 'Select text before checking it.' : 'Add document text before checking it.')
      setStatus('error')
      return null
    }
    const controller = new AbortController()
    controllerRef.current = controller
    setScope(nextScope)
    setStatus('analyzing')
    setError(null)
    try {
      const result = await provider.analyze(text, {
        force,
        signal: controller.signal,
        onProgress: setProgress,
      })
      setAnalysis(result)
      setStatus('idle')
      return result
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') {
        setStatus('idle')
        return null
      }
      setError(cause instanceof Error ? cause.message : 'Writing analysis failed.')
      setStatus('error')
      return null
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }, [api, provider, scope, status])

  return { analysis, scope, status, progress, error, analyze, cancel, setScope }
}
