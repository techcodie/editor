import type {
  EditorApi,
  EditorInsertionProvenance,
  EditorInsertionTarget,
  EditorTextSelection,
} from '../../lib/editor-api'
import {
  normalizeAssistantResponse,
  type StructuredEditorContent,
} from './structuredContent'

export interface AiResponseInsertion {
  responseId: string
  content: string
  sourceIds: string[]
}

export interface PreparedEditorInsertion {
  response: AiResponseInsertion
  content: StructuredEditorContent
  provenance: EditorInsertionProvenance
}

export interface EditorInsertionResult {
  success: boolean
  message: string
}

export async function prepareEditorInsertion(
  response: AiResponseInsertion,
): Promise<PreparedEditorInsertion | null> {
  let content: StructuredEditorContent | null
  try {
    content = await normalizeAssistantResponse(response.content)
  } catch {
    return null
  }
  if (!content) return null

  return {
    response,
    content,
    provenance: {
      responseId: response.responseId,
      sourceIds: [...new Set(response.sourceIds.filter(Boolean))],
      timestamp: Date.now(),
    },
  }
}

export function applyEditorInsertion(
  api: EditorApi | null,
  prepared: PreparedEditorInsertion,
  target: EditorInsertionTarget,
  selection?: EditorTextSelection,
): EditorInsertionResult {
  if (!api) {
    return {
      success: false,
      message: 'The editor is not available. Try again after it finishes loading.',
    }
  }
  if (target === 'selection' && !selection) {
    return {
      success: false,
      message: 'Select text in the editor before replacing it.',
    }
  }

  const success = api.insertStructuredContent({
    target,
    content: prepared.content.html,
    provenance: {
      ...prepared.provenance,
      timestamp: Date.now(),
    },
    selection,
  })
  if (!success) {
    return {
      success: false,
      message:
        target === 'selection'
          ? 'The editor selection changed. Select the text again and retry.'
          : 'The content could not be inserted. Place the cursor in the editor and retry.',
    }
  }

  const message =
    target === 'selection'
      ? 'Selection replaced'
      : target === 'end'
        ? 'Added to document end'
        : 'Inserted at cursor'
  return { success: true, message }
}
