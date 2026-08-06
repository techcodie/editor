import { WandSparkles } from 'lucide-react'
import { ToolbarButton } from '../../components/Toolbar/ToolbarButton'

interface ProductivityToolbarControlProps {
  isOpen: boolean
  onToggle: () => void
}

export function ProductivityToolbarControl({ isOpen, onToggle }: ProductivityToolbarControlProps) {
  return (
    <ToolbarButton
      id="productivity-trigger"
      icon={WandSparkles}
      label={isOpen ? 'Close AI productivity' : 'Open AI productivity'}
      isActive={isOpen}
      ariaExpanded={isOpen}
      ariaControls="productivity-sidebar"
      onClick={onToggle}
    />
  )
}
