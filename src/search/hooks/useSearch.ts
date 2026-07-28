import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ComplianceFinding } from '../../compliance/types/compliance'
import { createHistoryStorage, HISTORY_STORAGE_EVENT } from '../../history/services/historyStorage'
import { resolveSnapshot } from '../../history/services/snapshotEngine'
import { createDocumentModelFromText } from '../../intelligence/services/documentIntelligence'
import type { KnowledgeSource } from '../../knowledge/types/source'
import type { EditorApi } from '../../lib/editor-api'
import type { InternalDocumentEditorEvents } from '../../sdk/events'
import type { Workflow } from '../../workflow/types/workflow'
import { excludeRedactedText } from '../../redaction/services/exportSanitizer'
import type { RedactionRecord } from '../../redaction/types/redaction'
import { createSearchEngine } from '../services/searchEngine'
import type {
  IndexedDocument,
  RecentSearch,
  SavedSearch,
  SearchFiltersState,
  SearchIndexInput,
  SearchMode,
  SearchProgress,
  SearchResponse,
} from '../types/search'

const IDLE_PROGRESS: SearchProgress = {
  stage: 'idle', progress: 0, message: 'Ready to index', indexed: 0, total: 0,
}

interface UseSearchOptions {
  api: EditorApi | null
  active: boolean
  namespace: string
  knowledgeSources: KnowledgeSource[]
  workflow: Workflow | null
  complianceFindings: ComplianceFinding[]
  events: InternalDocumentEditorEvents
  redactions?: RedactionRecord[]
}

interface StoredSearchPreferences {
  recent: RecentSearch[]
  saved: SavedSearch[]
  pinned: string[]
}

function preferencesKey(namespace: string) {
  return `techcodie:editor:search:v1:${namespace}`
}

function readPreferences(namespace: string): StoredSearchPreferences {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(preferencesKey(namespace)) ?? '{}') as Partial<StoredSearchPreferences>
    return {
      recent: Array.isArray(parsed.recent) ? parsed.recent.slice(0, 8) : [],
      saved: Array.isArray(parsed.saved) ? parsed.saved.slice(0, 16) : [],
      pinned: Array.isArray(parsed.pinned) ? parsed.pinned : [],
    }
  } catch {
    return { recent: [], saved: [], pinned: [] }
  }
}

function writePreferences(namespace: string, preferences: StoredSearchPreferences) {
  try { window.localStorage.setItem(preferencesKey(namespace), JSON.stringify(preferences)) } catch { /* Storage is optional. */ }
}

function documentTitle(text: string): string {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim())?.trim() ?? ''
  return firstLine.replace(/^#{1,6}\s+/, '').slice(0, 90) || 'Current Document'
}

function modelTopics(text: string, title: string): string[] {
  return createDocumentModelFromText(text, title).searchIndex.entries
    .slice(0, 12)
    .map((entry) => entry.term)
}

function versionWorkflowStatus(value: string): string | undefined {
  const normalized = value.toLocaleLowerCase()
  if (normalized.includes('request changes')) return 'changes-requested'
  if (normalized.includes('reject')) return 'rejected'
  if (normalized.includes('approve')) return 'approved'
  if (normalized.includes('review')) return 'in-review'
  return undefined
}

