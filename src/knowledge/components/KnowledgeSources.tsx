import { useState } from 'react'
import { BookOpen, Plus } from 'lucide-react'
import { SourceCard } from './SourceCard'
import { UploadDialog } from './UploadDialog'
import { useKnowledgeSources } from '../hooks/useKnowledgeSources'

export function KnowledgeSources() {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const { sources, addFiles, removeSource } = useKnowledgeSources()
  const uploadedSources = sources.filter((source) => source.status === 'uploaded')

  return (
    <section
      aria-labelledby="knowledge-sources-title"
      className="shrink-0 border-t border-neutral-200 bg-white"
    >
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <BookOpen size={15} strokeWidth={1.9} className="shrink-0 text-neutral-500" aria-hidden />
          <h3 id="knowledge-sources-title" className="text-xs font-semibold text-neutral-900">
            Knowledge Sources
          </h3>
          <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
            {sources.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
        >
          <Plus size={13} strokeWidth={2} aria-hidden />
          Add Source
        </button>
      </header>

      <div className="px-3 pb-3">
        <SourceCard source={sources[0]} />

        {uploadedSources.length === 0 ? (
          <div className="mt-2 flex items-start gap-3 rounded-lg border border-dashed border-neutral-200 bg-neutral-50/60 px-3 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-neutral-600 shadow-sm ring-1 ring-neutral-200">
              <BookOpen size={15} strokeWidth={1.8} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-semibold text-neutral-800">Add more knowledge</p>
              <p className="mt-0.5 text-[11px] leading-4 text-neutral-500">
                Upload policies, contracts, reports, or notes to extend the AI&apos;s context.
              </p>
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-md bg-white px-2.5 text-[11px] font-semibold text-neutral-700 shadow-sm ring-1 ring-inset ring-neutral-200 transition-[background-color,box-shadow,transform] hover:bg-neutral-50 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
              >
                <Plus size={12} strokeWidth={2} aria-hidden />
                Add Source
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2 max-h-44 space-y-2 overflow-y-auto pr-0.5">
            {uploadedSources.map((source) => (
              <SourceCard key={source.id} source={source} onRemove={removeSource} />
            ))}
          </div>
        )}
      </div>

      <UploadDialog
        isOpen={isUploadOpen}
        onAddFiles={addFiles}
        onClose={() => setIsUploadOpen(false)}
      />
    </section>
  )
}
