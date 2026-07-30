import type { GrammarProvider } from '../types/provider'

export function isGrammarProvider(value: unknown): value is GrammarProvider {
  return Boolean(
    value && typeof value === 'object' &&
    (value as GrammarProvider).kind === 'grammar' &&
    typeof (value as GrammarProvider).analyze === 'function',
  )
}
