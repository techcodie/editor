import type { WritingRewriteAction } from '../types/writing'
import { replaceFirstInsensitive } from './textUtils'
import type { WritingRewriteRequest } from '../../../shared/writing'
import { AiStreamError, streamAiRequest } from '../../services/ai-stream'

const CLARITY_REPLACEMENTS: Array<[string, string]> = [
  ['due to the fact that', 'because'],
  ['in order to', 'to'],
  ['at this point in time', 'now'],
  ['has the ability to', 'can'],
  ['a large number of', 'many'],
]

function normalize(text: string): string {
  return text.replace(/[ \t]+/g, ' ').replace(/\s+([,.;!?])/g, '$1').trim()
}

function improveClarity(text: string): string {
  let next = normalize(text)
  for (const [original, replacement] of CLARITY_REPLACEMENTS) {
    while (next.toLocaleLowerCase().includes(original)) {
      next = replaceFirstInsensitive(next, original, replacement)
    }
  }
  return next
}

export function createLocalRewrite(text: string, action: WritingRewriteAction): string {
  const clear = improveClarity(text)
  switch (action) {
    case 'improve-clarity':
      return clear
    case 'shorten':
      return clear
        .replace(/\b(?:very|really|quite|basically|actually|generally)\b\s*/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
    case 'simplify':
      return clear
        .replace(/\butilize\b/gi, 'use')
        .replace(/\bcommence\b/gi, 'start')
        .replace(/\bapproximately\b/gi, 'about')
        .replace(/\bsubsequently\b/gi, 'later')
    case 'professional':
      return clear.replace(/\bstuff\b/gi, 'details').replace(/\bthings\b/gi, 'items')
    case 'friendly':
      return clear.replace(/\bcannot\b/gi, "can't").replace(/\bdo not\b/gi, "don't").replace(/\bwill not\b/gi, "won't")
    case 'formal':
      return clear.replace(/\bcan't\b/gi, 'cannot').replace(/\bwon't\b/gi, 'will not')
    case 'expand':
      return clear
  }
}

export { AiStreamError as WritingRewriteError }

export async function requestWritingRewrite(
  request: WritingRewriteRequest,
  signal: AbortSignal,
  endpoint = '/api/writing-assistant',
): Promise<string> {
  let content = ''
  await streamAiRequest(endpoint, request, {
    network: 'Unable to reach the writing assistant. A local rewrite remains available.',
    unavailable: 'The writing assistant is temporarily unavailable. A local rewrite remains available.',
    invalid: 'The writing assistant returned an invalid response.',
    empty: 'The writing assistant returned an empty response.',
  }, (delta) => { content += delta }, signal)
  return content.trim()
}
