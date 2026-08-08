import { createOpenAiCompatibleProvider } from './shared.js'

// gpt-4o-mini is the default: cheapest of the three officially supported
// models (gpt-4.1, gpt-4o, gpt-4o-mini), matching Groq's own previous
// default of the smallest/fastest model for this SDK's demo workflows. Hosts
// running production traffic can set OPENAI_MODEL to gpt-4.1 or gpt-4o.
export const openaiProvider = createOpenAiCompatibleProvider({
  label: 'OpenAI',
  apiKeyEnv: 'OPENAI_API_KEY',
  apiUrlEnv: 'OPENAI_API_URL',
  defaultApiUrl: 'https://api.openai.com/v1/chat/completions',
  modelEnv: 'OPENAI_MODEL',
  defaultModel: 'gpt-4o-mini',
  timeoutEnv: 'OPENAI_TIMEOUT_MS',
  defaultTimeoutMs: 30_000,
})
