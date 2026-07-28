import type { EmbeddingProvider } from '../types/search'

export const SEARCH_TOKEN_PATTERN = /[\p{L}\p{N}][\p{L}\p{N}'-]*/gu

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'in',
  'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'were',
  'will', 'with',
])

export function tokenizeSearchText(value: string): string[] {
  return (value.toLocaleLowerCase().match(SEARCH_TOKEN_PATTERN) ?? [])
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
}

function hashToken(token: string): number {
  let hash = 2_166_136_261
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }
  return hash >>> 0
}

function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((total, value) => total + value * value, 0))
  return magnitude > 0 ? vector.map((value) => value / magnitude) : vector
}

export function createLocalEmbeddingProvider(dimensions = 128): EmbeddingProvider {
  const safeDimensions = Math.max(32, Math.min(512, Math.floor(dimensions)))
  const embed = async (text: string, signal?: AbortSignal) => {
    if (signal?.aborted) throw new DOMException('Embedding cancelled.', 'AbortError')
    const vector = Array<number>(safeDimensions).fill(0)
    const tokens = tokenizeSearchText(text)
    const counts = new Map<string, number>()
    for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1)
    for (const [token, count] of counts) {
      const hash = hashToken(token)
      const index = hash % safeDimensions
      const sign = (hash & 0x80000000) === 0 ? 1 : -1
      vector[index] += sign * (1 + Math.log(count))
    }
    return normalize(vector)
  }
  return {
    id: `local-feature-hash-${safeDimensions}`,
    dimensions: safeDimensions,
    embed,
    async embedMany(texts, signal) {
      const vectors: number[][] = []
      for (let index = 0; index < texts.length; index += 1) {
        if (signal?.aborted) throw new DOMException('Embedding cancelled.', 'AbortError')
        vectors.push(await embed(texts[index], signal))
        if (index % 8 === 7) await new Promise<void>((resolve) => setTimeout(resolve, 0))
      }
      return vectors
    },
  }
}

export function cosineSimilarity(left: number[], right: number[]): number {
  const length = Math.min(left.length, right.length)
  let score = 0
  for (let index = 0; index < length; index += 1) score += left[index] * right[index]
  return Math.max(0, Math.min(1, score))
}