export function useSearch({
  api,
  active,
  namespace,
  knowledgeSources,
  workflow,
  complianceFindings,
  events,
  redactions = [],
}: UseSearchOptions) {
  const engineRef = useRef(createSearchEngine())
  const indexControllerRef = useRef<AbortController | null>(null)
  const searchControllerRef = useRef<AbortController | null>(null)
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<SearchMode>('hybrid')
  const [filters, setFilters] = useState<Partial<SearchFiltersState>>({})
  const [progress, setProgress] = useState<SearchProgress>(IDLE_PROGRESS)
  const [response, setResponse] = useState<SearchResponse | null>(null)
  const [documents, setDocuments] = useState<IndexedDocument[]>([])
  const [historyInputs, setHistoryInputs] = useState<SearchIndexInput[]>([])
  const [documentTick, setDocumentTick] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [preferences, setPreferences] = useState(() => readPreferences(namespace))

  useEffect(() => {
    setPreferences(readPreferences(namespace))
  }, [namespace])

  useEffect(() => {
    if (!api) return
    let timeout: number | undefined
    return api.subscribeDocumentChanges(() => {
      window.clearTimeout(timeout)
      timeout = window.setTimeout(() => setDocumentTick((value) => value + 1), 450)
    })
  }, [api])

  useEffect(() => {
    let activeEffect = true
    const storage = createHistoryStorage(namespace)
    const load = async () => {
      const versions = await storage.load()
      const next = await Promise.all(versions.slice(0, 60).map(async (version) => {
        const content = await resolveSnapshot(version, versions)
        const searchableContent = [
          content.text,
          version.description,
          version.metadata.reason,
          version.metadata.comments,
          version.author.name,
        ].filter(Boolean).join('\n')
        return {
          id: `version:${version.id}`,
          title: version.name,
          content: searchableContent,
          metadata: {
            kind: 'version' as const,
            versionId: version.id,
            author: version.author.name,
            createdAt: version.createdAt,
            updatedAt: version.createdAt,
            workflowStatus: versionWorkflowStatus(`${version.name} ${version.metadata.reason}`),
            topics: modelTopics(searchableContent, version.name),
          },
        }
      }))
      if (activeEffect) setHistoryInputs(next)
    }
    void load().catch(() => { if (activeEffect) setHistoryInputs([]) })
    const reload = () => { void load() }
    window.addEventListener(HISTORY_STORAGE_EVENT, reload)
    return () => { activeEffect = false; window.removeEventListener(HISTORY_STORAGE_EVENT, reload) }
  }, [namespace])

  const inputs = useMemo<SearchIndexInput[]>(() => {
    void documentTick
    const currentText = excludeRedactedText(api?.getDocumentText() ?? '', redactions).trim()
    const currentTitle = documentTitle(currentText)
    const current: SearchIndexInput[] = currentText ? [{
      id: 'current-document',
      title: currentTitle,
      content: currentText,
      metadata: {
        kind: 'current-document',
        workflowStatus: workflow?.status ?? 'draft',
        updatedAt: Date.now(),
        topics: modelTopics(currentText, currentTitle),
        complianceFindingIds: complianceFindings.map((finding) => finding.id),
      },
    }] : []
    const findings: SearchIndexInput[] = complianceFindings.map((finding) => ({
      id: `finding:${finding.id}`,
      title: finding.title,
      content: [finding.description, finding.recommendation, finding.location.quote].filter(Boolean).join('\n'),
      metadata: {
        kind: 'compliance-finding',
        findingId: finding.id,
        severity: finding.severity,
        locationQuote: finding.location.quote,
        updatedAt: Date.now(),
        topics: [finding.type, finding.severity],
      },
    }))
    const sources: SearchIndexInput[] = knowledgeSources.flatMap((source) => {
      if (source.status !== 'uploaded' || source.parseStatus !== 'ready' || !source.parsedContent?.trim()) return []
      return [{
        id: `source:${source.id}`,
        title: source.name,
        content: source.parsedContent,
        metadata: {
          kind: 'knowledge-source',
          sourceId: source.id,
          sourceType: source.type,
          pageCount: source.pageCount,
          topics: modelTopics(source.parsedContent, source.name),
        },
      }]
    })
    return [...current, ...findings, ...sources, ...historyInputs]
  }, [api, complianceFindings, documentTick, historyInputs, knowledgeSources, redactions, workflow?.status])

  const executeSearch = useCallback(async (
    nextQuery = query,
    nextMode = mode,
    nextFilters = filters,
    relatedDocumentId?: string,
    record = true,
  ) => {
    searchControllerRef.current?.abort()
    const controller = new AbortController()
    searchControllerRef.current = controller
    try {
      const next = await engineRef.current.search({
        query: nextQuery,
        mode: nextMode,
        filters: nextFilters,
        relatedDocumentId,
      }, controller.signal)
      if (controller.signal.aborted) return null
      setResponse(next)
      setError(null)
      events.emit('search', {
        query: next.query,
        mode: next.mode,
        total: next.total,
        durationMs: next.durationMs,
      })
      if (record && nextQuery.trim()) {
        setPreferences((current) => {
          const recent = [
            { query: nextQuery.trim(), mode: nextMode, searchedAt: Date.now() },
            ...current.recent.filter((item) => item.query !== nextQuery.trim() || item.mode !== nextMode),
          ].slice(0, 8)
          const updated = { ...current, recent }
          writePreferences(namespace, updated)
          return updated
        })
      }
      return next
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return null
      setError(cause instanceof Error ? cause.message : 'Search could not be completed.')
      events.emit('error', {
        scope: 'search',
        message: cause instanceof Error ? cause.message : 'Search could not be completed.',
        cause,
      })
      return null
    }
  }, [events, filters, mode, namespace, query])

  useEffect(() => {
    if (!active) return
    indexControllerRef.current?.abort()
    const controller = new AbortController()
    indexControllerRef.current = controller
    void engineRef.current.index(inputs, { signal: controller.signal, onProgress: setProgress })
      .then((indexed) => {
        if (controller.signal.aborted) return
        setDocuments(indexed)
        const currentGraph = engineRef.current.getGraph()
        events.emit('searchIndexChange', {
          documentCount: indexed.length,
          nodeCount: currentGraph.nodes.length,
          relationshipCount: currentGraph.edges.length,
        })
      })
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setProgress({ ...IDLE_PROGRESS, stage: 'error', message: 'Search indexing failed' })
        setError(cause instanceof Error ? cause.message : 'Search indexing failed.')
        events.emit('error', {
          scope: 'search',
          message: cause instanceof Error ? cause.message : 'Search indexing failed.',
          cause,
        })
      })
    return () => controller.abort()
  }, [active, events, inputs])

  useEffect(() => {
    if (!active || progress.stage !== 'ready') return
    const timeout = window.setTimeout(() => { void executeSearch(query, mode, filters) }, 180)
    return () => window.clearTimeout(timeout)
  }, [active, executeSearch, filters, mode, progress.stage, query])

  useEffect(() => () => {
    indexControllerRef.current?.abort()
    searchControllerRef.current?.abort()
  }, [])

  const saveSearch = useCallback((name?: string) => {
    if (!query.trim()) return
    setPreferences((current) => {
      const saved: SavedSearch[] = [{
        id: crypto.randomUUID(),
        name: name?.trim() || query.trim(),
        query: query.trim(),
        mode,
        filters,
        createdAt: Date.now(),
      }, ...current.saved].slice(0, 16)
      const updated = { ...current, saved }
      writePreferences(namespace, updated)
      return updated
    })
  }, [filters, mode, namespace, query])

  const removeSavedSearch = useCallback((id: string) => {
    setPreferences((current) => {
      const updated = { ...current, saved: current.saved.filter((item) => item.id !== id) }
      writePreferences(namespace, updated)
      return updated
    })
  }, [namespace])

  const togglePinned = useCallback((documentId: string) => {
    setPreferences((current) => {
      const pinned = current.pinned.includes(documentId)
        ? current.pinned.filter((id) => id !== documentId)
        : [...current.pinned, documentId]
      const updated = { ...current, pinned }
      writePreferences(namespace, updated)
      return updated
    })
  }, [namespace])

  const applySavedSearch = useCallback((saved: SavedSearch) => {
    setQuery(saved.query)
    setMode(saved.mode)
    setFilters(saved.filters)
  }, [])

  return {
    query,
    mode,
    filters,
    progress,
    response,
    documents,
    graph: engineRef.current.getGraph(),
    error,
    recentSearches: preferences.recent,
    savedSearches: preferences.saved,
    pinnedDocumentIds: preferences.pinned,
    setQuery,
    setMode,
    setFilters,
    executeSearch,
    saveSearch,
    removeSavedSearch,
    applySavedSearch,
    togglePinned,
  }
}
