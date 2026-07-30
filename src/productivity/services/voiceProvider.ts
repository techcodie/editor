import type { VoiceProvider } from '../types/provider'

export function isVoiceProvider(value: unknown): value is VoiceProvider {
  return Boolean(
    value && typeof value === 'object' &&
    (value as VoiceProvider).kind === 'voice' &&
    typeof (value as VoiceProvider).createSession === 'function',
  )
}
