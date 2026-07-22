import type { MouseEvent } from 'react'
import { EditorContent } from '@tiptap/react'
import { cn } from '../../lib/cn'
import type { DocumentEditorProps } from '../../types/editor'

const CONTAINER_CLASS =
  'w-full rounded-2xl border border-neutral-200/80 bg-white px-6 py-10 ' +
  'shadow-[0_1px_2px_rgba(16,15,15,0.04),0_14px_40px_-18px_rgba(16,15,15,0.14)] ' +
  'transition-[border-color,box-shadow] duration-300 ' +
  'focus-within:border-neutral-300 ' +
  'focus-within:shadow-[0_1px_2px_rgba(16,15,15,0.05),0_18px_50px_-20px_rgba(16,15,15,0.2)] ' +
  'sm:px-14 sm:py-16'

export function DocumentEditor({ editor, className }: DocumentEditorProps) {
  // Clicking the page margins (not the text) drops the caret at the document end.
  const focusFromMargin = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      editor?.chain().focus('end').run()
    }
  }

  return (
    <div className={cn(CONTAINER_CLASS, className)} onClick={focusFromMargin}>
      <EditorContent editor={editor} />
    </div>
  )
}
