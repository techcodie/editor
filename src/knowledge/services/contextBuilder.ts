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
  usedSourceNames: string[]
  totalCharacters: number
  isLarge: boolean
}

export function buildKnowledgeContext(
  currentDocument: string,
  sources: KnowledgeSource[],
): KnowledgeContext {
  const activeKnowledgeSources = sources.flatMap<AskDocumentKnowledgeSource>((source) => {
    if (
      source.status !== 'uploaded' ||
      !source.isActive ||
      source.parseStatus !== 'ready'
    ) {
      return []
    }

    const content = source.parsedContent?.trim()
    return content ? [{ name: source.name, content }] : []
  })
  const totalCharacters =
    currentDocument.length +
    activeKnowledgeSources.reduce((total, source) => total + source.content.length, 0)

  return {
    currentDocument,
    activeKnowledgeSources,
    usedSourceNames: ['Current Document', ...activeKnowledgeSources.map((source) => source.name)],
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
