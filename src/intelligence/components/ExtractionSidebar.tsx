import { FileSearch, Image, List, Table2, Text, Type } from 'lucide-react'
import type { DocumentModel } from '../types/documentModel'
import { MetadataPanel } from './MetadataPanel'

export function ExtractionSidebar({ model }: { model: DocumentModel }) {
  const stats = [
    { icon: Text, label: 'Paragraphs', value: model.paragraphs.length },
    { icon: Type, label: 'Headings', value: model.layout.headings },
    { icon: List, label: 'Lists', value: model.layout.lists },
    { icon: Table2, label: 'Tables', value: model.tables.length },
    { icon: Image, label: 'Images', value: model.images.length },
  ]
  return (
    <aside className="w-full shrink-0 border-t border-neutral-200 bg-white p-4 lg:w-64 lg:border-l lg:border-t-0" aria-label="Extraction summary">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
          <FileSearch size={15} aria-hidden />
        </span>
        <div>
          <h3 className="text-xs font-semibold text-neutral-950">Extraction</h3>
          <p className="text-[10px] text-neutral-500">{model.pages.length} page{model.pages.length === 1 ? '' : 's'}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-1">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2 rounded-md bg-neutral-50 px-2.5 py-2">
            <Icon size={13} className="text-neutral-400" aria-hidden />
            <span className="text-[11px] text-neutral-600">{label}</span>
            <strong className="ml-auto text-[11px] text-neutral-950">{value}</strong>
          </div>
        ))}
      </div>
      <div className="my-4 border-t border-neutral-200" />
      <MetadataPanel metadata={model.metadata} />
      <div className="mt-4 rounded-md border border-neutral-200 p-3">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-medium text-neutral-500">OCR confidence</span>
          <strong className="text-neutral-900">{Math.round(model.confidence)}%</strong>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-neutral-200">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${model.confidence}%` }} />
        </div>
        <p className="mt-3 text-[10px] leading-4 text-neutral-500">
          {model.searchIndex.entries.length.toLocaleString()} terms indexed locally for AI and search.
        </p>
      </div>
    </aside>
  )
}
