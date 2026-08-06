import { Printer } from 'lucide-react'
import { ToolbarButton } from './ToolbarButton'
import type { ToolbarButtonSize } from './ToolbarButton'

export interface PrintToolbarControlProps {
  isActive: boolean
  onToggle: () => void
  size?: ToolbarButtonSize
}

/**
 * Opens the existing Print Preview (layout/components/PrintPreview.tsx).
 * Real `window.print()` stays out of scope — see CODEX_CONTEXT.md's
 * "Future Print Architecture" — this only surfaces the already-built preview.
 */
export function PrintToolbarControl({ isActive, onToggle, size = 'md' }: PrintToolbarControlProps) {
  return (
    <ToolbarButton
      icon={Printer}
      label="Print preview"
      isActive={isActive}
      onClick={onToggle}
      size={size}
      id="print-preview-trigger"
    />
  )
}
