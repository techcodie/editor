import type { KnowledgeSource } from '../knowledge/types/source'
import type { KnowledgeSourceEventData } from './types'

export function toKnowledgeSourceEventData(
  source: KnowledgeSource,
): KnowledgeSourceEventData {
  return {
    id: source.id,
    name: source.name,
    type: source.type,
    status: source.status,
    parseStatus: source.parseStatus,
    size: source.size,
    isActive: source.isActive,
    pageCount: source.pageCount,
    errorMessage: source.errorMessage,
  }
}
