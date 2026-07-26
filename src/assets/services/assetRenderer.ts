import type { EditorAssetInsertion } from '../../lib/editor-api'
import type { Asset } from '../types/asset'
import type { StampMetadata } from '../types/stamp'

const DEFAULT_ASSET_WIDTH = 200
const DEFAULT_ASSET_HEIGHT = 88

export function isStampMetadata(metadata: Record<string, unknown>): metadata is StampMetadata {
  return (
    typeof metadata.text === 'string' &&
    typeof metadata.style === 'string' &&
    typeof metadata.color === 'string' &&
    typeof metadata.background === 'string' &&
    typeof metadata.border === 'string'
  )
}

export function createAssetInsertion(asset: Asset): EditorAssetInsertion | null {
  if (asset.renderer !== 'stamp' || !isStampMetadata(asset.metadata)) return null

  return {
    assetId: asset.id,
    type: asset.type,
    category: asset.category,
    title: asset.title,
    renderer: asset.renderer,
    renderData: { ...asset.metadata },
    width:
      typeof asset.metadata.width === 'number'
        ? asset.metadata.width
        : DEFAULT_ASSET_WIDTH,
    height:
      typeof asset.metadata.height === 'number'
        ? asset.metadata.height
        : DEFAULT_ASSET_HEIGHT,
    rotation:
      typeof asset.metadata.rotation === 'number' ? asset.metadata.rotation : 0,
  }
}
