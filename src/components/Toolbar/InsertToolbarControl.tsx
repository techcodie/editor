import { Droplets, FormInput, Minus, Plus, SeparatorHorizontal, Stamp, Table2 } from 'lucide-react'
import type { EditorApi } from '../../lib/editor-api'
import { ToolbarDropdown } from './ToolbarDropdown'
import type { ToolbarButtonSize } from './ToolbarButton'

export interface InsertToolbarControlProps {
  api: EditorApi | null
  hasWatermark: boolean
  canBuildForms: boolean
  onOpenAssetLibrary: () => void
  onOpenWatermark: () => void
  onOpenFormBuilder: () => void
  size?: ToolbarButtonSize
}

/**
 * Groups several existing, previously scattered insert-style actions (table,
 * page break, asset/stamp library, watermark, form field) into one Jodit-style
 * "Insert" menu. Every item calls an EditorApi method or an existing
 * panel-open callback already used elsewhere — no new capability is added.
 */
export function InsertToolbarControl({
  api,
  hasWatermark,
  canBuildForms,
  onOpenAssetLibrary,
  onOpenWatermark,
  onOpenFormBuilder,
  size = 'md',
}: InsertToolbarControlProps) {
  return (
    <ToolbarDropdown
      icon={Plus}
      label="Insert"
      size={size}
      disabled={!api}
      onCloseAutoFocus={() => api?.focus()}
      items={[
        {
          id: 'insert-table',
          icon: Table2,
          label: 'Table',
          onSelect: () => api?.insertTable(),
        },
        {
          id: 'insert-page-break',
          icon: SeparatorHorizontal,
          label: 'Page break',
          onSelect: () => api?.insertPageBreak(),
        },
        {
          id: 'insert-horizontal-rule',
          icon: Minus,
          label: 'Horizontal rule',
          onSelect: () => api?.insertHorizontalRule(),
        },
        {
          id: 'insert-assets',
          icon: Stamp,
          label: 'Assets & stamp library',
          onSelect: onOpenAssetLibrary,
        },
        {
          id: 'insert-watermark',
          icon: Droplets,
          label: 'Watermark',
          isActive: hasWatermark,
          onSelect: onOpenWatermark,
        },
        ...(canBuildForms
          ? [
              {
                id: 'insert-form-field',
                icon: FormInput,
                label: 'Form field',
                onSelect: onOpenFormBuilder,
              },
            ]
          : []),
      ]}
    />
  )
}
