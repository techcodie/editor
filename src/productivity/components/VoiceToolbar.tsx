import { Mic, Pause, Play, RotateCcw, Square } from 'lucide-react'
import type { VoiceCaptureStatus, VoiceInsertionMode } from '../types/productivity'

interface VoiceToolbarProps {
  status: VoiceCaptureStatus
  mode: VoiceInsertionMode
  supported: boolean
  onModeChange: (mode: VoiceInsertionMode) => void
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onUndo: () => void
}

export function VoiceToolbar({ status, mode, supported, onModeChange, onStart, onPause, onResume, onStop, onUndo }: VoiceToolbarProps) {
  return <div className="border-b border-neutral-200 p-4">
    <label htmlFor="voice-insertion-mode" className="text-[10px] font-semibold text-neutral-700">Dictation destination</label>
    <select id="voice-insertion-mode" value={mode} onChange={(event) => onModeChange(event.target.value as VoiceInsertionMode)} disabled={status === 'listening'} className="mt-1 h-9 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"><option value="cursor">Insert at cursor</option><option value="selection">Replace selection</option><option value="end">Append to document</option></select>
    <div className="mt-3 flex gap-1.5">
      {status === 'idle' || status === 'error' ? <button type="button" onClick={onStart} disabled={!supported} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-neutral-900 text-xs font-semibold text-white disabled:opacity-40"><Mic size={14} aria-hidden />Start</button> : status === 'paused' ? <button type="button" onClick={onResume} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-neutral-900 text-xs font-semibold text-white"><Play size={14} aria-hidden />Resume</button> : <button type="button" onClick={onPause} disabled={status !== 'listening'} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-neutral-200 text-xs font-semibold text-neutral-700 disabled:opacity-40"><Pause size={14} aria-hidden />Pause</button>}
      <button type="button" onClick={onStop} disabled={!['listening', 'paused'].includes(status)} aria-label="Stop dictation" title="Stop dictation" className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-500 disabled:opacity-35"><Square size={12} fill="currentColor" aria-hidden /></button>
      <button type="button" onClick={onUndo} aria-label="Undo dictation" title="Undo dictation" className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-500"><RotateCcw size={14} aria-hidden /></button>
    </div>
  </div>
}
