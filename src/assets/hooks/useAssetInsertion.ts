import { useCallback, useState } from 'react'
import type { EditorApi } from '../../lib/editor-api'
import { createAssetInsertion } from '../services/assetRenderer'
import type { Asset } from '../types/asset'

interface UseAssetInsertionOptions {
  api: EditorApi | null
  onInserted?: (asset: Asset) => void
}

export function useAssetInsertion({ api, onInserted }: UseAssetInsertionOptions) {
  const [pendingAsset, setPendingAsset] = useState<Asset | null>(null)

  const beginPlacement = useCallback((asset: Asset) => {
    setPendingAsset(asset)
  }, [])

  const cancelPlacement = useCallback(() => {
    setPendingAsset(null)
  }, [])

  const insertPendingAsset = useCallback(() => {
    if (!api || !pendingAsset) return false
    const insertion = createAssetInsertion(pendingAsset)
    if (!insertion || !api.insertAsset(insertion)) return false

    onInserted?.(pendingAsset)
    setPendingAsset(null)
    return true
  }, [api, onInserted, pendingAsset])

  return {
    pendingAsset,
    beginPlacement,
    cancelPlacement,
    insertPendingAsset,
  }
}
