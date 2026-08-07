import { Baseline } from 'lucide-react'
import type { EditorApi } from '../../lib/editor-api'
import { ColorPickerDropdown, type ColorSwatch } from './ColorPickerDropdown'
import type { ToolbarButtonSize } from './ToolbarButton'

const SWATCHES: ColorSwatch[] = [
  { label: 'Black', value: '#171717' },
  { label: 'Gray', value: '#6b7280' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Amber', value: '#d97706' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Teal', value: '#0d9488' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Purple', value: '#9333ea' },
  { label: 'Pink', value: '#db2777' },
  { label: 'Brown', value: '#92400e' },
]

export interface TextColorDropdownProps {
  api: EditorApi | null
  size?: ToolbarButtonSize
}

/**
 * Text color picker. Registers `@tiptap/extension-text-style`'s `Color`
 * extension (see src/extensions/index.ts) — previously unavailable at any
 * layer, now exposed as a thin EditorApi wrapper.
 */
export function TextColorDropdown({ api, size = 'md' }: TextColorDropdownProps) {
  return (
    <ColorPickerDropdown
      icon={Baseline}
      label="Text color"
      swatches={SWATCHES}
      current={api?.getColor() ?? null}
      disabled={!api}
      size={size}
      onSelect={(color) => api?.setColor(color)}
      onClear={() => api?.unsetColor()}
      onCloseAutoFocus={() => api?.focus()}
    />
  )
}
