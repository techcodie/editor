export type SearchMode =
  | 'hybrid'
  | 'semantic'
  | 'keyword'
  | 'related'
  | 'recent'
  | 'knowledge-sources'

export type SearchDocumentKind =
  | 'current-document'
  | 'knowledge-source'
  | 'version'
  | 'compliance-finding'
  | 'contract-clause'
  | 'contract-obligation'
  | 'contract-date'

export interface SearchDocumentMetadata {
  kind: SearchDocumentKind
  sourceId?: string
  sourceType?: string
  versionId?: string
  workflowStatus?: string
  author?: string
  createdAt?: number
  updatedAt?: number
  pageCount?: number
  topics?: string[]
  complianceFindingIds?: string[]
  findingId?: string
  severity?: string
  locationQuote?: string
  contractAnalysisId?: string
  contractClauseType?: string
  contractDateType?: string
}

export interface SearchSection {
  id: string
  title: string
  content: string
  start: number
  end: number
  level: number
}

export interface IndexedDocument {
  id: string
  title: string
  content: string
  metadata: SearchDocumentMetadata
  embedding: number[]
  keywords: string[]
  entities: string[]
  references: string[]
  sections: SearchSection[]
  lastIndexed: number
  fingerprint: string
}

export interface SearchFiltersState {
  kinds: SearchDocumentKind[]
  workflowStatuses: string[]
  updatedAfter?: number
}

export interface SearchRequest {
  query: string
  mode: SearchMode
  filters?: Partial<SearchFiltersState>
  relatedDocumentId?: string
  limit?: number
}

export interface SearchScoreBreakdown {
  keyword: number
  semantic: number
  metadata: number
  relationship: number
}

export interface SearchResult {
  id: string
  documentId: string
  title: string
  snippet: string
  score: number
  scoreBreakdown: SearchScoreBreakdown
  matchedTopics: string[]
  matchedKnowledgeSources: string[]
  relatedDocumentIds: string[]
  metadata: SearchDocumentMetadata
}

export interface SearchResponse {
  query: string
  mode: SearchMode
  results: SearchResult[]
  total: number
  searchedAt: number
  durationMs: number
}

export interface SearchProgress {
  stage: 'idle' | 'collecting' | 'embedding' | 'graph' | 'ready' | 'error'
  progress: number
  message: string
  indexed: number
  total: number
}

export interface SearchIndexInput {
  id: string
  title: string
  content: string
  metadata: SearchDocumentMetadata
}

export interface EmbeddingProvider {
  readonly id: string
  readonly dimensions: number
  embed(text: string, signal?: AbortSignal): Promise<number[]>
  embedMany?(texts: string[], signal?: AbortSignal): Promise<number[][]>
}

export interface SearchEngineOptions {
  embeddingProvider?: EmbeddingProvider
  cacheSize?: number
}

export interface SavedSearch {
  id: string
  name: string
  query: string
  mode: SearchMode
  filters: Partial<SearchFiltersState>
  createdAt: number
}

export interface RecentSearch {
  query: string
  mode: SearchMode
  searchedAt: number
}
