import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { ArrowUp, Loader2, Mic, MicOff, Square } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import type { KnowledgeSource } from '../../knowledge/types/source'
import { TemporarySourceChips } from './TemporarySourceChips'

interface ChatInputProps {
  disabled?: boolean
  isActive: boolean
  focusRequest: number
  temporarySources: KnowledgeSource[]
  voiceEnabled: boolean
  keyboardShortcuts: boolean
  onRemoveTemporarySource: (sourceId: string) => void
  onSend: (content: string) => void
}

export function ChatInput({
  disabled,
  isActive,
  focusRequest,
  temporarySources,
  voiceEnabled,
  keyboardShortcuts,
  onRemoveTemporarySource,
  onSend,
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const focusInput = useCallback(() => {
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }, [])
  const {
    status: speechStatus,
    error: speechError,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    cancelListening,
    clearError: clearSpeechError,
  } = useSpeechRecognition({
    onTranscriptChange: setValue,
    onListeningEnd: focusInput,
  })
  const isListening = speechStatus === 'listening'
  const isProcessingSpeech = speechStatus === 'processing'
  const isSpeechActive = isListening || isProcessingSpeech
  const canSend = value.trim().length > 0 && !disabled

  useEffect(() => {
    if (isActive) inputRef.current?.focus()
  }, [focusRequest, isActive])

  useEffect(() => {
    if (!isActive || disabled) cancelListening()
  }, [cancelListening, disabled, isActive])

  const submit = () => {
    if (!canSend) return
    cancelListening()
    onSend(value)
    setValue('')
    focusInput()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      (!(event.metaKey || event.ctrlKey) || keyboardShortcuts)
    ) {
      event.preventDefault()
      submit()
    }
  }

  const handleValueChange = (nextValue: string) => {
    if (isSpeechActive) cancelListening()
    if (speechError) clearSpeechError()
    setValue(nextValue)
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
      return
    }

    if (!isProcessingSpeech) startListening(value)
  }

  const voiceLabel = !isSpeechSupported
    ? 'Voice input is not supported in this browser'
    : isListening
      ? 'Stop voice input'
      : isProcessingSpeech
        ? 'Finishing voice input'
        : speechError
          ? 'Try voice input again'
          : 'Start voice input'

  return (
    <form className="shrink-0 border-t border-neutral-200 bg-white p-3" onSubmit={handleSubmit}>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 shadow-[0_1px_2px_rgba(20,20,20,0.04)] transition-[border-color,background-color,box-shadow] duration-200 hover:border-neutral-300 focus-within:border-neutral-300 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.08),0_8px_20px_-16px_rgba(20,20,20,0.3)]">
        <TemporarySourceChips
          sources={temporarySources}
          onRemove={onRemoveTemporarySource}
        />
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
          onChange={(event) => handleValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-keyshortcuts={
            keyboardShortcuts ? 'Meta+Enter Control+Enter' : undefined
          }
          className="block max-h-36 min-h-[4.5rem] w-full resize-none bg-transparent px-1 py-0.5 text-sm leading-6 text-neutral-800 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="mt-1 flex min-h-8 items-center justify-between gap-2 pl-1">
          {voiceEnabled && <div
            id="ask-document-voice-status"
            className={cn(
              'min-w-0 text-[11px] leading-4',
              speechError ? 'text-red-600' : 'text-neutral-500',
            )}
            role={speechError ? 'alert' : 'status'}
            aria-live="polite"
          >
            {isListening && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" aria-hidden />
                Listening...
              </span>
            )}
            {isProcessingSpeech && 'Finishing transcript...'}
            {speechError?.message}
          </div>}
          <div className="flex shrink-0 items-center gap-1">
            {voiceEnabled && <span className="inline-flex" title={voiceLabel}>
              <button
                type="button"
                aria-label={voiceLabel}
                aria-pressed={isListening}
                aria-describedby={
                  isSpeechActive || speechError ? 'ask-document-voice-status' : undefined
                }
                disabled={disabled || !isSpeechSupported || isProcessingSpeech}
                onClick={toggleListening}
                className={cn(
                  'relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-[background-color,color,box-shadow,transform] duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-2 disabled:pointer-events-none',
                  isListening
                    ? 'bg-red-50 text-red-600 shadow-sm ring-1 ring-inset ring-red-200 hover:bg-red-100'
                    : speechError
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'text-neutral-500 hover:bg-neutral-200/70 hover:text-neutral-900 disabled:text-neutral-300',
                )}
              >
                {isProcessingSpeech ? (
                  <Loader2 size={15} strokeWidth={2} className="animate-spin" aria-hidden />
                ) : isListening ? (
                  <Square size={12} strokeWidth={2} fill="currentColor" aria-hidden />
                ) : speechError ? (
                  <MicOff size={16} strokeWidth={1.9} aria-hidden />
                ) : (
                  <Mic size={16} strokeWidth={1.9} aria-hidden />
                )}
              </button>
            </span>}
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
      </div>
    </form>
  )
}
