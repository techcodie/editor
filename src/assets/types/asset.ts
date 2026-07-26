export type AssetType =
  | 'stamp'
  | 'icon'
  | 'logo'
  | 'qr-code'
  | 'signature'
  | 'badge'
  | 'shape'
  | 'watermark'

export type AssetCategory =
  | 'workflow'
  | 'finance'
  | 'legal'
  | 'engineering'
  | 'healthcare'
  | 'hr'
  | 'logistics'
  | 'security'
  | 'date'
  | 'signature'

export type AssetRenderer = 'stamp'

export interface Asset<Metadata extends Record<string, unknown> = Record<string, unknown>> {
  id: string
  category: AssetCategory
  type: AssetType
  title: string
  description: string
  tags: readonly string[]
  thumbnail?: string
  renderer: AssetRenderer
  metadata: Metadata
}

export interface AssetCategoryDefinition {
  id: AssetCategory
  label: string
  description: string
}
