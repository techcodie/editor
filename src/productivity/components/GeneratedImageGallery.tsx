import { ImageDown, RefreshCw, Replace } from 'lucide-react'
import type { GeneratedImage, ImageInsertionMode } from '../types/productivity'

interface GeneratedImageGalleryProps {
  images: GeneratedImage[]
  canReplace: boolean
  onInsert: (image: GeneratedImage, mode: ImageInsertionMode) => void
  onRegenerate: (prompt: string) => void
}

export function GeneratedImageGallery({ images, canReplace, onInsert, onRegenerate }: GeneratedImageGalleryProps) {
  if (images.length === 0) {
    return <div className="m-4 rounded-md border border-dashed border-neutral-300 px-5 py-10 text-center text-xs text-neutral-500">Generated previews will appear here.</div>
  }
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" aria-label="Generated image history">
      {images.map((image) => (
        <article key={image.id} className="overflow-hidden rounded-md border border-neutral-200 bg-white shadow-sm">
          <img src={image.dataUrl} alt={image.prompt} className="aspect-[8/5] w-full object-cover" />
          <div className="p-2.5">
            <p className="line-clamp-2 min-h-8 text-[11px] leading-4 text-neutral-600">{image.prompt}</p>
            <div className="mt-2 flex gap-1">
              <button type="button" onClick={() => onInsert(image, 'insert')} aria-label={`Insert generated image: ${image.prompt}`} title="Insert image" className="flex h-8 flex-1 items-center justify-center gap-1 rounded-md bg-neutral-900 text-[10px] font-semibold text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><ImageDown size={13} aria-hidden />Insert</button>
              <button type="button" onClick={() => onInsert(image, 'replace')} disabled={!canReplace} aria-label={`Replace selection with generated image: ${image.prompt}`} title="Replace selection" className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-900 disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><Replace size={13} aria-hidden /></button>
              <button type="button" onClick={() => onRegenerate(image.prompt)} aria-label={`Regenerate image: ${image.prompt}`} title="Generate again" className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><RefreshCw size={13} aria-hidden /></button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
