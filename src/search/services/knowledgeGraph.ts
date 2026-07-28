import type {
  KnowledgeGraph,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  RelatedDocument,
} from '../types/knowledgeGraph'
import type { IndexedDocument } from '../types/search'

function edgeId(source: string, type: string, target: string): string {
  return `${source}:${type}:${target}`
}

function normalizedSet(values: string[]): Set<string> {
  return new Set(values.map((value) => value.toLocaleLowerCase()))
}

export function buildKnowledgeGraph(documents: IndexedDocument[]): KnowledgeGraph {
  const nodes: KnowledgeGraphNode[] = []
  const edges: KnowledgeGraphEdge[] = []
  const nodeIds = new Set<string>()
  const addNode = (node: KnowledgeGraphNode) => {
    if (!nodeIds.has(node.id)) {
      nodeIds.add(node.id)
      nodes.push(node)
    }
  }
  for (const document of documents) {
    const documentNodeId = `document:${document.id}`
    addNode({
      id: documentNodeId,
      type: document.metadata.kind === 'knowledge-source' ? 'knowledge-source' : 'document',
      label: document.title,
      documentId: document.id,
      metadata: { kind: document.metadata.kind },
    })
    for (const section of document.sections.slice(0, 16)) {
      const sectionNodeId = `${documentNodeId}:section:${section.id}`
      addNode({ id: sectionNodeId, type: 'section', label: section.title, documentId: document.id })
      edges.push({ id: edgeId(documentNodeId, 'contains', sectionNodeId), source: documentNodeId, target: sectionNodeId, type: 'contains', weight: 1 })
      const clauses = section.content.split(/(?<=[.!?])\s+/).filter((sentence) => /\b(?:shall|must|required|agrees?)\b/i.test(sentence)).slice(0, 8)
      clauses.forEach((clause, index) => {
        const clauseNodeId = `${sectionNodeId}:clause:${index}`
        addNode({ id: clauseNodeId, type: 'clause', label: clause.slice(0, 72), documentId: document.id })
        edges.push({ id: edgeId(sectionNodeId, 'contains', clauseNodeId), source: sectionNodeId, target: clauseNodeId, type: 'contains', weight: 1 })
      })
    }
    for (const entity of document.entities) {
      const entityNodeId = `entity:${entity.toLocaleLowerCase()}`
      addNode({ id: entityNodeId, type: 'entity', label: entity })
      edges.push({ id: edgeId(documentNodeId, 'mentions', entityNodeId), source: documentNodeId, target: entityNodeId, type: 'mentions', weight: 0.8 })
    }
    for (const reference of document.references) {
      const referenceNodeId = `reference:${reference.toLocaleLowerCase()}`
      addNode({ id: referenceNodeId, type: 'reference', label: reference })
      edges.push({ id: edgeId(documentNodeId, 'references', referenceNodeId), source: documentNodeId, target: referenceNodeId, type: 'references', weight: 0.9 })
    }
  }
  for (let leftIndex = 0; leftIndex < documents.length; leftIndex += 1) {
    const left = documents[leftIndex]
    const leftEntities = normalizedSet(left.entities)
    const leftTopics = normalizedSet(left.keywords.slice(0, 10))
    for (let rightIndex = leftIndex + 1; rightIndex < documents.length; rightIndex += 1) {
      const right = documents[rightIndex]
      const sharedEntities = right.entities.filter((entity) => leftEntities.has(entity.toLocaleLowerCase()))
      const sharedTopics = right.keywords.slice(0, 10).filter((topic) => leftTopics.has(topic.toLocaleLowerCase()))
      const weight = Math.min(1, sharedEntities.length * 0.24 + sharedTopics.length * 0.1)
      if (weight <= 0) continue
      const source = `document:${left.id}`
      const target = `document:${right.id}`
      edges.push({
        id: edgeId(source, sharedEntities.length ? 'related-to' : 'shares-topic', target),
        source,
        target,
        type: sharedEntities.length ? 'related-to' : 'shares-topic',
        weight,
      })
    }
  }
  return { nodes, edges, builtAt: Date.now() }
}

export function getRelatedDocuments(
  graph: KnowledgeGraph,
  documentId: string,
  documents: IndexedDocument[],
): RelatedDocument[] {
  const sourceId = `document:${documentId}`
  const source = documents.find((document) => document.id === documentId)
  if (!source) return []
  const sourceEntities = normalizedSet(source.entities)
  const sourceTopics = normalizedSet(source.keywords.slice(0, 10))
  return graph.edges
    .filter((edge) => edge.type === 'related-to' || edge.type === 'shares-topic')
    .flatMap((edge) => {
      if (edge.source !== sourceId && edge.target !== sourceId) return []
      const relatedId = (edge.source === sourceId ? edge.target : edge.source).replace(/^document:/, '')
      const related = documents.find((document) => document.id === relatedId)
      if (!related) return []
      return [{
        documentId: related.id,
        score: edge.weight,
        sharedEntities: related.entities.filter((entity) => sourceEntities.has(entity.toLocaleLowerCase())),
        sharedTopics: related.keywords.filter((topic) => sourceTopics.has(topic.toLocaleLowerCase())),
        references: related.references.filter((reference) => source.references.includes(reference)),
      }]
    })
    .toSorted((left, right) => right.score - left.score)
}
