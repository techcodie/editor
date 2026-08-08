import type { Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  Columns3,
  Combine,
  Rows3,
  Table2,
  Trash2,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import type { EditorApi } from '../../lib/editor-api'
import { Tooltip } from '../ui/Tooltip'

export interface TableBubbleMenuProps {
  editor: Editor | null
  api: EditorApi | null
}

const BUTTON_CLASS =
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-500 ' +
  'transition-[background-color,color,transform] duration-150 ' +
  'hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.94] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]'

// Hoisted so its identity is stable across renders — BubbleMenu re-registers
// its ProseMirror plugin whenever `options`/`shouldShow` change reference,
// and each registration itself dispatches a transaction; passing a fresh
// object/function literal every render caused an infinite
// render -> reconfigure -> transaction -> render loop ("Maximum update
// depth exceeded").
const BUBBLE_MENU_OPTIONS = { placement: 'top', offset: 8 } as const

function shouldShowTableBubbleMenu({ editor }: { editor: Editor }) {
  return editor.isActive('table')
}

function BubbleButton({
  icon: Icon,
  label,
  danger,
  onClick,
}: {
  icon: typeof Table2
  label: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <Tooltip content={label} sideOffset={8}>
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={cn(BUTTON_CLASS, danger && 'hover:bg-red-50 hover:text-red-600')}
      >
        <Icon size={14} strokeWidth={1.9} aria-hidden />
      </button>
    </Tooltip>
  )
}

/**
 * Floating contextual toolbar shown whenever the cursor is inside a table —
 * the fast path for the same commands already exhaustively listed in
 * TableToolbarControl's in-table dropdown, matching the Word/Docs/Jodit
 * convention of a table-editing toolbar appearing right where you're
 * working instead of requiring a trip back to the ribbon. Positioning uses
 * Tiptap's BubbleMenu (`@tiptap/react/menus`, part of the already-installed
 * `@tiptap/react` package — not a new dependency), which needs the raw
 * editor instance to anchor itself; every button click still only calls
 * EditorApi methods, never `editor.chain()` directly, so the "EditorApi is
 * the only layer allowed to mutate the document" rule still holds — only
 * BubbleMenu's own positioning touches the raw editor, which Tiptap
 * requires.
 */
export function TableBubbleMenu({ editor, api }: TableBubbleMenuProps) {
  if (!editor) return null

  return (
    <BubbleMenu
      editor={editor}
      options={BUBBLE_MENU_OPTIONS}
      shouldShow={shouldShowTableBubbleMenu}
      className="flex items-center gap-0.5 rounded-lg border border-neutral-200/80 bg-white p-1 shadow-[var(--document-editor-shadow-raised)]"
    >
      <BubbleButton icon={ArrowUpToLine} label="Insert row above" onClick={() => api?.addRowBefore()} />
      <BubbleButton icon={ArrowDownToLine} label="Insert row below" onClick={() => api?.addRowAfter()} />
      <BubbleButton icon={ArrowLeftToLine} label="Insert column left" onClick={() => api?.addColumnBefore()} />
      <BubbleButton icon={ArrowRightToLine} label="Insert column right" onClick={() => api?.addColumnAfter()} />
      <div className="mx-0.5 h-5 w-px bg-neutral-200" aria-hidden />
      <BubbleButton icon={Combine} label="Merge / split cells" onClick={() => api?.mergeOrSplitCell()} />
      <BubbleButton icon={Rows3} label="Toggle header row" onClick={() => api?.toggleHeaderRow()} />
      <div className="mx-0.5 h-5 w-px bg-neutral-200" aria-hidden />
      <BubbleButton icon={Rows3} label="Delete row" danger onClick={() => api?.deleteRow()} />
      <BubbleButton icon={Columns3} label="Delete column" danger onClick={() => api?.deleteColumn()} />
      <BubbleButton icon={Trash2} label="Delete table" danger onClick={() => api?.deleteTable()} />
    </BubbleMenu>
  )
}
