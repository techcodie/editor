import { useEffect, useReducer, useSyncExternalStore } from 'react'
import type { EditorApi } from '../../lib/editor-api'
import { SelectionPreview } from './SelectionPreview'
import { SelectionToolbar } from './SelectionToolbar'
import { useSelectionAi } from './useSelectionAi'

interface SelectionAiProps {
  api: EditorApi | null
}

const NOOP_SUBSCRIBE = () => () => {}
const NULL_SNAPSHOT = () => null

export function SelectionAi({ api }: SelectionAiProps) {
  useSyncExternalStore(api?.subscribe ?? NOOP_SUBSCRIBE, api?.getSnapshot ?? NULL_SNAPSHOT)
  const [, refreshPosition] = useReducer((value) => value + 1, 0)
  const { operation, runAction, tryAgain, cancel, replaceSelection } = useSelectionAi(api)
  const selection = api?.getTextSelection() ?? null
  const operationBounds =
    operation &&
    selection?.from === operation.selection.from &&
    selection.to === operation.selection.to
      ? selection.bounds
      : operation?.selection.bounds
  const activeBounds = operationBounds ?? selection?.bounds
  const isVisible = Boolean(activeBounds)

  useEffect(() => {
    if (!isVisible) return

    const refresh = () => refreshPosition()
    window.addEventListener('resize', refresh)
    window.addEventListener('scroll', refresh, true)
    return () => {
      window.removeEventListener('resize', refresh)
      window.removeEventListener('scroll', refresh, true)
    }
  }, [isVisible])

  useEffect(() => {
    if (!operation) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cancel, operation])

  if (operation && activeBounds) {
    return (
      <SelectionPreview
        operation={operation}
        bounds={activeBounds}
        onCancel={cancel}
        onReplace={replaceSelection}
        onTryAgain={tryAgain}
      />
    )
  }

  if (!selection) return null

  return <SelectionToolbar bounds={selection.bounds} onSelect={(action) => void runAction(action)} />
}
