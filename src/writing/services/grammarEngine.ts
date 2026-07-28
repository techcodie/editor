import type { WritingSuggestion } from '../types/suggestion'
import { createSuggestion, sentences, words } from './textUtils'

const WORDY_PHRASES: Record<string, string> = {
  'at this point in time': 'now',
  'due to the fact that': 'because',
  'in order to': 'to',
  'in the event that': 'if',
  'has the ability to': 'can',
  'a large number of': 'many',
}

export function detectGrammarIssues(text: string): WritingSuggestion[] {
  const suggestions: WritingSuggestion[] = []

  for (const match of text.matchAll(/\b([A-Za-z]+)(\s+)\1\b/gi)) {
    const from = match.index ?? 0
    const first = match[1]
    suggestions.push(createSuggestion({
      category: 'repetition', title: 'Repeated word', originalText: match[0],
      suggestedText: first, reason: 'Remove the accidental repeated word.', severity: 'error',
      confidence: 0.99, range: { from, to: from + match[0].length },
    }))
  }

  for (const match of text.matchAll(/\b(a|an)\s+([A-Za-z]+)/gi)) {
    const article = match[1]
    const nextWord = match[2]
    const shouldUseAn = /^[aeiou]/i.test(nextWord)
    if ((article.toLocaleLowerCase() === 'an') === shouldUseAn) continue
    const replacement = shouldUseAn ? 'an' : 'a'
    const corrected = article[0] === article[0].toUpperCase()
      ? `${replacement[0].toUpperCase()}${replacement.slice(1)}`
      : replacement
    const from = match.index ?? 0
    suggestions.push(createSuggestion({
      category: 'grammar', title: 'Article agreement', originalText: article,
      suggestedText: corrected, reason: `Use “${replacement}” before “${nextWord}”.`, severity: 'error',
      confidence: 0.94, range: { from, to: from + article.length },
    }))
  }

  for (const match of text.matchAll(/\b(?:is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?\w+(?:ed|en)\b/gi)) {
    const from = match.index ?? 0
    suggestions.push(createSuggestion({
      category: 'passive-voice', title: 'Passive voice', originalText: match[0],
      suggestedText: match[0], reason: 'Consider naming the actor and using active voice for a more direct sentence.',
      severity: 'info', confidence: 0.72, range: { from, to: from + match[0].length },
    }))
  }

  for (const sentence of sentences(text)) {
    const sentenceWords = words(sentence.text)
    if (sentenceWords.length > 28) {
      suggestions.push(createSuggestion({
        category: 'long-sentence', title: 'Long sentence', originalText: sentence.text,
        suggestedText: sentence.text, reason: `This sentence has ${sentenceWords.length} words. Consider splitting it for easier reading.`,
        severity: sentenceWords.length > 40 ? 'warning' : 'info', confidence: 0.91,
        range: { from: sentence.from, to: sentence.to },
      }))
    }
    const firstLetter = sentence.text.search(/[A-Za-z]/)
    if (firstLetter >= 0 && sentence.text[firstLetter] === sentence.text[firstLetter].toLocaleLowerCase()) {
      const original = sentence.text[firstLetter]
      suggestions.push(createSuggestion({
        category: 'capitalization', title: 'Sentence capitalization', originalText: original,
        suggestedText: original.toLocaleUpperCase(), reason: 'Start the sentence with a capital letter.',
        severity: 'error', confidence: 0.97,
        range: { from: sentence.from + firstLetter, to: sentence.from + firstLetter + 1 },
      }))
    }
  }

  for (const [phrase, replacement] of Object.entries(WORDY_PHRASES)) {
    const pattern = new RegExp(`\\b${phrase.replaceAll(' ', '\\s+')}\\b`, 'gi')
    for (const match of text.matchAll(pattern)) {
      const from = match.index ?? 0
      suggestions.push(createSuggestion({
        category: 'wordiness', title: 'Wordy phrase', originalText: match[0],
        suggestedText: replacement, reason: `Use “${replacement}” for a more concise sentence.`,
        severity: 'info', confidence: 0.96, range: { from, to: from + match[0].length },
      }))
    }
  }

  for (const match of text.matchAll(/[ \t]+([,.;!?])/g)) {
    const from = match.index ?? 0
    suggestions.push(createSuggestion({
      category: 'punctuation', title: 'Space before punctuation', originalText: match[0],
      suggestedText: match[1], reason: 'Remove the space before punctuation.', severity: 'error',
      confidence: 0.99, range: { from, to: from + match[0].length },
    }))
  }

  for (const match of text.matchAll(/ {2,}/g)) {
    const from = match.index ?? 0
    suggestions.push(createSuggestion({
      category: 'formatting', title: 'Extra spacing', originalText: match[0],
      suggestedText: ' ', reason: 'Use a single space between words.', severity: 'info',
      confidence: 0.99, range: { from, to: from + match[0].length },
    }))
  }

  const pastSignals = (text.match(/\b(?:was|were|had|did|\w+ed)\b/gi) ?? []).length
  const presentSignals = (text.match(/\b(?:is|are|has|have|does|do)\b/gi) ?? []).length
  if (pastSignals >= 3 && presentSignals >= 3) {
    const candidate = text.match(/\b(?:is|are|has|have|does|do)\b/i)
    if (candidate?.index !== undefined) {
      suggestions.push(createSuggestion({
        category: 'tense', title: 'Check tense consistency', originalText: candidate[0],
        suggestedText: candidate[0], reason: 'The passage mixes several past and present tense signals. Confirm that each shift is intentional.',
        severity: 'info', confidence: 0.62,
        range: { from: candidate.index, to: candidate.index + candidate[0].length },
      }))
    }
  }

  return suggestions
}
