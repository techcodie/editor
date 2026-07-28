export type KnowledgeNodeType =
  | 'document'
  | 'section'
  | 'clause'
  | 'entity'
  | 'reference'
  | 'knowledge-source'

export type KnowledgeEdgeType =
  | 'contains'
  | 'mentions'
  | 'references'
  | 'sourced-from'
  | 'related-to'
  | 'shares-topic'

export interface KnowledgeGraphNode {
  id: string
  type: KnowledgeNodeType
  label: string
  documentId?: string
  metadata?: Record<string, string | number | boolean>
}

export interface KnowledgeGraphEdge {
  id: string
  source: string
  target: string
  type: KnowledgeEdgeType
  weight: number
}

export interface KnowledgeGraph {
  nodes: KnowledgeGraphNode[]
  edges: KnowledgeGraphEdge[]
  builtAt: number
}

export interface RelatedDocument {
  documentId: string
  score: number
  sharedEntities: string[]
  sharedTopics: string[]
  references: string[]
}
