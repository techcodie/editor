import { createLocalEmbeddingProvider } from './embeddingEngine'
import { linkSearchDocument, fingerprintSearchInput } from './documentLinker'
import { runHybridSearch } from './hybridSearch'
import { buildKnowledgeGraph } from './knowledgeGraph'
import type { KnowledgeGraph } from '../types/knowledgeGraph'
import type {
  EmbeddingProvider,
  IndexedDocument,
  SearchEngineOptions,
  SearchIndexInput,
  SearchProgress,
  SearchRequest,
  SearchResponse,
} from '../types/search'

export interface SemanticSearchEngine {
  index(inputs: SearchIndexInput[], options?: {
    signal?: AbortSignal
    onProgress?: (progress: SearchProgress) => void
  }): Promise<IndexedDocument[]>
  search(request: SearchRequest, signal?: AbortSignal): Promise<SearchResponse>
  getDocuments(): IndexedDocument[]
  getGraph(): KnowledgeGraph
  clear(): void
}

function matchesFilters(document: IndexedDocument, request: SearchRequest): boolean {
  const filters = request.filters
  if (request.mode === 'knowledge-sources' && document.metadata.kind !== 'knowledge-source') return false
  if (filters?.kinds?.length && !filters.kinds.includes(document.metadata.kind)) return false
  if (
    filters?.workflowStatuses?.length &&
    (!document.metadata.workflowStatus || !filters.workflowStatuses.includes(document.metadata.workflowStatus))
  ) return false
  const updatedAt = document.metadata.updatedAt ?? document.metadata.createdAt ?? 0
  if (filters?.updatedAfter && updatedAt < filters.updatedAfter) return false
  return true
}

function message(stage: SearchProgress['stage'], progress: number, indexed: number, total: number): SearchProgress {
  const labels: Record<SearchProgress['stage'], string> = {
    idle: 'Ready to index',
    collecting: 'Preparing documents',
    embedding: 'Building semantic index',
    graph: 'Linking document knowledge',
    ready: 'Search index ready',
    error: 'Search indexing failed',
  }
  return { stage, progress, message: labels[stage], indexed, total }
}

export function createSearchEngine(options: SearchEngineOptions = {}): SemanticSearchEngine {
  const provider: EmbeddingProvider = options.embeddingProvider ?? createLocalEmbeddingProvider()
  const cacheSize = Math.max(5, options.cacheSize ?? 30)
  let documents = new Map<string, IndexedDocument>()
  let graph: KnowledgeGraph = { nodes: [], edges: [], builtAt: Date.now() }
  let revision = 0
  const cache = new Map<string, SearchResponse>()

  return {
    async index(inputs, indexOptions = {}) {
      const { signal, onProgress } = indexOptions
      const total = inputs.length
      onProgress?.(message('collecting', 5, 0, total))
      const next = new Map<string, IndexedDocument>()
      for (let index = 0; index < inputs.length; index += 1) {
        if (signal?.aborted) throw new DOMException('Search indexing cancelled.', 'AbortError')
        const input = inputs[index]
        const fingerprint = fingerprintSearchInput(input)
        const existing = documents.get(input.id)
        const indexed = existing?.fingerprint === fingerprint
          ? existing
          : linkSearchDocument(input, await provider.embed(`${input.title}\n${input.content}`, signal))
        next.set(input.id, indexed)
        onProgress?.(message('embedding', 10 + Math.round(((index + 1) / Math.max(1, total)) * 75), index + 1, total))
        if (index % 6 === 5) await new Promise<void>((resolve) => setTimeout(resolve, 0))
      }
      onProgress?.(message('graph', 92, total, total))
      documents = next
      graph = buildKnowledgeGraph([...documents.values()])
      revision += 1
      cache.clear()
      onProgress?.(message('ready', 100, total, total))
      return this.getDocuments()
    },
    async search(request, signal) {
      if (signal?.aborted) throw new DOMException('Search cancelled.', 'AbortError')
      const startedAt = Date.now()
      const normalizedQuery = request.query.trim()
      const cacheKey = JSON.stringify([revision, normalizedQuery, request.mode, request.filters, request.relatedDocumentId, request.limit])
      const cached = cache.get(cacheKey)
      if (cached) return { ...cached, searchedAt: Date.now(), durationMs: Date.now() - startedAt }
      const searchable = [...documents.values()].filter((document) => matchesFilters(document, request))
      const embedding = normalizedQuery ? await provider.embed(normalizedQuery, signal) : Array(provider.dimensions).fill(0)
      const ranked = runHybridSearch(normalizedQuery, request.mode, searchable, embedding, graph, request.relatedDocumentId)
        .filter((result) => {
          if (request.mode === 'recent') return true
          if (request.mode === 'related') return result.scoreBreakdown.relationship > 0
          if (!normalizedQuery) return true
          return result.scoreBreakdown.keyword > 0 || result.scoreBreakdown.semantic > 0.12
        })
        .toSorted((left, right) => right.score - left.score || left.title.localeCompare(right.title))
      const response: SearchResponse = {
        query: normalizedQuery,
        mode: request.mode,
        results: ranked.slice(0, Math.max(1, request.limit ?? 50)),
        total: ranked.length,
        searchedAt: Date.now(),
        durationMs: Date.now() - startedAt,
      }
      cache.set(cacheKey, response)
      if (cache.size > cacheSize) cache.delete(cache.keys().next().value as string)
      return response
    },
    getDocuments() {
      return [...documents.values()].map((document) => structuredClone(document))
    },
    getGraph() {
      return structuredClone(graph)
    },
    clear() {
      documents.clear()
      graph = { nodes: [], edges: [], builtAt: Date.now() }
      revision += 1
      cache.clear()
    },
  }
}
