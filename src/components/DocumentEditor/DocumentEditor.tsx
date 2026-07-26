import { memo, type MouseEvent } from 'react'
import { EditorContent } from '@tiptap/react'
import { cn } from '../../lib/cn'
import type { DocumentEditorProps } from '../../types/editor'

const CONTAINER_CLASS =
  'w-full rounded-lg border border-neutral-200 bg-white px-5 py-9 ' +
  'shadow-[var(--document-editor-shadow-surface)] ' +
  'transition-[border-color,box-shadow] duration-200 ' +
  'focus-within:border-neutral-300 ' +
  'focus-within:shadow-[0_1px_2px_rgba(20,20,20,0.05),0_20px_52px_-28px_rgba(20,20,20,0.4),0_0_0_3px_rgba(99,102,241,0.06)] ' +
  'sm:px-12 sm:py-14 md:px-16 md:py-16'

function DocumentEditorComponent({
  editor,
  className,
  onSurfaceClick,
  placementActive = false,
}: DocumentEditorProps) {
  // Clicking the page margins (not the text) drops the caret at the document end.
  const focusFromMargin = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      editor?.chain().focus('end').run()
    }
    onSurfaceClick?.()
  }

  return (
    <div
      className={cn(
        CONTAINER_CLASS,
        placementActive && 'cursor-copy border-indigo-300 ring-2 ring-indigo-500/10',
        className,
      )}
      data-asset-placement={placementActive ? 'active' : undefined}
      onClick={focusFromMargin}
    >
      <EditorContent editor={editor} />
    </div>
  )
}

export const DocumentEditor = memo(DocumentEditorComponent)
