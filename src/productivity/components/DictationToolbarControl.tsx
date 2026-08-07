import { Mic } from 'lucide-react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import type { EditorApi } from '../../lib/editor-api'
import { cn } from '../../lib/cn'
import type { VoiceCommandsController } from '../hooks/useVoiceCommands'
import { VoiceToolbar } from './VoiceToolbar'

const TRIGGER_CLASS =
  'relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 ' +
  'transition-[background-color,color,box-shadow,transform] duration-150 ' +
  'hover:bg-neutral-100 hover:text-neutral-950 ' +
  'active:scale-[0.96] active:bg-neutral-200/70 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] ' +
  'focus-visible:ring-offset-1 focus-visible:ring-offset-white ' +
  'disabled:pointer-events-none disabled:opacity-35 ' +
  'data-[state=open]:bg-neutral-900 data-[state=open]:text-white'

const CONTENT_CLASS =
  'z-50 w-[19rem] overflow-hidden rounded-xl border border-neutral-200/80 bg-white ' +
  'shadow-[var(--document-editor-shadow-raised)] [animation:toolbar-tooltip-in_120ms_ease-out]'

export interface DictationToolbarControlProps {
  api: EditorApi | null
  voice: VoiceCommandsController
}

/**
 * Document dictation, not AI chat: speaks directly into the current cursor
 * position through the same `useVoiceCommands` session the Productivity
 * panel's Voice tab uses (lifted to the workspace so there is exactly one
 * live recognition session, never two). Reuses the existing `VoiceToolbar`
 * controls rather than re-implementing start/pause/resume/stop.
 */
export function DictationToolbarControl({ api, voice }: DictationToolbarControlProps) {
  const isActive = voice.status === 'listening' || voice.status === 'paused'

  return (
    <DropdownMenuPrimitive.Root>
      <ToolbarPrimitive.Button asChild disabled={!api || !voice.isSupported}>
        <DropdownMenuPrimitive.Trigger
          aria-label={isActive ? 'Dictation is active' : 'Dictate'}
          title={voice.isSupported ? 'Dictate (Ctrl/Cmd+Shift+D)' : 'Dictation is not supported in this browser'}
          disabled={!api || !voice.isSupported}
          className={cn(TRIGGER_CLASS, isActive && 'bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white')}
        >
          <Mic size={16} strokeWidth={1.9} aria-hidden />
          {voice.status === 'listening' && (
            <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
          )}
        </DropdownMenuPrimitive.Trigger>
      </ToolbarPrimitive.Button>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="start"
          sideOffset={6}
          className={CONTENT_CLASS}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            api?.focus()
          }}
        >
          <VoiceToolbar
            status={voice.status}
            mode={voice.mode}
            supported={voice.isSupported}
            onModeChange={voice.setMode}
            onStart={voice.start}
            onPause={voice.pause}
            onResume={voice.resume}
            onStop={voice.stop}
            onUndo={voice.undoDictation}
          />
          {voice.error && (
            <p role="alert" className="border-t border-red-100 bg-red-50 px-4 py-2 text-[11px] text-red-700">
              {voice.error}
            </p>
          )}
          {(voice.interimTranscript || voice.lastTranscript) && (
            <div className="border-t border-neutral-200 p-3">
              <p className="text-[10px] font-semibold text-neutral-500">Live transcript</p>
              <p aria-live="polite" className="mt-1 max-h-24 overflow-y-auto text-xs leading-5 text-neutral-700">
                {voice.interimTranscript || voice.lastTranscript}
              </p>
            </div>
          )}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}
