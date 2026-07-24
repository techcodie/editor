import type {
  AskDocumentHistoryMessage,
  AskDocumentKnowledgeSource,
  AskDocumentRequest,
} from '../../../shared/ask-document'
import type { KnowledgeSource } from '../types/source'

export const LARGE_CONTEXT_CHARACTER_THRESHOLD = 60_000
export const LARGE_CONTEXT_WARNING =
  'This workspace contains a large amount of content. AI responses may be slower.'

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

export function buildAskDocumentRequest(
  context: KnowledgeContext,
  conversation: AskDocumentHistoryMessage[],
  userQuestion: string,
): AskDocumentRequest {
  return {
    currentDocument: context.currentDocument,
    activeKnowledgeSources: context.activeKnowledgeSources,
    conversation,
    userQuestion,
  }
}
