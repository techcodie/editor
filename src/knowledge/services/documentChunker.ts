import { createLocalEmbeddingProvider, cosineSimilarity } from '../../search/services/embeddingEngine'

export interface DocumentChunk {
  index: number
  heading: string | null
  text: string
}

const HEADING_PATTERN = /^#{1,6}\s+(.+)$/

/**
 * Splits `getDocumentText()`'s output (see create-editor-api.ts's
 * `getText({ textSerializers: { heading: ... } })`, which already prefixes
 * headings with markdown-style `#`) into heading- and paragraph-aware
 * chunks capped around `targetChunkSize` characters, merging short
 * consecutive paragraphs so a chunk is a coherent excerpt rather than one
 * sentence.
 */
export function chunkDocumentText(text: string, targetChunkSize = 1200): DocumentChunk[] {
  const lines = text.split('\n')
  const chunks: DocumentChunk[] = []
  let currentHeading: string | null = null
  let buffer: string[] = []
  let bufferSize = 0

  const flush = () => {
    const content = buffer.join('\n').trim()
    if (content) chunks.push({ index: chunks.length, heading: currentHeading, text: content })
    buffer = []
    bufferSize = 0
  }

  for (const line of lines) {
    const headingMatch = HEADING_PATTERN.exec(line)
    if (headingMatch) {
      flush()
      currentHeading = headingMatch[1].trim()
      buffer.push(line)
      bufferSize += line.length
      continue
    }
    if (bufferSize > 0 && bufferSize + line.length > targetChunkSize && line.trim() === '') {
      flush()
      continue
    }
    buffer.push(line)
    bufferSize += line.length + 1
  }
  flush()

  return chunks
}

const embeddingProvider = createLocalEmbeddingProvider()

// In-memory only (never persisted — consistent with the SDK's no-persistence
// boundary) so re-asking questions about the same open document within a
// session doesn't re-embed identical chunk text every time. Capped so a long
// session with many different large documents can't grow this unbounded.
const MAX_CACHE_ENTRIES = 500
const embeddingCache = new Map<string, number[]>()

async function embedCached(text: string): Promise<number[]> {
  const existing = embeddingCache.get(text)
  if (existing) return existing
  const vector = await embeddingProvider.embed(text)
  if (embeddingCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = embeddingCache.keys().next().value
    if (oldestKey !== undefined) embeddingCache.delete(oldestKey)
  }
  embeddingCache.set(text, vector)
  return vector
}

/**
 * Scores chunks against `query` using the app's existing local (not a paid
 * embeddings API — see embeddingEngine.ts) hashed bag-of-words similarity,
 * and returns the top chunks up to `maxCharacters`, restored to their
 * original document order for readability.
 */
export async function selectRelevantChunks(
  chunks: DocumentChunk[],
  query: string,
  maxCharacters: number,
): Promise<DocumentChunk[]> {
  if (chunks.length === 0) return []
  const queryVector = await embeddingProvider.embed(query)
  const scored = await Promise.all(
    chunks.map(async (chunk) => ({
      chunk,
      score: cosineSimilarity(queryVector, await embedCached(chunk.text)),
    })),
  )
  scored.sort((a, b) => b.score - a.score)

  const selected: DocumentChunk[] = []
  let usedCharacters = 0
  for (const { chunk } of scored) {
    if (usedCharacters >= maxCharacters) break
    selected.push(chunk)
    usedCharacters += chunk.text.length
  }
  return selected.sort((a, b) => a.index - b.index)
}
