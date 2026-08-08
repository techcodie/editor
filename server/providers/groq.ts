import { createOpenAiCompatibleProvider } from './shared.js'

// Kept as the alternate provider (AI_PROVIDER=groq) — Groq's endpoint is
// OpenAI-compatible, so this is a thin config wrapper around the same
// streaming implementation OpenAI uses, not a separate integration.
export const groqProvider = createOpenAiCompatibleProvider({
  label: 'Groq',
  apiKeyEnv: 'GROQ_API_KEY',
  apiUrlEnv: 'GROQ_API_URL',
  defaultApiUrl: 'https://api.groq.com/openai/v1/chat/completions',
  modelEnv: 'GROQ_MODEL',
  defaultModel: 'llama-3.1-8b-instant',
  timeoutEnv: 'GROQ_TIMEOUT_MS',
  defaultTimeoutMs: 30_000,
})
