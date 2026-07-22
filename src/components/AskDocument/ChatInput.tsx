import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { ArrowUp } from 'lucide-react'

interface ChatInputProps {
  disabled?: boolean
  isActive: boolean
  onSend: (content: string) => void
}

export function ChatInput({ disabled, isActive, onSend }: ChatInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const canSend = value.trim().length > 0 && !disabled

  useEffect(() => {
    if (isActive) inputRef.current?.focus()
  }, [isActive])

  const submit = () => {
    if (!canSend) return
    onSend(value)
    setValue('')
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form className="shrink-0 border-t border-neutral-200 bg-white p-3" onSubmit={handleSubmit}>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 shadow-[0_1px_2px_rgba(20,20,20,0.04)] transition-[border-color,background-color,box-shadow] duration-200 hover:border-neutral-300 focus-within:border-neutral-300 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.08),0_8px_20px_-16px_rgba(20,20,20,0.3)]">
        <label htmlFor="ask-document-input" className="sr-only">
          Ask something about this document
        </label>
        <textarea
          ref={inputRef}
          id="ask-document-input"
          rows={3}
          value={value}
          disabled={disabled}
          placeholder="Ask something about this document..."
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          className="block max-h-36 min-h-[4.5rem] w-full resize-none bg-transparent px-1 py-0.5 text-sm leading-6 text-neutral-800 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="mt-1 flex items-center justify-end">
          <button
            type="submit"
            aria-label="Send question"
            title="Send question"
            disabled={!canSend}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-neutral-800 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none"
          >
            <ArrowUp size={16} strokeWidth={2.2} aria-hidden />
          </button>
        </div>
      </div>
    </form>
  )
}
