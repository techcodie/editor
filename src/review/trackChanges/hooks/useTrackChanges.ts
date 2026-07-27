import { useCallback, useEffect, useMemo, useState } from 'react'
import type { EditorApi } from '../../../lib/editor-api'
import type { CommentAuthor } from '../../types/comment'
import {
  createTrackChange,
  decideTrackChange,
  mergeTrackChange,
} from '../services/trackChangeRegistry'
import type {
  TrackChange,
  TrackChangeDecision,
} from '../types/trackChange'

const DEFAULT_AUTHOR: CommentAuthor = { id: 'current-user', name: 'You' }

export function useTrackChanges(
  api: EditorApi | null,
  currentAuthor: CommentAuthor = DEFAULT_AUTHOR,
) {
  const [changes, setChanges] = useState<TrackChange[]>([])

  useEffect(() => {
    if (!api) return
    return api.subscribeTrackChanges((draft) => {
      setChanges((current) => {
        const existing = current.find((change) => change.id === draft.id)
        if (!existing) return [createTrackChange(draft, currentAuthor), ...current]
        return current.map((change) =>
          change.id === draft.id ? mergeTrackChange(change, draft) : change,
        )
      })
    })
  }, [api, currentAuthor])

  const decide = useCallback(
    (changeId: string, decision: TrackChangeDecision): boolean => {
      if (!api?.resolveTrackChange(changeId, decision)) return false
      setChanges((current) =>
        current.map((change) =>
          change.id === changeId ? decideTrackChange(change, decision) : change,
        ),
      )
      return true
    },
    [api],
  )

  const decideAll = useCallback(
    (decision: TrackChangeDecision): number => {
      const decidedIds = new Set(
        changes
          .filter((change) => change.status === 'pending')
          .filter((change) => api?.resolveTrackChange(change.id, decision))
          .map((change) => change.id),
      )
      setChanges((current) =>
        current.map((change) =>
          decidedIds.has(change.id) ? decideTrackChange(change, decision) : change,
        ),
      )
      return decidedIds.size
    },
    [api, changes],
  )

  const jumpToChange = useCallback(
    (changeId: string) => {
      const change = changes.find((item) => item.id === changeId)
      return api?.focusTrackChange(changeId, change?.range) ?? false
    },
    [api, changes],
  )

  const changesById = useMemo(
    () => new Map(changes.map((change) => [change.id, change])),
    [changes],
  )

  return {
    changes,
    changesById,
    currentAuthor,
    decide,
    decideAll,
    jumpToChange,
  }
}
