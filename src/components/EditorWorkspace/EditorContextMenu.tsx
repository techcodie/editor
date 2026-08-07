import type { ReactNode } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link2,
  List,
  ListOrdered,
  Redo2,
  RemoveFormatting,
  Rows3,
  Columns3,
  Trash2,
  Undo2,
} from 'lucide-react'
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu'
import type { EditorApi } from '../../lib/editor-api'

export interface EditorContextMenuProps {
  api: EditorApi | null
  /** Disabled in readonly/reading modes — children render without the custom menu so the native browser menu still works. */
  enabled: boolean
  children: ReactNode
}

const CONTENT_CLASS =
  'z-50 min-w-[15rem] overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-1.5 ' +
  'shadow-[var(--document-editor-shadow-raised)] [animation:toolbar-tooltip-in_120ms_ease-out]'

const ITEM_CLASS =
  'flex w-full cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-neutral-700 ' +
  'outline-none transition-colors duration-100 ' +
  'data-[highlighted]:bg-neutral-100 data-[highlighted]:text-neutral-950 ' +
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-40'

const SEPARATOR_CLASS = 'my-1.5 h-px bg-neutral-200/80'

/**
 * Right-click menu for the most common editing actions. Every entry is an
 * existing EditorApi command — this only adds a faster path to it, no new
 * capability. Table entries stay disabled outside a table instead of being
 * hidden, matching TableToolbarControl.
 */
export function EditorContextMenu({ api, enabled, children }: EditorContextMenuProps) {
  if (!enabled || !api) return <>{children}</>

  const inTable = api.isTable()

  return (
    <ContextMenuPrimitive.Root
      onOpenChange={(open) => {
        // Radix returns focus to the element that was right-clicked by
        // default, but that element is inside the ProseMirror DOM itself —
        // closing without an explicit focus() call can leave the browser's
        // native selection out of sync with ProseMirror's, the same class of
        // bug fixed for dropdown menus elsewhere in this toolbar.
        if (!open) api.focus()
      }}
    >
      <ContextMenuPrimitive.Trigger className="contents">{children}</ContextMenuPrimitive.Trigger>
      <ContextMenuPrimitive.Portal>
        <ContextMenuPrimitive.Content className={CONTENT_CLASS}>
          <ContextMenuPrimitive.Item className={ITEM_CLASS} onSelect={() => api.undo()} disabled={!api.canUndo()}>
            <Undo2 size={15} strokeWidth={1.9} className="shrink-0 text-neutral-500" aria-hidden />
            Undo
          </ContextMenuPrimitive.Item>
          <ContextMenuPrimitive.Item className={ITEM_CLASS} onSelect={() => api.redo()} disabled={!api.canRedo()}>
            <Redo2 size={15} strokeWidth={1.9} className="shrink-0 text-neutral-500" aria-hidden />
            Redo
          </ContextMenuPrimitive.Item>
          <ContextMenuPrimitive.Separator className={SEPARATOR_CLASS} />
          <ContextMenuPrimitive.Item className={ITEM_CLASS} onSelect={() => api.toggleBold()}>
            <Bold size={15} strokeWidth={1.9} className="shrink-0 text-neutral-500" aria-hidden />
            Bold
          </ContextMenuPrimitive.Item>
          <ContextMenuPrimitive.Item className={ITEM_CLASS} onSelect={() => api.toggleItalic()}>
            <Italic size={15} strokeWidth={1.9} className="shrink-0 text-neutral-500" aria-hidden />
            Italic
          </ContextMenuPrimitive.Item>
          <ContextMenuPrimitive.Item className={ITEM_CLASS} onSelect={() => api.toggleUnderline()}>
            <Underline size={15} strokeWidth={1.9} className="shrink-0 text-neutral-500" aria-hidden />
            Underline
          </ContextMenuPrimitive.Item>
          <ContextMenuPrimitive.Item className={ITEM_CLASS} onSelect={() => api.toggleStrike()}>
            <Strikethrough size={15} strokeWidth={1.9} className="shrink-0 text-neutral-500" aria-hidden />
            Strikethrough
          </ContextMenuPrimitive.Item>
          <ContextMenuPrimitive.Item
            className={ITEM_CLASS}
            onSelect={() => (api.isLink() ? api.unsetLink() : undefined)}
            disabled={!api.isLink()}
          >
            <Link2 size={15} strokeWidth={1.9} className="shrink-0 text-neutral-500" aria-hidden />
            Remove link
          </ContextMenuPrimitive.Item>
          <ContextMenuPrimitive.Item className={ITEM_CLASS} onSelect={() => api.clearFormatting()}>
            <RemoveFormatting size={15} strokeWidth={1.9} className="shrink-0 text-neutral-500" aria-hidden />
            Clear formatting
          </ContextMenuPrimitive.Item>
          <ContextMenuPrimitive.Separator className={SEPARATOR_CLASS} />
          <ContextMenuPrimitive.Item className={ITEM_CLASS} onSelect={() => api.toggleBulletList()}>
            <List size={15} strokeWidth={1.9} className="shrink-0 text-neutral-500" aria-hidden />
            Bullet list
          </ContextMenuPrimitive.Item>
          <ContextMenuPrimitive.Item className={ITEM_CLASS} onSelect={() => api.toggleOrderedList()}>
            <ListOrdered size={15} strokeWidth={1.9} className="shrink-0 text-neutral-500" aria-hidden />
            Numbered list
          </ContextMenuPrimitive.Item>
          {inTable && (
            <>
              <ContextMenuPrimitive.Separator className={SEPARATOR_CLASS} />
              <ContextMenuPrimitive.Item className={ITEM_CLASS} onSelect={() => api.addRowAfter()}>
                <Rows3 size={15} strokeWidth={1.9} className="shrink-0 text-neutral-500" aria-hidden />
                Insert row below
              </ContextMenuPrimitive.Item>
              <ContextMenuPrimitive.Item className={ITEM_CLASS} onSelect={() => api.addColumnAfter()}>
                <Columns3 size={15} strokeWidth={1.9} className="shrink-0 text-neutral-500" aria-hidden />
                Insert column right
              </ContextMenuPrimitive.Item>
              <ContextMenuPrimitive.Item className={ITEM_CLASS} onSelect={() => api.deleteTable()}>
                <Trash2 size={15} strokeWidth={1.9} className="shrink-0 text-red-600" aria-hidden />
                Delete table
              </ContextMenuPrimitive.Item>
            </>
          )}
        </ContextMenuPrimitive.Content>
      </ContextMenuPrimitive.Portal>
    </ContextMenuPrimitive.Root>
  )
}
