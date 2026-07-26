import { useEffect, useMemo, useRef, useState } from 'react'
import { Layers3, X } from 'lucide-react'
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
  isOpen: boolean
  recentAssetIds: readonly string[]
  onClose: () => void
  onSelectAsset: (asset: Asset) => void
}

function getSectionTitle(section: AssetSection): string {
  if (section === 'all') return 'All assets'
  if (section === 'favorites') return 'Favorites'
  if (section === 'recent') return 'Recent'
  return ASSET_CATEGORIES.find((category) => category.id === section)?.label ?? 'Assets'
}

export function AssetLibrary({
  isOpen,
  recentAssetIds,
  onClose,
  onSelectAsset,
}: AssetLibraryProps) {
  const [query, setQuery] = useState('')
  const [activeSection, setActiveSection] = useState<AssetSection>('all')
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set())
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 120)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

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

  if (!isOpen) return null

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
    <>
      <button
        type="button"
        aria-label="Close asset library"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] lg:hidden"
      />
      <aside
        id="asset-library-panel"
        role="dialog"
        aria-labelledby="asset-library-title"
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-hidden border-l border-neutral-200 bg-white shadow-[var(--document-editor-shadow-overlay)] [animation:asset-library-in_180ms_ease-out] sm:max-w-[38rem] lg:sticky lg:top-6 lg:z-30 lg:h-[calc(100vh-3rem)] lg:w-[27rem] lg:max-w-none lg:rounded-lg lg:border xl:w-[30rem]"
      >
        <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700">
            <Layers3 size={17} strokeWidth={1.8} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="asset-library-title" className="text-sm font-semibold text-neutral-950">
              Asset library
            </h2>
            <p className="mt-0.5 text-[11px] text-neutral-500">Reusable document assets</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close asset library"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
          >
            <X size={16} strokeWidth={2} aria-hidden />
          </button>
        </header>

        <div className="px-4 py-3">
          <AssetSearch ref={searchRef} value={query} onChange={setQuery} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <AssetSidebar
            activeSection={activeSection}
            favoriteCount={favoriteIds.size}
            recentCount={recentAssetIds.length}
            onSelect={setActiveSection}
          />
          <section aria-label={`${sectionTitle} assets`} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-5 pt-3">
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
      </aside>
    </>
  )
}
