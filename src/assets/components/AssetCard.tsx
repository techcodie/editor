import { Heart, MousePointer2 } from 'lucide-react'
import { AssetPreview } from './AssetPreview'
import type { Asset } from '../types/asset'

interface AssetCardProps {
  asset: Asset
  isFavorite: boolean
  onSelect: (asset: Asset) => void
  onToggleFavorite: (assetId: string) => void
}

export function AssetCard({
  asset,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: AssetCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-lg border border-neutral-200 bg-white transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-neutral-300 hover:shadow-[0_10px_28px_-18px_rgba(20,20,20,0.4)] focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/15">
      <button
        type="button"
        onClick={() => onSelect(asset)}
        aria-label={`Place ${asset.title}`}
        className="block w-full text-left focus-visible:outline-none"
      >
        <span className="flex h-28 items-center justify-center bg-neutral-50/80 px-5 py-4 transition-colors group-hover:bg-neutral-50">
          <AssetPreview asset={asset} className="h-full max-h-20 w-full max-w-[12rem]" />
        </span>
        <span className="flex min-h-[4.5rem] items-start justify-between gap-3 border-t border-neutral-100 px-3 py-2.5">
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-neutral-900">
              {asset.title}
            </span>
            <span className="mt-0.5 line-clamp-2 block text-[11px] leading-4 text-neutral-500">
              {asset.description}
            </span>
          </span>
          <MousePointer2
            size={14}
            strokeWidth={1.9}
            className="mt-0.5 shrink-0 text-neutral-300 transition-colors group-hover:text-neutral-600"
            aria-hidden
          />
        </span>
      </button>
      <button
        type="button"
        onClick={() => onToggleFavorite(asset.id)}
        aria-label={isFavorite ? `Remove ${asset.title} from favorites` : `Add ${asset.title} to favorites`}
        aria-pressed={isFavorite}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 bg-white/90 text-neutral-400 opacity-0 shadow-sm backdrop-blur-sm transition-[opacity,color,background-color] hover:text-rose-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] group-hover:opacity-100 aria-pressed:opacity-100 aria-pressed:text-rose-600"
      >
        <Heart size={14} strokeWidth={2} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden />
      </button>
    </article>
  )
}
