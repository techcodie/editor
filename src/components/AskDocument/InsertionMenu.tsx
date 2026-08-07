import { ListEnd, ListPlus, Replace, TextCursorInput } from 'lucide-react'
import { useRef } from 'react'
import type { KeyboardEvent } from 'react'

interface InsertionMenuProps {
  canInsert: boolean
  canReplaceSelection: boolean
  onInsertAtCursor: () => void
  onReplaceSelection: () => void
  onAppendToEnd: () => void
}

export function InsertionMenu({
  canInsert,
  canReplaceSelection,
  onInsertAtCursor,
  onReplaceSelection,
  onAppendToEnd,
}: InsertionMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const summaryRef = useRef<HTMLElement>(null)

  const runAction = (action: () => void) => {
    detailsRef.current?.removeAttribute('open')
    action()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDetailsElement>) => {
    if (event.key === 'Escape' && detailsRef.current?.open) {
      event.preventDefault()
      detailsRef.current.removeAttribute('open')
      summaryRef.current?.focus()
    }
  }

  const optionClassName =
    'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[10px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent'

  if (!canInsert) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-[9px] font-medium text-neutral-300"
      >
        <ListPlus size={10} strokeWidth={2} aria-hidden />
        Insert
      </button>
    )
  }

  return (
    <details ref={detailsRef} className="relative" onKeyDown={handleKeyDown}>
      <summary
        ref={summaryRef}
        role="button"
        aria-label="Insert response into editor"
        className="inline-flex h-7 cursor-pointer list-none items-center gap-1 rounded-md px-1.5 text-[9px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] [&::-webkit-details-marker]:hidden"
      >
        <ListPlus size={10} strokeWidth={2} aria-hidden />
        Insert
      </summary>
      <div
        role="group"
        aria-label="Insertion targets"
        className="absolute bottom-8 left-0 z-20 w-44 rounded-md border border-neutral-200 bg-white p-1 shadow-[0_12px_35px_-14px_rgba(20,20,20,0.38)]"
      >
        <button
          type="button"
          onClick={() => runAction(onInsertAtCursor)}
          className={optionClassName}
        >
          <TextCursorInput size={12} strokeWidth={1.9} aria-hidden />
          Insert at Cursor
        </button>
        <button
          type="button"
          disabled={!canReplaceSelection}
          onClick={() => runAction(onReplaceSelection)}
          title={
            canReplaceSelection
              ? 'Review and replace the editor selection'
              : 'Select text in the editor to enable replacement'
          }
          className={optionClassName}
        >
          <Replace size={12} strokeWidth={1.9} aria-hidden />
          Replace Selection
        </button>
        <button
          type="button"
          onClick={() => runAction(onAppendToEnd)}
          className={optionClassName}
        >
          <ListEnd size={12} strokeWidth={1.9} aria-hidden />
          Append to End
        </button>
      </div>
    </details>
  )
}
