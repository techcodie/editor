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
  Grid3x3,
} from 'lucide-react'
import type { EditorApi } from '../../lib/editor-api'
import { ToolbarDropdown } from './ToolbarDropdown'
import type { ToolbarButtonSize } from './ToolbarButton'

export interface TableToolbarControlProps {
  api: EditorApi | null
  size?: ToolbarButtonSize
}

/**
 * The one "Table" entry point: inserting a brand new table, and every
 * row/column/header/merge edit for the table the caret is currently inside.
 * `@tiptap/extension-table`'s TableKit already registers every one of these
 * commands (see src/extensions/index.ts) — this only adds the thin EditorApi
 * wrapper and menu. Edit items stay disabled outside a table instead of
 * hiding the whole control, so it's discoverable even before a table exists.
 */
export function TableToolbarControl({ api, size = 'md' }: TableToolbarControlProps) {
  const inTable = api?.isTable() ?? false

  return (
    <ToolbarDropdown
      icon={Table2}
      label="Table"
      size={size}
      disabled={!api}
      onCloseAutoFocus={() => api?.focus()}
      items={[
        {
          id: 'table-insert',
          icon: Grid3x3,
          label: 'Insert table',
          disabled: inTable,
          onSelect: () => api?.insertTable(),
        },
        {
          id: 'table-row-above',
          icon: ArrowUpToLine,
          label: 'Insert row above',
          disabled: !inTable,
          onSelect: () => api?.addRowBefore(),
        },
        {
          id: 'table-row-below',
          icon: ArrowDownToLine,
          label: 'Insert row below',
          disabled: !inTable,
          onSelect: () => api?.addRowAfter(),
        },
        {
          id: 'table-delete-row',
          icon: Rows3,
          label: 'Delete row',
          disabled: !inTable,
          onSelect: () => api?.deleteRow(),
        },
        {
          id: 'table-column-before',
          icon: ArrowLeftToLine,
          label: 'Insert column left',
          disabled: !inTable,
          onSelect: () => api?.addColumnBefore(),
        },
        {
          id: 'table-column-after',
          icon: ArrowRightToLine,
          label: 'Insert column right',
          disabled: !inTable,
          onSelect: () => api?.addColumnAfter(),
        },
        {
          id: 'table-delete-column',
          icon: Columns3,
          label: 'Delete column',
          disabled: !inTable,
          onSelect: () => api?.deleteColumn(),
        },
        {
          id: 'table-merge-split',
          icon: Combine,
          label: 'Merge / split cells',
          disabled: !inTable,
          onSelect: () => api?.mergeOrSplitCell(),
        },
        {
          id: 'table-header-row',
          label: 'Toggle header row',
          disabled: !inTable,
          onSelect: () => api?.toggleHeaderRow(),
        },
        {
          id: 'table-header-column',
          label: 'Toggle header column',
          disabled: !inTable,
          onSelect: () => api?.toggleHeaderColumn(),
        },
        {
          id: 'table-delete',
          icon: Trash2,
          label: 'Delete table',
          disabled: !inTable,
          onSelect: () => api?.deleteTable(),
        },
      ]}
    />
  )
}
