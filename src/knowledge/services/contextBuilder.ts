import type {
  AskDocumentHistoryMessage,
  AskDocumentKnowledgeSource,
  AskDocumentRequest,
} from '../../../shared/ask-document'
import { chunkDocumentText, selectRelevantChunks } from './documentChunker'
import type { KnowledgeSource } from '../types/source'

export const LARGE_CONTEXT_CHARACTER_THRESHOLD = 60_000
export const LARGE_CONTEXT_WARNING =
  'This workspace contains a large amount of content. AI responses may be slower.'

// Below this, the current document is sent to the AI in full, exactly as
// before — this only changes behavior once a document is large enough to be
// at real risk of the server's request-size ceiling (server/ask-document.ts's
// MAX_DOCUMENT_CHARS), so the already-verified small/medium-document path is
// untouched.
const RETRIEVAL_CHARACTER_THRESHOLD = 40_000
const MAX_RETRIEVED_CONTEXT_CHARACTERS = 36_000

export interface KnowledgeContext {
  currentDocument: string
  activeKnowledgeSources: AskDocumentKnowledgeSource[]
  totalCharacters: number
  isLarge: boolean
}

export function buildKnowledgeContext(
  currentDocument: string,
  workspaceSources: KnowledgeSource[],
  temporarySources: KnowledgeSource[] = [],
): KnowledgeContext {
  const seenSourceIds = new Set<string>()
  const collectSources = (
    sources: KnowledgeSource[],
    requireActive: boolean,
  ): AskDocumentKnowledgeSource[] =>
    sources.flatMap<AskDocumentKnowledgeSource>((source) => {
      if (
        seenSourceIds.has(source.id) ||
        source.status !== 'uploaded' ||
        (requireActive && !source.isActive) ||
        source.parseStatus !== 'ready'
      ) {
        return []
      }

      const content = source.parsedContent?.trim()
      if (!content) return []

      seenSourceIds.add(source.id)
      return [
        {
          id: source.id,
          name: source.name,
          type: source.type,
          pageCount: source.pageCount,
          content,
        },
      ]
    })

  const activeKnowledgeSources = [
    ...collectSources(temporarySources, false),
    ...collectSources(workspaceSources, true),
  ]
  const totalCharacters =
    currentDocument.length +
    activeKnowledgeSources.reduce((total, source) => total + source.content.length, 0)

  return {
    currentDocument,
    activeKnowledgeSources,
    totalCharacters,
    isLarge: totalCharacters > LARGE_CONTEXT_CHARACTER_THRESHOLD,
  }
}

/**
 * Large documents used to be forwarded to the AI endpoint in full and could
 * hit the server's hard request-size ceiling outright (413). Past the
 * threshold, this retrieves only the most relevant chunks of the current
 * document for the question being asked instead — using the SDK's existing
 * local (dependency-free, no embeddings API) similarity search, not a real
 * hosted RAG/vector-database pipeline, which stays out of scope. Below the
 * threshold this is behaviorally identical to before: the full document.
 */
export async function buildAskDocumentRequest(
  context: KnowledgeContext,
  conversation: AskDocumentHistoryMessage[],
  userQuestion: string,
): Promise<AskDocumentRequest> {
  let currentDocument = context.currentDocument
  if (currentDocument.length > RETRIEVAL_CHARACTER_THRESHOLD) {
    const chunks = chunkDocumentText(currentDocument)
    const relevant = await selectRelevantChunks(chunks, userQuestion, MAX_RETRIEVED_CONTEXT_CHARACTERS)
    if (relevant.length > 0) {
      currentDocument =
        `[The current document is long — showing the ${relevant.length} most relevant excerpt(s) out of ${chunks.length} for this question, not the full text.]\n\n` +
        relevant.map((chunk) => chunk.text).join('\n\n---\n\n')
    }
  }
  return {
    currentDocument,
    activeKnowledgeSources: context.activeKnowledgeSources,
    conversation,
    userQuestion,
  }
}
