import { Calendar, File, Globe2, UserRound } from 'lucide-react'
import type { DocumentMetadata } from '../types/documentModel'

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export function MetadataPanel({ metadata }: { metadata: DocumentMetadata }) {
  const rows = [
    { icon: File, label: 'File', value: `${metadata.fileType.toUpperCase()} · ${formatBytes(metadata.fileSize)}` },
    { icon: UserRound, label: 'Author', value: metadata.author || 'Not provided' },
    { icon: Globe2, label: 'Language', value: metadata.language.toUpperCase() },
    { icon: Calendar, label: 'Modified', value: metadata.modifiedAt ? new Date(metadata.modifiedAt).toLocaleDateString() : 'Unknown' },
  ]
  return (
    <section aria-labelledby="intelligence-metadata-title">
      <h3 id="intelligence-metadata-title" className="text-[10px] font-semibold uppercase text-neutral-400">Metadata</h3>
      <dl className="mt-2 space-y-2">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-2">
            <Icon size={13} className="mt-0.5 shrink-0 text-neutral-400" aria-hidden />
            <div className="min-w-0">
              <dt className="text-[9px] uppercase text-neutral-400">{label}</dt>
              <dd className="truncate text-[11px] font-medium text-neutral-700" title={value}>{value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  )
}
