import { useEffect, useState } from 'react'
import { detectGrammarIssues } from '../services/grammarEngine'
import { detectSpellingIssues } from '../services/spellingEngine'
import { mergeSuggestions } from '../services/suggestionEngine'
import type { WritingSuggestion } from '../types/suggestion'

export function useGrammar(text: string, active = true, debounceMs = 350) {
  const [suggestions, setSuggestions] = useState<WritingSuggestion[]>([])
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    if (!active) return
    setIsChecking(true)
    const timeout = window.setTimeout(() => {
      setSuggestions(mergeSuggestions(detectGrammarIssues(text), detectSpellingIssues(text)))
      setIsChecking(false)
    }, debounceMs)
    return () => window.clearTimeout(timeout)
  }, [active, debounceMs, text])

  return { suggestions, isChecking }
}
