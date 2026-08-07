import { Highlighter } from 'lucide-react'
import type { EditorApi } from '../../lib/editor-api'
import { ColorPickerDropdown, type ColorSwatch } from './ColorPickerDropdown'
import type { ToolbarButtonSize } from './ToolbarButton'

const SWATCHES: ColorSwatch[] = [
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Blue', value: '#bfdbfe' },
  { label: 'Purple', value: '#e9d5ff' },
  { label: 'Pink', value: '#fbcfe8' },
  { label: 'Orange', value: '#fed7aa' },
  { label: 'Red', value: '#fecaca' },
  { label: 'Gray', value: '#e5e7eb' },
]

export interface HighlightColorDropdownProps {
  api: EditorApi | null
  size?: ToolbarButtonSize
}

/**
 * Highlight color picker. `Highlight` is configured with `multicolor: true`
 * in src/extensions/index.ts, so the existing highlight mark already
 * supports a `color` attribute — this exposes that as an EditorApi wrapper
 * alongside the existing plain toggleHighlight() one-color toggle.
 */
export function HighlightColorDropdown({ api, size = 'md' }: HighlightColorDropdownProps) {
  return (
    <ColorPickerDropdown
      icon={Highlighter}
      label="Highlight color"
      swatches={SWATCHES}
      current={api?.getHighlightColor() ?? null}
      disabled={!api}
      size={size}
      onSelect={(color) => api?.setHighlightColor(color)}
      onClear={() => api?.setHighlightColor(null)}
      onCloseAutoFocus={() => api?.focus()}
    />
  )
}
