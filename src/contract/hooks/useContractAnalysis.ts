import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ComplianceFinding } from '../../compliance/types/compliance'
import type { EditorApi } from '../../lib/editor-api'
import { compareContractAnalyses } from '../services/comparisonEngine'
import { analyzeContract, loadContractAnalysisHistory, saveContractAnalysisHistory, saveContractVersionSnapshot } from '../services/contractAnalysis'
import type { ContractAnalysis, ContractAnalysisComparison, ContractAnalysisHistoryEntry, ContractAnalysisProgress, ContractPlaybook } from '../types/contract'

const IDLE_PROGRESS: ContractAnalysisProgress = { stage: 'idle', progress: 0, message: 'Ready to analyze' }

interface UseContractAnalysisOptions {
  api: EditorApi | null
  active: boolean
  namespace: string
  author: { id: string; name: string }
  playbook?: ContractPlaybook | null
  complianceFindings?: ComplianceFinding[]
  aiEndpoint?: string
  onAnalysisChange?: (analysis: ContractAnalysis | null) => void
}

export function useContractAnalysis(options: UseContractAnalysisOptions) {
  const { api, active, namespace, author, playbook, complianceFindings = [], aiEndpoint, onAnalysisChange } = options
  const controllerRef = useRef<AbortController | null>(null)
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null)
  const [history, setHistory] = useState<ContractAnalysisHistoryEntry[]>(() => loadContractAnalysisHistory(namespace))
  const [progress, setProgress] = useState(IDLE_PROGRESS)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setHistory(loadContractAnalysisHistory(namespace)) }, [namespace])

  const run = useCallback(async (force = false) => {
    const text = api?.getDocumentText().trim() ?? ''
    if (!text) { setError('Add contract content before running analysis.'); return null }
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsAnalyzing(true)
    setError(null)
    try {
      const next = await analyzeContract(text, {
        signal: controller.signal, onProgress: setProgress, playbook, complianceFindings,
        aiEndpoint, useCache: !force,
      })
      if (controller.signal.aborted) return null
      setAnalysis(next)
      setHistory(saveContractAnalysisHistory(namespace, next))
      onAnalysisChange?.(next)
      return next
    } catch (reason) {
      if (controller.signal.aborted || (reason instanceof DOMException && reason.name === 'AbortError')) {
        setProgress({ stage: 'cancelled', progress: 0, message: 'Analysis cancelled' })
        return null
      }
      const message = reason instanceof Error ? reason.message : 'Contract analysis could not be completed.'
      setError(message)
      setProgress({ stage: 'error', progress: 0, message })
      return null
    } finally {
      if (controllerRef.current === controller) { controllerRef.current = null; setIsAnalyzing(false) }
    }
  }, [aiEndpoint, api, complianceFindings, namespace, onAnalysisChange, playbook])

  useEffect(() => {
    if (!active || !api) return
    if (!analysis) void run()
    let timeout: number | undefined
    return api.subscribeDocumentChanges(() => {
      window.clearTimeout(timeout)
      timeout = window.setTimeout(() => { void run() }, 1_000)
    })
  }, [active, analysis, api, run])

  useEffect(() => () => controllerRef.current?.abort(), [])

  const previous = useMemo(() => history.find((item) => item.analysis.id !== analysis?.id)?.analysis ?? null, [analysis?.id, history])
  const comparison = useMemo<ContractAnalysisComparison | null>(() => analysis && previous ? compareContractAnalyses(previous, analysis) : null, [analysis, previous])

  const saveSnapshot = useCallback(async () => {
    if (!api || !analysis) throw new Error('Run contract analysis before saving a version.')
    return saveContractVersionSnapshot(api, namespace, author, analysis)
  }, [analysis, api, author, namespace])

  return {
    analysis, history, previous, comparison, progress, isAnalyzing, error,
    run, cancel: () => controllerRef.current?.abort(), clearError: () => setError(null), saveSnapshot,
  }
}
