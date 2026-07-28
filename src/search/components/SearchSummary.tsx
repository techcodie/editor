import { Network, Search } from 'lucide-react'
import type { KnowledgeGraph } from '../types/knowledgeGraph'
import type { SearchResponse } from '../types/search'

export function SearchSummary({ response, graph }: { response: SearchResponse | null; graph: KnowledgeGraph }) {
  return (
    <div className="grid grid-cols-2 border-b border-neutral-200 bg-neutral-50/70 dark:border-neutral-800 dark:bg-neutral-900/70">
      <div className="flex items-center gap-2 border-r border-neutral-200 px-4 py-2.5 dark:border-neutral-800">
        <Search size={13} className="text-neutral-400" aria-hidden />
        <div><p className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">{response?.total ?? 0} results</p><p className="text-[9px] text-neutral-400">{response ? `${response.durationMs} ms` : 'Ready'}</p></div>
      </div>
      <div className="flex items-center gap-2 px-4 py-2.5">
        <Network size={13} className="text-neutral-400" aria-hidden />
        <div><p className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">{graph.nodes.length} nodes</p><p className="text-[9px] text-neutral-400">{graph.edges.length} relationships</p></div>
      </div>
    </div>
  )
}
