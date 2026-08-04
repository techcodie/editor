import { FileDown } from 'lucide-react'
import { ToolbarButton } from '../../components/Toolbar/ToolbarButton'

interface ExportToolbarControlProps {
  isOpen: boolean
  onToggle: () => void
}

export function ExportToolbarControl({ isOpen, onToggle }: ExportToolbarControlProps) {
  return (
    <ToolbarButton
      id="export-trigger"
      icon={FileDown}
      label={isOpen ? 'Close export document' : 'Export document'}
      isActive={isOpen}
      ariaExpanded={isOpen}
      ariaControls="export-dialog"
      onClick={onToggle}
    />
  )
}
