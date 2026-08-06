import { Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, Pilcrow } from 'lucide-react'
import type { EditorApi, HeadingLevel } from '../../lib/editor-api'
import { ToolbarDropdown } from './ToolbarDropdown'
import type { ToolbarButtonSize } from './ToolbarButton'

const HEADING_LEVELS: HeadingLevel[] = [1, 2, 3, 4, 5, 6]
const HEADING_ICONS = [Heading1, Heading2, Heading3, Heading4, Heading5, Heading6]

export interface ParagraphStyleDropdownProps {
  api: EditorApi | null
  size?: ToolbarButtonSize
}

/**
 * Replaces the old Paragraph/H1/H2/H3 button quartet with one "paragraph
 * style" menu covering Normal + Heading 1-6 — the full range StarterKit's
 * Heading extension already renders (see HeadingLevel in lib/editor-api.ts).
 */
export function ParagraphStyleDropdown({ api, size = 'md' }: ParagraphStyleDropdownProps) {
  const activeHeading = api ? HEADING_LEVELS.find((level) => api.isHeading(level)) : undefined
  const triggerLabel = activeHeading ? `Heading ${activeHeading}` : 'Normal'

  return (
    <ToolbarDropdown
      icon={Pilcrow}
      label="Paragraph style"
      triggerLabel={triggerLabel}
      size={size}
      disabled={!api}
      onCloseAutoFocus={() => api?.focus()}
      items={[
        {
          id: 'paragraph',
          icon: Pilcrow,
          label: 'Normal',
          isActive: api ? api.isParagraph() : false,
          onSelect: () => api?.setParagraph(),
        },
        ...HEADING_LEVELS.map((level) => ({
          id: `heading${level}`,
          icon: HEADING_ICONS[level - 1],
          label: `Heading ${level}`,
          isActive: api ? api.isHeading(level) : false,
          onSelect: () => api?.toggleHeading(level),
        })),
      ]}
    />
  )
}
