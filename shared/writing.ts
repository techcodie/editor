export const WRITING_REWRITE_ACTIONS = [
  { id: 'improve-clarity', label: 'Improve Clarity' },
  { id: 'shorten', label: 'Shorten Text' },
  { id: 'expand', label: 'Expand Text' },
  { id: 'professional', label: 'Professional Tone' },
  { id: 'friendly', label: 'Friendly Tone' },
  { id: 'formal', label: 'Formal Tone' },
  { id: 'simplify', label: 'Simplify Language' },
] as const

export type WritingRewriteAction = (typeof WRITING_REWRITE_ACTIONS)[number]['id']

export interface WritingRewriteRequest {
  text: string
  action: WritingRewriteAction
  document?: string
}

export function isWritingRewriteAction(value: unknown): value is WritingRewriteAction {
  return WRITING_REWRITE_ACTIONS.some((action) => action.id === value)
}
