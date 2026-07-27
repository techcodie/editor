import { FileText } from 'lucide-react'
import { cn } from '../../lib/cn'

interface PageNavigatorProps {
  pages: string[]
  currentPage: number
  onSelect: (page: number) => void
}

export function PageNavigator({ pages, currentPage, onSelect }: PageNavigatorProps) {
  return (
    <aside className="hidden w-48 shrink-0 overflow-y-auto border-r border-neutral-200 bg-neutral-100/70 p-3 sm:block" aria-label="Page navigation">
      <h2 className="px-1 text-[11px] font-semibold text-neutral-700">Pages</h2>
      <div className="mt-2 space-y-2">
        {pages.map((page, index) => (
          <button
            key={`page-thumbnail-${index + 1}`}
            type="button"
            onClick={() => onSelect(index + 1)}
            aria-current={currentPage === index + 1 ? 'page' : undefined}
            className={cn(
              'w-full rounded-md border bg-white p-2 text-left shadow-sm transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35',
              currentPage === index + 1 ? 'border-indigo-400 ring-2 ring-indigo-500/15' : 'border-neutral-200 hover:border-neutral-300',
            )}
          >
            <span className="flex h-20 items-center justify-center rounded border border-neutral-100 bg-neutral-50 text-neutral-300">
              <FileText size={20} strokeWidth={1.5} aria-hidden />
            </span>
            <span className="mt-1.5 block text-center text-[10px] font-medium text-neutral-500">{index + 1}</span>
            <span className="sr-only">{page.slice(0, 60)}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
