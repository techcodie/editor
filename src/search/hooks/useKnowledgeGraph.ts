import { useMemo } from 'react'
import type { KnowledgeGraph } from '../types/knowledgeGraph'

export function useKnowledgeGraph(graph: KnowledgeGraph, selectedDocumentId?: string) {
  return useMemo(() => {
    const selectedNodeId = selectedDocumentId ? `document:${selectedDocumentId}` : null
    const connectedIds = new Set<string>()
    if (selectedNodeId) {
      connectedIds.add(selectedNodeId)
      for (const edge of graph.edges) {
        if (edge.source === selectedNodeId) connectedIds.add(edge.target)
        if (edge.target === selectedNodeId) connectedIds.add(edge.source)
      }
    }
    return {
      graph,
      visibleNodes: selectedNodeId
        ? graph.nodes.filter((node) => connectedIds.has(node.id))
        : graph.nodes,
      visibleEdges: selectedNodeId
        ? graph.edges.filter((edge) => connectedIds.has(edge.source) && connectedIds.has(edge.target))
        : graph.edges,
      documentCount: graph.nodes.filter((node) => node.type === 'document' || node.type === 'knowledge-source').length,
      entityCount: graph.nodes.filter((node) => node.type === 'entity').length,
      relationshipCount: graph.edges.filter((edge) => edge.type === 'related-to' || edge.type === 'shares-topic').length,
    }
  }, [graph, selectedDocumentId])
}
