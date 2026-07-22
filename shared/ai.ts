export type AiStreamEvent =
  | { type: 'delta'; content: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

export interface AiErrorResponse {
  error: string
}

export const SELECTION_AI_ACTIONS = [
  { id: 'improve-writing', label: 'Improve Writing' },
  { id: 'rewrite', label: 'Rewrite' },
  { id: 'simplify', label: 'Simplify' },
  { id: 'expand', label: 'Expand' },
  { id: 'shorten', label: 'Shorten' },
  { id: 'fix-grammar', label: 'Fix Grammar' },
  { id: 'translate', label: 'Translate' },
  { id: 'explain', label: 'Explain' },
] as const

export type SelectionAiAction = (typeof SELECTION_AI_ACTIONS)[number]['id']

export interface SelectionAiRequest {
  selection: string
  action: SelectionAiAction
  document?: string
}

export function isSelectionAiAction(value: unknown): value is SelectionAiAction {
  return SELECTION_AI_ACTIONS.some((action) => action.id === value)
}
