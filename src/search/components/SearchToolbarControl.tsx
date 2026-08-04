import { Search } from 'lucide-react'
import { ToolbarButton } from '../../components/Toolbar/ToolbarButton'

export function SearchToolbarControl({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <ToolbarButton
      id="semantic-search-trigger"
      icon={Search}
      label={isOpen ? 'Close semantic search' : 'Open semantic search'}
      isActive={isOpen}
      ariaExpanded={isOpen}
      ariaControls="semantic-search-panel"
      onClick={onToggle}
    />
  )
}
