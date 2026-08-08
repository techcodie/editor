import { useState } from 'react'
import {
  Columns3,
  Table2,
  Rows3,
  Trash2,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  ArrowDownToLine,
  Combine,
} from 'lucide-react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import { cn } from '../../lib/cn'
import type { EditorApi } from '../../lib/editor-api'
import { Dialog } from '../ui/Dialog'
import { Input } from '../ui/Input'
import { ToolbarDropdown } from './ToolbarDropdown'
import type { ToolbarButtonSize } from './ToolbarButton'

export interface TableToolbarControlProps {
  api: EditorApi | null
  size?: ToolbarButtonSize
}

const SIZE: Record<ToolbarButtonSize, { button: string; icon: number }> = {
  sm: { button: 'h-7 w-7', icon: 15 },
  md: { button: 'h-8 w-8', icon: 16 },
}

const TRIGGER_CLASS =
  'inline-flex shrink-0 items-center justify-center rounded-md text-neutral-500 ' +
  'transition-[background-color,color,box-shadow,transform] duration-150 ' +
  'hover:bg-neutral-100 hover:text-neutral-950 ' +
  'active:scale-[0.96] active:bg-neutral-200/70 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] ' +
  'focus-visible:ring-offset-1 focus-visible:ring-offset-white ' +
  'disabled:pointer-events-none disabled:opacity-35 ' +
  'data-[state=open]:bg-neutral-900 data-[state=open]:text-white'

const CONTENT_CLASS =
  'z-50 w-fit overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-3 ' +
  'shadow-[var(--document-editor-shadow-raised)] [animation:toolbar-tooltip-in_120ms_ease-out]'

const GRID_MAX_ROWS = 10
const GRID_MAX_COLS = 10

