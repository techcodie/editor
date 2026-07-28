import type { ToneAnalysis, WritingTone } from '../types/writing'
import { words } from './textUtils'

const SIGNALS: Record<Exclude<WritingTone, 'neutral'>, Set<string>> = {
  professional: new Set(['analysis', 'recommend', 'require', 'review', 'objective', 'result', 'ensure']),
  formal: new Set(['hereby', 'therefore', 'pursuant', 'shall', 'whereas', 'accordingly']),
  friendly: new Set(['glad', 'happy', 'help', 'please', 'thanks', 'welcome', 'together']),
  confident: new Set(['clearly', 'will', 'must', 'proven', 'certain', 'decisive', 'strong']),
}

export function analyzeTone(text: string): ToneAnalysis {
  const tokens = words(text).map((word) => word.toLocaleLowerCase())
  const scored = Object.entries(SIGNALS).map(([tone, signals]) => ({
    tone: tone as Exclude<WritingTone, 'neutral'>,
    matches: tokens.filter((word) => signals.has(word)),
  })).toSorted((left, right) => right.matches.length - left.matches.length)
  const winner = scored[0]
  if (!winner || winner.matches.length === 0) {
    return { primary: 'neutral', confidence: 0.64, signals: ['Balanced language'] }
  }
  return {
    primary: winner.tone,
    confidence: Math.min(0.95, 0.58 + winner.matches.length / Math.max(8, tokens.length)),
    signals: [...new Set(winner.matches)].slice(0, 3).map((word) => `Uses “${word}”`),
  }
}
