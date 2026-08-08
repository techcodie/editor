import { PackageOpen } from 'lucide-react'
import { AssetCard } from './AssetCard'
import type { Asset } from '../types/asset'

interface AssetGridProps {
  assets: readonly Asset[]
  favoriteIds: ReadonlySet<string>
  onSelect: (asset: Asset) => void
  onToggleFavorite: (assetId: string) => void
  emptyTitle: string
  emptyDescription: string
}

export function AssetGrid({
  assets,
  favoriteIds,
  onSelect,
  onToggleFavorite,
  emptyTitle,
  emptyDescription,
}: AssetGridProps) {
  if (assets.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-400">
          <PackageOpen size={18} strokeWidth={1.7} aria-hidden />
        </span>
        <p className="text-sm font-semibold text-neutral-900">{emptyTitle}</p>
        <p className="mt-1 max-w-56 text-xs leading-5 text-neutral-500">
          {emptyDescription}
        </p>
      </div>
    )
  }

  return (
    // Two columns fit this popup's fixed ~400px width regardless of the
    // browser's own viewport size — no viewport-width breakpoint applies
    // here, since the popup's rendered width never changes with it (see
    // AssetLibrary.tsx's note on the sidebar for the same reasoning).
    <div className="grid grid-cols-2 gap-2.5">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          isFavorite={favoriteIds.has(asset.id)}
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  )
}
