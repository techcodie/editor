import { useState } from 'react'
import { LocateFixed, Merge, Pencil, Split } from 'lucide-react'
import type { SpeakerSegment, TranscriptSpeaker } from '../types/productivity'
import { SpeakerEditor } from './SpeakerEditor'

interface SpeakerManagerProps {
  speakers: TranscriptSpeaker[]
  segments: SpeakerSegment[]
  onRename: (speaker: TranscriptSpeaker, name: string, globally: boolean) => void
  onMerge: (source: TranscriptSpeaker, target: TranscriptSpeaker) => void
  onSplit: (segment: SpeakerSegment, name: string) => void
  onNavigate: (segment: SpeakerSegment) => void
}

export function SpeakerManager({ speakers, segments, onRename, onMerge, onSplit, onNavigate }: SpeakerManagerProps) {
  const [editing, setEditing] = useState<string | null>(null)
  const [mergeTarget, setMergeTarget] = useState('')
  const [splitSegment, setSplitSegment] = useState<string | null>(null)
  const [splitName, setSplitName] = useState('')
  if (speakers.length === 0) return <div className="m-4 rounded-md border border-dashed border-neutral-300 px-5 py-8 text-center text-xs text-neutral-500">Speaker-labelled transcript lines will appear here.</div>
  return (
    <div className="space-y-3 p-4">
      {speakers.map((speaker) => {
        const speakerSegments = segments.filter((segment) => segment.speakerId === speaker.id)
        return <section key={speaker.id} className="border-b border-neutral-200 pb-3 last:border-0">
          {editing === speaker.id ? <SpeakerEditor speaker={speaker} onCancel={() => setEditing(null)} onSave={(name, globally) => { onRename(speaker, name, globally); setEditing(null) }} /> : <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: speaker.color }} aria-hidden /><div className="min-w-0 flex-1"><h3 className="truncate text-xs font-semibold text-neutral-900">{speaker.name}</h3><p className="text-[10px] text-neutral-500">{speaker.segmentCount} segments · {speaker.wordCount} words</p></div><button type="button" onClick={() => setEditing(speaker.id)} aria-label={`Rename ${speaker.name}`} title="Rename speaker" className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"><Pencil size={13} aria-hidden /></button></div>}
          {speakers.length > 1 && <div className="mt-2 flex gap-1.5"><select value={mergeTarget} onChange={(event) => setMergeTarget(event.target.value)} aria-label={`Merge ${speaker.name} into`} className="h-8 min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 text-[10px]"><option value="">Merge into...</option>{speakers.filter((item) => item.id !== speaker.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" disabled={!mergeTarget} onClick={() => { const target = speakers.find((item) => item.id === mergeTarget); if (target) onMerge(speaker, target); setMergeTarget('') }} aria-label={`Merge ${speaker.name}`} className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-500 disabled:opacity-35"><Merge size={13} aria-hidden /></button></div>}
          <div className="mt-2 space-y-1.5">{speakerSegments.map((segment) => <div key={segment.id} className="rounded-md bg-neutral-50 p-2"><div className="flex items-start gap-1.5"><button type="button" onClick={() => onNavigate(segment)} aria-label={`Jump to ${speaker.name} segment ${segment.index + 1}`} title="Jump to transcript" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-neutral-400 hover:bg-white hover:text-neutral-800"><LocateFixed size={12} aria-hidden /></button><p className="line-clamp-2 flex-1 text-[10px] leading-4 text-neutral-600">{segment.text}</p><button type="button" onClick={() => { setSplitSegment(segment.id); setSplitName('') }} aria-label={`Split segment ${segment.index + 1}`} title="Assign new speaker" className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-neutral-400 hover:bg-white hover:text-neutral-800"><Split size={12} aria-hidden /></button></div>{splitSegment === segment.id && <div className="mt-2 flex gap-1.5"><input value={splitName} onChange={(event) => setSplitName(event.target.value)} aria-label="New speaker name" placeholder="New speaker" className="h-8 min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 text-[10px] outline-none focus:border-indigo-400" /><button type="button" disabled={!splitName.trim()} onClick={() => { onSplit(segment, splitName); setSplitSegment(null) }} className="h-8 rounded-md bg-neutral-900 px-2 text-[10px] font-semibold text-white disabled:opacity-35">Apply</button></div>}</div>)}</div>
        </section>
      })}
    </div>
  )
}
