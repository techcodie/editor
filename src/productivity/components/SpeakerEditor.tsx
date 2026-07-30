import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import type { TranscriptSpeaker } from '../types/productivity'

interface SpeakerEditorProps {
  speaker: TranscriptSpeaker
  onSave: (name: string, globally: boolean) => void
  onCancel: () => void
}

export function SpeakerEditor({ speaker, onSave, onCancel }: SpeakerEditorProps) {
  const [name, setName] = useState(speaker.name)
  const [globally, setGlobally] = useState(true)
  useEffect(() => setName(speaker.name), [speaker.name])
  return (
    <div className="rounded-md border border-indigo-200 bg-indigo-50/50 p-3">
      <label htmlFor="speaker-name" className="text-[10px] font-semibold text-neutral-700">Speaker name</label>
      <input id="speaker-name" value={name} maxLength={40} onChange={(event) => setName(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-neutral-300 bg-white px-2.5 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
      <label className="mt-2 flex items-center gap-2 text-[11px] text-neutral-600"><input type="checkbox" checked={globally} onChange={(event) => setGlobally(event.target.checked)} className="accent-indigo-600" />Apply globally</label>
      <div className="mt-2 flex justify-end gap-1.5"><button type="button" onClick={onCancel} aria-label="Cancel speaker edit" className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500"><X size={13} aria-hidden /></button><button type="button" onClick={() => onSave(name, globally)} disabled={!name.trim()} aria-label="Save speaker name" className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 text-white disabled:opacity-40"><Check size={13} aria-hidden /></button></div>
    </div>
  )
}
