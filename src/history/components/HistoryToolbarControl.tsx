import { History } from 'lucide-react'
import { ToolbarButton } from '../../components/Toolbar/ToolbarButton'

interface HistoryToolbarControlProps {
  isOpen: boolean
  versionCount: number
  onToggle: () => void
}

export function HistoryToolbarControl({ isOpen, versionCount, onToggle }: HistoryToolbarControlProps) {
  return (
    <ToolbarButton
      id="history-trigger"
      icon={History}
      label="Version history"
      isActive={isOpen}
      ariaExpanded={isOpen}
      ariaControls="history-panel"
      onClick={onToggle}
      badge={versionCount > 0 ? Math.min(99, versionCount) : undefined}
    />
  )
}
