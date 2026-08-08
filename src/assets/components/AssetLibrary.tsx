import { useMemo, useState } from 'react'
import { AssetGrid } from './AssetGrid'
import { AssetSearch } from './AssetSearch'
import { AssetSidebar, type AssetSection } from './AssetSidebar'
import {
  ASSET_CATEGORIES,
  getAssetById,
  getAssets,
  searchAssets,
} from '../services/assetRegistry'
import type { Asset } from '../types/asset'

interface AssetLibraryProps {
  recentAssetIds: readonly string[]
  onSelectAsset: (asset: Asset) => void
}

function getSectionTitle(section: AssetSection): string {
  if (section === 'all') return 'All assets'
  if (section === 'favorites') return 'Favorites'
  if (section === 'recent') return 'Recent'
  return ASSET_CATEGORIES.find((category) => category.id === section)?.label ?? 'Assets'
}

export function AssetLibrary({
  recentAssetIds,
  onSelectAsset,
}: AssetLibraryProps) {
  const [query, setQuery] = useState('')
  const [activeSection, setActiveSection] = useState<AssetSection>('all')
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set())

  const sectionAssets = useMemo(() => {
    if (activeSection === 'favorites') {
      return getAssets().filter((asset) => favoriteIds.has(asset.id))
    }
    if (activeSection === 'recent') {
      return recentAssetIds
        .map((id) => getAssetById(id))
        .filter((asset): asset is Asset => Boolean(asset))
    }
    if (activeSection === 'all') return getAssets()
    return getAssets().filter((asset) => asset.category === activeSection)
  }, [activeSection, favoriteIds, recentAssetIds])

  const visibleAssets = useMemo(
    () => searchAssets(query, sectionAssets),
    [query, sectionAssets],
  )

  const toggleFavorite = (assetId: string) => {
    setFavoriteIds((current) => {
      const next = new Set(current)
      if (next.has(assetId)) next.delete(assetId)
      else next.add(assetId)
      return next
    })
  }

  const sectionTitle = getSectionTitle(activeSection)
  const emptyTitle = query ? 'No matching assets' : `No ${sectionTitle.toLocaleLowerCase()}`
  const emptyDescription = query
    ? 'Try a broader title, tag, or category.'
    : activeSection === 'favorites'
      ? 'Favorite useful assets to keep them close.'
      : activeSection === 'recent'
        ? 'Assets appear here after they are placed.'
        : 'This collection is currently empty.'

  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-label="Asset library">
      <div className="shrink-0 px-3 pt-3">
        <AssetSearch value={query} onChange={setQuery} />
      </div>
      {/* Below the `lg` breakpoint AssetSidebar already renders as a
          horizontal scrollable row — this popup never reaches `lg` width,
          so it always uses that mode, no extra wrapper needed. */}
      <AssetSidebar
        activeSection={activeSection}
        favoriteCount={favoriteIds.size}
        recentCount={recentAssetIds.length}
        onSelect={setActiveSection}
      />
      <section aria-label={`${sectionTitle} assets`} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 pt-3">
        <div className="mb-3 flex items-baseline justify-between gap-3 px-0.5">
          <h3 className="text-xs font-semibold text-neutral-900">{sectionTitle}</h3>
          <span className="text-[10px] tabular-nums text-neutral-400">
            {visibleAssets.length} {visibleAssets.length === 1 ? 'asset' : 'assets'}
          </span>
        </div>
        <AssetGrid
          assets={visibleAssets}
          favoriteIds={favoriteIds}
          onSelect={onSelectAsset}
          onToggleFavorite={toggleFavorite}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      </section>
    </div>
  )
}
