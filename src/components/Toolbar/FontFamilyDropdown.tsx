import { Type } from 'lucide-react'
import type { EditorApi } from '../../lib/editor-api'
import { ToolbarDropdown } from './ToolbarDropdown'
import type { ToolbarButtonSize } from './ToolbarButton'

export interface FontFamilyDropdownProps {
  api: EditorApi | null
  size?: ToolbarButtonSize
}

/** value: null represents "Default" (the host/theme's inherited font-family). */
const FONT_FAMILIES: { label: string; value: string | null }[] = [
  { label: 'Default', value: null },
  { label: 'Sans Serif', value: 'ui-sans-serif, system-ui, sans-serif' },
  { label: 'Serif', value: 'ui-serif, Georgia, serif' },
  { label: 'Monospace', value: 'ui-monospace, "SFMono-Regular", monospace' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
]

/**
 * Font family selector. Registers `@tiptap/extension-text-style`'s
 * `FontFamily` extension (see src/extensions/index.ts) — previously
 * unavailable at any layer, now exposed as a thin EditorApi wrapper.
 */
export function FontFamilyDropdown({ api, size = 'md' }: FontFamilyDropdownProps) {
  const current = api?.getFontFamily() ?? null
  const active = FONT_FAMILIES.find((option) => option.value === current)
  const triggerLabel = active?.label ?? 'Font'

  return (
    <ToolbarDropdown
      icon={Type}
      label="Font family"
      triggerLabel={triggerLabel}
      size={size}
      disabled={!api}
      onCloseAutoFocus={() => api?.focus()}
      items={FONT_FAMILIES.map((option) => ({
        id: option.value ?? 'default',
        label: option.label,
        isActive: current === option.value,
        onSelect: () => {
          if (!api) return
          if (option.value) api.setFontFamily(option.value)
          else api.unsetFontFamily()
        },
      }))}
    />
  )
}
