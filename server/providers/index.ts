import type { AiProvider, ChatMessage } from './shared.js'
import { openaiProvider } from './openai.js'
import { groqProvider } from './groq.js'

export type { AiProvider, ChatMessage }
export { ProviderError } from './shared.js'
export type { ProviderErrorKind } from './shared.js'

const PROVIDERS: Record<string, AiProvider> = {
  openai: openaiProvider,
  groq: groqProvider,
}

// OpenAI is the default provider. Set AI_PROVIDER=groq to use the Groq
// provider instead — both speak the same OpenAI-compatible chat-completions
// wire format (see shared.ts), so switching is a pure config change with no
// code path differences downstream of this module.
function getActiveProvider(): AiProvider {
  const requested = process.env.AI_PROVIDER?.trim().toLowerCase() || 'openai'
  return PROVIDERS[requested] ?? PROVIDERS.openai
}

export function getAiModel(): string {
  return getActiveProvider().getModel()
}

export function streamAiCompletion(messages: ChatMessage[], signal: AbortSignal): AsyncGenerator<string> {
  return getActiveProvider().streamCompletion(messages, signal)
}

/** Whether the active provider's API key is configured — used by /api/ready. */
export function isAiProviderConfigured(): boolean {
  const requested = process.env.AI_PROVIDER?.trim().toLowerCase() || 'openai'
  const apiKeyEnv = requested === 'groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY'
  return Boolean(process.env[apiKeyEnv]?.trim())
}
