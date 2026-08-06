import { SpellCheck2 } from 'lucide-react'
import { ToolbarButton } from '../../components/Toolbar/ToolbarButton'

export function WritingAssistantToolbarControl({ isOpen, score, onToggle }: { isOpen: boolean; score?: number; onToggle: () => void }) {
  return (
    <ToolbarButton
      id="writing-assistant-trigger"
      icon={SpellCheck2}
      label={isOpen ? 'Close writing assistant' : 'Open writing assistant'}
      isActive={isOpen}
      ariaExpanded={isOpen}
      ariaControls="writing-assistant-panel"
      onClick={onToggle}
      badge={score !== undefined ? score : undefined}
    />
  )
}
