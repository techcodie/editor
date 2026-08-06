import { ScanText } from 'lucide-react'
import { ToolbarButton } from '../../components/Toolbar/ToolbarButton'

export function DocumentIntelligenceToolbarControl({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <ToolbarButton
      id="document-intelligence-trigger"
      icon={ScanText}
      label={isOpen ? 'Close Document Intelligence' : 'Import with Document Intelligence'}
      isActive={isOpen}
      ariaExpanded={isOpen}
      ariaControls="document-intelligence-panel"
      onClick={onToggle}
    />
  )
}
