import { useEffect, useId, useRef, useState } from 'react'
import { Send, X } from 'lucide-react'
import { cn } from '../../lib/cn'

interface CommentComposerProps {
  initialText?: string
  placeholder?: string
  submitLabel?: string
  compact?: boolean
  autoFocus?: boolean
  onSubmit: (text: string) => boolean
  onCancel?: () => void
}

export function CommentComposer({
  initialText = '',
  placeholder = 'Add a comment…',
  submitLabel = 'Comment',
  compact = false,
  autoFocus = true,
  onSubmit,
  onCancel,
}: CommentComposerProps) {
  const [text, setText] = useState(initialText)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const composerId = useId()

  useEffect(() => {
    if (!autoFocus) return
    textareaRef.current?.focus()
    textareaRef.current?.setSelectionRange(initialText.length, initialText.length)
  }, [autoFocus, initialText])

  const submit = () => {
    if (!text.trim()) return
    if (onSubmit(text)) setText('')
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-2.5 shadow-[0_12px_36px_-22px_rgba(20,20,20,0.45)]">
      <label className="sr-only" htmlFor={composerId}>
        {placeholder}
      </label>
      <textarea
        ref={textareaRef}
        id={composerId}
        value={text}
        rows={compact ? 2 : 3}
        maxLength={2000}
        placeholder={placeholder}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && onCancel) {
            event.preventDefault()
            event.stopPropagation()
            onCancel()
          }
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault()
            submit()
          }
        }}
        className={cn(
          'block w-full resize-none bg-transparent px-1 text-sm leading-5 text-neutral-900 outline-none placeholder:text-neutral-400',
          compact ? 'min-h-12' : 'min-h-[4.5rem]',
        )}
      />
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-neutral-100 pt-2">
        <span className="text-[10px] tabular-nums text-neutral-400">
          {text.length}/2000
        </span>
        <div className="flex items-center gap-1.5">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
            >
              <X size={13} strokeWidth={2} aria-hidden />
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!text.trim()}
            className="inline-flex h-7 items-center gap-1.5 rounded-md bg-neutral-900 px-2.5 text-xs font-semibold text-white transition-[background-color,transform] hover:bg-neutral-800 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-35"
          >
            <Send size={12} strokeWidth={2} aria-hidden />
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