/** Jodit-style hover grid: hovering highlights up to that many rows/columns, click inserts them. */
function TableGridPicker({ onInsert }: { onInsert: (rows: number, columns: number) => void }) {
  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null)

  return (
    <div>
      <p className="mb-2 text-center text-[11px] font-medium text-neutral-600">
        {hovered ? `${hovered.row} × ${hovered.col}` : 'Insert table'}
      </p>
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${GRID_MAX_COLS}, 1.1rem)` }}
        onMouseLeave={() => setHovered(null)}
      >
        {Array.from({ length: GRID_MAX_ROWS * GRID_MAX_COLS }, (_, index) => {
          const row = Math.floor(index / GRID_MAX_COLS) + 1
          const col = (index % GRID_MAX_COLS) + 1
          const active = Boolean(hovered && row <= hovered.row && col <= hovered.col)
          return (
            <button
              key={index}
              type="button"
              aria-label={`Insert ${row} by ${col} table`}
              onMouseEnter={() => setHovered({ row, col })}
              onClick={() => onInsert(row, col)}
              className={cn(
                'h-[1.1rem] w-[1.1rem] rounded-[3px] border transition-colors',
                active ? 'border-indigo-500 bg-indigo-500/80' : 'border-neutral-200 bg-neutral-50',
              )}
            />
          )
        })}
      </div>
    </div>
  )
}

function TableCustomSizeDialog({
  isOpen,
  onClose,
  onInsert,
}: {
  isOpen: boolean
  onClose: () => void
  onInsert: (rows: number, columns: number) => void
}) {
  const [rows, setRows] = useState('3')
  const [columns, setColumns] = useState('3')

  const submit = () => {
    const parsedRows = Math.min(GRID_MAX_ROWS, Math.max(1, Math.round(Number(rows)) || 1))
    const parsedColumns = Math.min(GRID_MAX_COLS, Math.max(1, Math.round(Number(columns)) || 1))
    onInsert(parsedRows, parsedColumns)
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Custom table size" maxWidthClassName="max-w-xs">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] font-medium text-neutral-600">Rows</span>
          <Input
            type="number"
            min={1}
            max={GRID_MAX_ROWS}
            value={rows}
            onChange={(event) => setRows(event.target.value)}
            containerClassName="mt-1"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-medium text-neutral-600">Columns</span>
          <Input
            type="number"
            min={1}
            max={GRID_MAX_COLS}
            value={columns}
            onChange={(event) => setColumns(event.target.value)}
            containerClassName="mt-1"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={submit}
        className="mt-4 flex h-9 w-full items-center justify-center rounded-md bg-neutral-900 text-[11px] font-semibold text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
      >
        Insert
      </button>
    </Dialog>
  )
}

/**
 * The one "Table" entry point. Outside a table this shows a Jodit-style
 * hover grid (click inserts that R×C size directly — EditorApi.insertTable
 * already accepted dimensions, just went uncalled with any) plus a "Custom
 * size…" fallback dialog for keyboard/accessibility use. Once the caret is
 * inside a table, the same trigger switches to the full row/column/header/
 * merge management list, right where those commands become actionable —
 * mirroring the contextual "Table" menu convention in Word/Google Docs/
 * Jodit rather than showing every command at all times. A floating
 * BubbleMenu (see TableBubbleMenu.tsx) also appears directly over the table
 * for the most common of these actions as a faster in-place path.
 * `@tiptap/extension-table`'s TableKit already registers every one of these
 * commands (see src/extensions/index.ts) — this only adds the thin EditorApi
 * wrapper and menu.
 */
export function TableToolbarControl({ api, size = 'md' }: TableToolbarControlProps) {
  const inTable = api?.isTable() ?? false
  const [isOpen, setIsOpen] = useState(false)
  const [isCustomSizeOpen, setIsCustomSizeOpen] = useState(false)
  const dimensions = SIZE[size]

  if (inTable) {
    return (
      <ToolbarDropdown
        icon={Table2}
        label="Table"
        size={size}
        disabled={!api}
        onCloseAutoFocus={() => api?.focus()}
        items={[
          { id: 'table-row-above', icon: ArrowUpToLine, label: 'Insert row above', onSelect: () => api?.addRowBefore() },
          { id: 'table-row-below', icon: ArrowDownToLine, label: 'Insert row below', onSelect: () => api?.addRowAfter() },
          { id: 'table-delete-row', icon: Rows3, label: 'Delete row', onSelect: () => api?.deleteRow() },
          { id: 'table-column-before', icon: ArrowLeftToLine, label: 'Insert column left', onSelect: () => api?.addColumnBefore() },
          { id: 'table-column-after', icon: ArrowRightToLine, label: 'Insert column right', onSelect: () => api?.addColumnAfter() },
          { id: 'table-delete-column', icon: Columns3, label: 'Delete column', onSelect: () => api?.deleteColumn() },
          { id: 'table-merge-split', icon: Combine, label: 'Merge / split cells', onSelect: () => api?.mergeOrSplitCell() },
          { id: 'table-header-row', label: 'Toggle header row', separatorBefore: true, onSelect: () => api?.toggleHeaderRow() },
          { id: 'table-header-column', label: 'Toggle header column', onSelect: () => api?.toggleHeaderColumn() },
          { id: 'table-delete', icon: Trash2, label: 'Delete table', separatorBefore: true, onSelect: () => api?.deleteTable() },
        ]}
      />
    )
  }

  const insert = (rows: number, columns: number) => {
    api?.insertTable(rows, columns)
    setIsOpen(false)
    setIsCustomSizeOpen(false)
  }

  return (
    <>
      <DropdownMenuPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <ToolbarPrimitive.Button asChild disabled={!api}>
          <DropdownMenuPrimitive.Trigger
            aria-label="Insert table"
            title="Insert table"
            disabled={!api}
            className={cn(TRIGGER_CLASS, dimensions.button)}
          >
            <Table2 size={dimensions.icon} strokeWidth={1.9} aria-hidden />
          </DropdownMenuPrimitive.Trigger>
        </ToolbarPrimitive.Button>
        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            align="start"
            sideOffset={6}
            className={CONTENT_CLASS}
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              api?.focus()
            }}
          >
            <TableGridPicker onInsert={insert} />
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setIsCustomSizeOpen(true)
              }}
              className="mt-2 block w-full text-center text-[11px] font-medium text-neutral-500 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
            >
              Custom size…
            </button>
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
      <TableCustomSizeDialog
        isOpen={isCustomSizeOpen}
        onClose={() => setIsCustomSizeOpen(false)}
        onInsert={insert}
      />
    </>
  )
}
