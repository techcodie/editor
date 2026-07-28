import { useMemo, type ReactNode } from 'react'
import { FileText, Link2, Network, Tags } from 'lucide-react'
import { useKnowledgeGraph } from '../hooks/useKnowledgeGraph'
import type { KnowledgeGraph } from '../types/knowledgeGraph'

const TYPE_STYLE = {
  document: 'border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200',
  'knowledge-source': 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  section: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200',
  clause: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  entity: 'border-neutral-200 bg-white text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300',
  reference: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200',
} as const

export function KnowledgeGraphView({ graph, selectedDocumentId, onSelectDocument }: { graph: KnowledgeGraph; selectedDocumentId?: string; onSelectDocument: (documentId: string) => void }) {
  const view = useKnowledgeGraph(graph, selectedDocumentId)
  const nodesById = useMemo(
    () => new Map(graph.nodes.map((node) => [node.id, node])),
    [graph.nodes],
  )
  const documentNodes = view.visibleNodes.filter((node) => node.type === 'document' || node.type === 'knowledge-source')
  const conceptNodes = view.visibleNodes.filter((node) => node.type !== 'document' && node.type !== 'knowledge-source').slice(0, 80)
  return (
    <section className="min-h-0 flex-1 overflow-y-auto" aria-labelledby="knowledge-graph-title">
      <div className="border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
        <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"><Network size={15} aria-hidden /></span><div><h3 id="knowledge-graph-title" className="text-xs font-semibold text-neutral-950 dark:text-neutral-100">Knowledge graph</h3><p className="text-[10px] text-neutral-500 dark:text-neutral-400">Document relationships and shared concepts</p></div></div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Metric icon={<FileText size={12} aria-hidden />} value={view.documentCount} label="Documents" />
          <Metric icon={<Tags size={12} aria-hidden />} value={view.entityCount} label="Entities" />
          <Metric icon={<Link2 size={12} aria-hidden />} value={view.relationshipCount} label="Links" />
        </div>
      </div>
      {documentNodes.length === 0 ? (
        <div className="px-8 py-14 text-center text-xs text-neutral-500">Index documents to build the knowledge graph.</div>
      ) : (
        <div className="space-y-5 p-4">
          <div>
            <p className="mb-2 text-[9px] font-semibold uppercase text-neutral-400">Documents</p>
            <div className="grid grid-cols-2 gap-2">
              {documentNodes.map((node) => <button key={node.id} type="button" onClick={() => node.documentId && onSelectDocument(node.documentId)} className={`min-h-14 rounded-md border p-2.5 text-left text-[10px] font-semibold leading-4 transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 ${TYPE_STYLE[node.type]}`}><span className="line-clamp-2">{node.label}</span></button>)}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[9px] font-semibold uppercase text-neutral-400">Connected concepts</p>
            <div className="flex flex-wrap gap-1.5">
              {conceptNodes.map((node) => <span key={node.id} title={node.type} className={`max-w-full truncate rounded-md border px-2 py-1 text-[9px] ${TYPE_STYLE[node.type]}`}>{node.label}</span>)}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[9px] font-semibold uppercase text-neutral-400">Relationships</p>
            <div className="space-y-1.5">
              {view.visibleEdges.filter((edge) => edge.type === 'related-to' || edge.type === 'shares-topic').slice(0, 30).map((edge) => {
                const source = nodesById.get(edge.source)
                const target = nodesById.get(edge.target)
                return <div key={edge.id} className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-[9px] text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"><span className="min-w-0 flex-1 truncate font-medium">{source?.label}</span><span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 capitalize text-neutral-400 dark:bg-neutral-800">{edge.type.replaceAll('-', ' ')}</span><span className="min-w-0 flex-1 truncate text-right font-medium">{target?.label}</span></div>
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function Metric({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return <div className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-2 dark:border-neutral-800 dark:bg-neutral-900"><div className="flex items-center gap-1.5 text-neutral-400">{icon}<span className="text-[9px]">{label}</span></div><p className="mt-1 text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{value}</p></div>
}
