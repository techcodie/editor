import { CaseSensitive } from 'lucide-react'
import type { EditorApi } from '../../lib/editor-api'
import { ToolbarDropdown } from './ToolbarDropdown'
import type { ToolbarButtonSize } from './ToolbarButton'

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72]

export interface FontSizeDropdownProps {
  api: EditorApi | null
  size?: ToolbarButtonSize
}

/**
 * Font size selector. Registers `@tiptap/extension-text-style`'s `FontSize`
 * extension (see src/extensions/index.ts) — previously unavailable at any
 * layer, now exposed as a thin EditorApi wrapper.
 */
export function FontSizeDropdown({ api, size = 'md' }: FontSizeDropdownProps) {
  const current = api?.getFontSize() ?? null
  const currentPx = current ? Number.parseInt(current, 10) : null
  const triggerLabel = currentPx ? String(currentPx) : 'Size'

  return (
    <ToolbarDropdown
      icon={CaseSensitive}
      label="Font size"
      triggerLabel={triggerLabel}
      size={size}
      disabled={!api}
      onCloseAutoFocus={() => api?.focus()}
      items={[
        {
          id: 'default',
          label: 'Default',
          isActive: current === null,
          onSelect: () => api?.unsetFontSize(),
        },
        ...FONT_SIZES.map((px) => ({
          id: `size-${px}`,
          label: String(px),
          isActive: currentPx === px,
          onSelect: () => api?.setFontSize(`${px}px`),
        })),
      ]}
    />
  )
}
