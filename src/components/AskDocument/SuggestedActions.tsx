import {
  AlignLeft,
  CalendarClock,
  CircleHelp,
  ListChecks,
  ListTree,
  MessageCircleQuestion,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface SuggestedAction {
  label: string
  prompt: string
  icon: LucideIcon
}
interface SuggestedActionsProps {
  disabled?: boolean
  onSelect: (prompt: string) => void
}

const ACTIONS: SuggestedAction[] = [
  { label: 'Summarize', prompt: 'Summarize this document', icon: AlignLeft },
  { label: 'Key Points', prompt: 'What are the key points?', icon: ListTree },
  { label: 'Explain', prompt: 'Explain this document simply', icon: MessageCircleQuestion },
  { label: 'Action Items', prompt: 'What action items exist?', icon: ListChecks },
  { label: 'Deadlines', prompt: 'What deadlines are mentioned?', icon: CalendarClock },
  { label: 'Questions', prompt: 'What questions does this document leave open?', icon: CircleHelp },
]

export function SuggestedActions({ disabled, onSelect }: SuggestedActionsProps) {
  return (
    <div aria-label="Suggested questions" className="grid w-full grid-cols-2 gap-2">
      {ACTIONS.map(({ label, prompt, icon: Icon }) => (
        <button
          key={label}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className="group flex min-h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-xs font-medium text-neutral-700 shadow-sm transition-[border-color,background-color,color,transform] hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-950 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:pointer-events-none disabled:opacity-45"
        >
          <Icon
            size={15}
            strokeWidth={1.9}
            className="shrink-0 text-indigo-500 transition-colors group-hover:text-indigo-600"
            aria-hidden
          />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
