import { FileSearch2 } from 'lucide-react'
import { ToolbarButton } from '../../components/Toolbar/ToolbarButton'

export function ContractToolbarControl({ isOpen, riskScore, onToggle }: { isOpen: boolean; riskScore?: number; onToggle: () => void }) {
  return (
    <ToolbarButton
      id="contract-trigger"
      icon={FileSearch2}
      label={isOpen ? 'Close contract intelligence' : 'Open contract intelligence'}
      isActive={isOpen}
      ariaExpanded={isOpen}
      ariaControls="contract-panel"
      onClick={onToggle}
      badge={riskScore !== undefined ? riskScore : undefined}
    />
  )
}
