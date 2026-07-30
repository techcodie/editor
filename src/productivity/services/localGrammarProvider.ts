import { analyzeWriting } from '../../writing/services/writingAnalysis'
import type { GrammarProvider } from '../types/provider'

export class LocalGrammarProvider implements GrammarProvider {
  readonly id = 'local-grammar'
  readonly name = 'Local Writing Engine'
  readonly kind = 'grammar' as const
  readonly local = true
  readonly requiresApiKey = false

  isAvailable(): boolean {
    return true
  }

  analyze: GrammarProvider['analyze'] = (text, options) => analyzeWriting(text, options)
}
