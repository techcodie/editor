import { ShieldCheck } from 'lucide-react'
import { ToolbarButton } from '../../components/Toolbar/ToolbarButton'

interface ComplianceToolbarControlProps { isOpen: boolean; onToggle: () => void }

export function ComplianceToolbarControl({ isOpen, onToggle }: ComplianceToolbarControlProps) {
  return (
    <ToolbarButton
      id="compliance-trigger"
      icon={ShieldCheck}
      label={isOpen ? 'Close compliance analysis' : 'Open compliance analysis'}
      isActive={isOpen}
      ariaExpanded={isOpen}
      ariaControls="compliance-panel"
      onClick={onToggle}
    />
  )
}
