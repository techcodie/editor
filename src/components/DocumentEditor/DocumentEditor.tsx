import { memo, type MouseEvent } from 'react'
import { EditorContent } from '@tiptap/react'
import { cn } from '../../lib/cn'
import type { DocumentEditorProps } from '../../types/editor'

const CONTAINER_CLASS =
  'w-full rounded-md border border-neutral-200/90 bg-white px-5 py-10 ' +
  'shadow-[0_1px_2px_rgba(20,20,20,0.06),0_18px_48px_-28px_rgba(20,20,20,0.38)] ' +
  'transition-[border-color,box-shadow] duration-200 ' +
  'focus-within:border-neutral-300 ' +
  'focus-within:shadow-[0_1px_2px_rgba(20,20,20,0.06),0_22px_56px_-30px_rgba(20,20,20,0.42),0_0_0_3px_color-mix(in_srgb,var(--document-editor-focus-ring)_28%,transparent)] ' +
  'sm:px-14 sm:py-16 md:px-[4.75rem] md:py-[4.5rem]'

function DocumentEditorComponent({
  editor,
  className,
  onSurfaceClick,
  placementActive = false,
  pageOverlay,
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
        'document-page-surface relative',
        placementActive && 'cursor-copy border-indigo-300 ring-2 ring-indigo-500/10',
        className,
      )}
      data-document-page-surface
      data-asset-placement={placementActive ? 'active' : undefined}
      onClick={focusFromMargin}
    >
      <EditorContent editor={editor} />
      {pageOverlay}
    </div>
  )
}

export const DocumentEditor = memo(DocumentEditorComponent)
