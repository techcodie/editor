import { useCallback, useEffect, useState } from 'react'
import type { EditorApi } from '../../lib/editor-api'
import { parseTranscriptSpeakers } from '../services/speakerEngine'
import type { SpeakerSegment } from '../types/productivity'

export function useSpeakerManager(api: EditorApi | null) {
  const [version, setVersion] = useState(0)

  useEffect(() => api?.subscribe(() => setVersion((current) => current + 1)), [api])
  const parsed = parseTranscriptSpeakers(api?.getDocumentText() ?? '')
  void version

  const rename = useCallback((currentName: string, nextName: string, globally: boolean) => {
    if (!api || !nextName.trim()) return false
    if (globally) return api.replaceTextOccurrences(`${currentName}:`, `${nextName.trim()}:`) > 0
    const segment = parsed.segments.find((item) => item.speakerName === currentName)
    if (!segment) return false
    const selection = api.findTextSelection(segment.rawText)
    return selection
      ? api.replaceTextSelection(selection, `${nextName.trim()}: ${segment.text}`)
      : false
  }, [api, parsed.segments])

  const merge = useCallback((sourceName: string, targetName: string) => {
    if (!api || sourceName === targetName) return false
    return api.replaceTextOccurrences(`${sourceName}:`, `${targetName}:`) > 0
  }, [api])

  const split = useCallback((segment: SpeakerSegment, nextName: string) => {
    if (!api || !nextName.trim()) return false
    const selection = api.findTextSelection(segment.rawText)
    return selection
      ? api.replaceTextSelection(selection, `${nextName.trim()}: ${segment.text}`)
      : false
  }, [api])

  const navigate = useCallback((segment: SpeakerSegment) => {
    if (!api) return false
    const selection = api.findTextSelection(segment.rawText)
    return selection ? api.focusTextSelection(selection) : false
  }, [api])

  return { ...parsed, rename, merge, split, navigate }
}
