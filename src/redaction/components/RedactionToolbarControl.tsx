import { ScanEye } from 'lucide-react'
import { ToolbarButton } from '../../components/Toolbar/ToolbarButton'

export function RedactionToolbarControl({ isOpen, count, onToggle }: { isOpen: boolean; count: number; onToggle: () => void }) {
  return (
    <ToolbarButton
      id="redaction-trigger"
      icon={ScanEye}
      label={isOpen ? 'Close redaction review' : 'Open redaction review'}
      isActive={isOpen}
      ariaExpanded={isOpen}
      ariaControls="redaction-panel"
      onClick={onToggle}
      badge={count > 0 ? Math.min(count, 99) : undefined}
    />
  )
}
