import type { DocumentModel } from '../types/documentModel'
import type { LayoutBlock } from '../types/layout'

const BLOCK_COLOR: Record<LayoutBlock['type'], string> = {
  heading: 'border-indigo-500 bg-indigo-50/70 text-indigo-950',
  paragraph: 'border-sky-400 bg-sky-50/60 text-sky-950',
  list: 'border-violet-400 bg-violet-50/60 text-violet-950',
  table: 'border-amber-500 bg-amber-50/70 text-amber-950',
  image: 'border-emerald-500 bg-emerald-50/70 text-emerald-950',
  caption: 'border-cyan-500 bg-cyan-50/70 text-cyan-950',
  header: 'border-neutral-400 bg-neutral-100/80 text-neutral-700',
  footer: 'border-neutral-400 bg-neutral-100/80 text-neutral-700',
}

export function LayoutViewer({ model }: { model: DocumentModel }) {
  return (
    <section className="h-full overflow-y-auto overscroll-contain bg-neutral-100 p-4 sm:p-6" aria-label="Recognized document structure">
      <div className="mx-auto flex max-w-[44rem] flex-col gap-5">
        {model.pages.map((page) => (
          <article
            key={page.pageNumber}
            className="relative aspect-[8.5/11] w-full overflow-hidden rounded-md border border-neutral-200 bg-white shadow-[0_12px_30px_-20px_rgba(0,0,0,0.35)]"
            aria-label={`Page ${page.pageNumber}, ${page.blocks.length} recognized blocks`}
          >
            <span className="absolute right-2 top-2 z-10 rounded bg-neutral-900/75 px-1.5 py-0.5 text-[9px] font-semibold text-white">
              {page.pageNumber}
            </span>
            {page.blocks.map((block) => {
              const box = block.boundingBox
              if (!box) return null
              return (
                <div
                  key={block.id}
                  title={`${block.type}: ${block.text}`}
                  className={`absolute overflow-hidden border px-1 py-0.5 text-[8px] leading-3 ${BLOCK_COLOR[block.type]}`}
                  style={{
                    left: `${(box.x / box.pageWidth) * 100}%`,
                    top: `${(box.y / box.pageHeight) * 100}%`,
                    width: `${Math.max(2, (box.width / box.pageWidth) * 100)}%`,
                    height: `${Math.max(1.5, (box.height / box.pageHeight) * 100)}%`,
                  }}
                >
                  <span className="font-semibold uppercase">{block.type}</span>{' '}
                  {block.text}
                </div>
              )
            })}
          </article>
        ))}
      </div>
    </section>
  )
}
