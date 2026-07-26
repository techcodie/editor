import {
  useCallback,
  useEffect,
  useReducer,
  useState,
  useSyncExternalStore,
} from 'react'
import type { Comment } from '../types/comment'
import type { PendingComment } from '../types/review'
import type { EditorApi, EditorTextSelection } from '../../lib/editor-api'

const NOOP_SUBSCRIBE = () => () => {}
const NULL_SNAPSHOT = () => null

interface UseSelectionCommentOptions {
  api: EditorApi | null
  enabled: boolean
  keyboardShortcuts: boolean
  onCreate: (selection: EditorTextSelection, text: string) => Comment | null
  onCreated: (comment: Comment) => void
}

export function useSelectionComment({
  api,
  enabled,
  keyboardShortcuts,
  onCreate,
  onCreated,
}: UseSelectionCommentOptions) {
  useSyncExternalStore(
    api?.subscribe ?? NOOP_SUBSCRIBE,
    api?.getSnapshot ?? NULL_SNAPSHOT,
  )
  const [, refreshPosition] = useReducer((value) => value + 1, 0)
  const [pendingComment, setPendingComment] = useState<PendingComment | null>(null)
  const selection = enabled ? (api?.getTextSelection() ?? null) : null

  const openComposer = useCallback(() => {
    const currentSelection = api?.getTextSelection()
    if (!enabled || !currentSelection) return false
    setPendingComment({ selection: currentSelection })
    return true
  }, [api, enabled])

  const closeComposer = useCallback(() => {
    setPendingComment(null)
    window.requestAnimationFrame(() => api?.focus())
  }, [api])

  const saveComment = useCallback(
    (text: string) => {
      if (!pendingComment) return false
      const comment = onCreate(pendingComment.selection, text)
      if (!comment) return false
      setPendingComment(null)
      onCreated(comment)
      return true
    },
    [onCreate, onCreated, pendingComment],
  )

  useEffect(() => {
    if (!enabled) setPendingComment(null)
  }, [enabled])

  useEffect(() => {
    if (!selection && !pendingComment) return
    const refresh = () => refreshPosition()
    window.addEventListener('resize', refresh)
    window.addEventListener('scroll', refresh, true)
    return () => {
      window.removeEventListener('resize', refresh)
      window.removeEventListener('scroll', refresh, true)
    }
  }, [pendingComment, selection])

  useEffect(() => {
    if (!enabled || !keyboardShortcuts) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLocaleLowerCase() === 'm' &&
        (event.metaKey || event.ctrlKey) &&
        event.altKey
      ) {
        if (!api?.getTextSelection()) return
        event.preventDefault()
        openComposer()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [api, enabled, keyboardShortcuts, openComposer])

  return {
    selection,
    pendingComment,
    openComposer,
    closeComposer,
    saveComment,
  }
}
