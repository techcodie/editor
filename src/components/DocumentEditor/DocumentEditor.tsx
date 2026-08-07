import { memo, type MouseEvent } from 'react'
import { EditorContent } from '@tiptap/react'
import { cn } from '../../lib/cn'
import type { DocumentEditorProps } from '../../types/editor'

const CONTAINER_CLASS =
  'w-full rounded-lg border border-neutral-200/50 bg-white px-5 py-9 ' +
  // A softer, wider shadow than a generic card reads more like a resting
  // sheet of paper on a grey desk — the Word/Docs/Jodit reference feel. The
  // border is kept almost invisible at rest so the shadow alone does the
  // work of lifting the page off the workspace background; it only firms up
  // on focus, where a visible edge actually helps orient the eye.
  'shadow-[0_1px_1px_rgba(20,20,20,0.03),0_1px_3px_rgba(20,20,20,0.05),0_28px_56px_-28px_rgba(20,20,20,0.22)] ' +
  'transition-[border-color,box-shadow] duration-200 ' +
  'focus-within:border-neutral-300 ' +
  'focus-within:shadow-[0_1px_2px_rgba(20,20,20,0.05),0_24px_56px_-28px_rgba(20,20,20,0.4),0_0_0_3px_color-mix(in_srgb,var(--document-editor-focus-ring)_35%,transparent)] ' +
  'sm:px-14 sm:py-16 md:px-[4.5rem] md:py-20'

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
