import { cosineSimilarity } from './embeddingEngine'

export function semanticSearch(queryEmbedding: number[], documentEmbedding: number[]): number {
  return cosineSimilarity(queryEmbedding, documentEmbedding)
}
