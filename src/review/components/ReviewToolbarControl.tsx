import { MessagesSquare } from 'lucide-react'
import { ToolbarButton } from '../../components/Toolbar/ToolbarButton'

interface ReviewToolbarControlProps {
  isActive: boolean
  onToggle: () => void
}

export function ReviewToolbarControl({ isActive, onToggle }: ReviewToolbarControlProps) {
  return (
    <ToolbarButton
      id="review-mode-trigger"
      icon={MessagesSquare}
      label={isActive ? 'Exit Review Mode' : 'Enter Review Mode'}
      isActive={isActive}
      ariaExpanded={isActive}
      ariaControls="review-sidebar"
      onClick={onToggle}
    />
  )
}
