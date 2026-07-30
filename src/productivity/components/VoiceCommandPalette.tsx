import { VOICE_COMMANDS } from '../services/voiceCommandEngine'
import type { VoiceCommandId } from '../types/productivity'

interface VoiceCommandPaletteProps { onRun: (command: VoiceCommandId) => void }

export function VoiceCommandPalette({ onRun }: VoiceCommandPaletteProps) {
  return <section className="border-b border-neutral-200 p-4"><h3 className="text-[11px] font-semibold text-neutral-800">Voice commands</h3><div className="mt-2 grid grid-cols-2 gap-1.5">{VOICE_COMMANDS.map((command) => <button key={command.id} type="button" onClick={() => onRun(command.id)} className="h-8 truncate rounded-md border border-neutral-200 bg-white px-2 text-left text-[10px] font-medium text-neutral-600 hover:border-neutral-300 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35">{command.label}</button>)}</div></section>
}
