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
 * The one "Table" entry point. Outside a table this shows a single obvious
 * "Insert table" action — not the full row/column/header/merge command set,
 * which means nothing yet and previously buried that one relevant action
 * under ten disabled ones. Once the caret is inside a table, the same
 * control switches to the full management list, right where those commands
 * become actionable — mirroring the contextual "Table" menu convention in
 * Word/Google Docs/Jodit rather than showing every command at all times.
 * `@tiptap/extension-table`'s TableKit already registers every one of these
 * commands (see src/extensions/index.ts) — this only adds the thin EditorApi
 * wrapper and menu.
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
      items={inTable ? [
        {
          id: 'table-row-above',
          icon: ArrowUpToLine,
          label: 'Insert row above',
          onSelect: () => api?.addRowBefore(),
        },
        {
          id: 'table-row-below',
          icon: ArrowDownToLine,
          label: 'Insert row below',
          onSelect: () => api?.addRowAfter(),
        },
        {
          id: 'table-delete-row',
          icon: Rows3,
          label: 'Delete row',
          onSelect: () => api?.deleteRow(),
        },
        {
          id: 'table-column-before',
          icon: ArrowLeftToLine,
          label: 'Insert column left',
          onSelect: () => api?.addColumnBefore(),
        },
        {
          id: 'table-column-after',
          icon: ArrowRightToLine,
          label: 'Insert column right',
          onSelect: () => api?.addColumnAfter(),
        },
        {
          id: 'table-delete-column',
          icon: Columns3,
          label: 'Delete column',
          onSelect: () => api?.deleteColumn(),
        },
        {
          id: 'table-merge-split',
          icon: Combine,
          label: 'Merge / split cells',
          onSelect: () => api?.mergeOrSplitCell(),
        },
        {
          id: 'table-header-row',
          label: 'Toggle header row',
          separatorBefore: true,
          onSelect: () => api?.toggleHeaderRow(),
        },
        {
          id: 'table-header-column',
          label: 'Toggle header column',
          onSelect: () => api?.toggleHeaderColumn(),
        },
        {
          id: 'table-delete',
          icon: Trash2,
          label: 'Delete table',
          separatorBefore: true,
          onSelect: () => api?.deleteTable(),
        },
      ] : [
        {
          id: 'table-insert',
          icon: Grid3x3,
          label: 'Insert table',
          onSelect: () => api?.insertTable(),
        },
      ]}
    />
  )
}
