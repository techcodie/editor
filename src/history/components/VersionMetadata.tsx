import { Archive, FileText, UserRound } from 'lucide-react'
import type { Version } from '../types/version'

interface VersionMetadataProps { version: Version }

function formatBytes(bytes: number): string {
  if (bytes < 1_024) return `${bytes} B`
  return `${(bytes / 1_024).toFixed(1)} KB`
}

export function VersionMetadata({ version }: VersionMetadataProps) {
  const compression = version.snapshot.uncompressedLength > 0
    ? Math.max(0, Math.round((1 - version.snapshot.byteLength / version.snapshot.uncompressedLength) * 100))
    : 0
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-neutral-100 pt-3 text-[10px]">
      <div><dt className="flex items-center gap-1 text-neutral-400"><UserRound size={11} aria-hidden />Author</dt><dd className="mt-0.5 truncate font-medium text-neutral-700">{version.author.name}</dd></div>
      <div><dt className="flex items-center gap-1 text-neutral-400"><FileText size={11} aria-hidden />Document</dt><dd className="mt-0.5 font-medium text-neutral-700">{version.metadata.wordCount.toLocaleString()} words</dd></div>
      <div><dt className="flex items-center gap-1 text-neutral-400"><Archive size={11} aria-hidden />Snapshot</dt><dd className="mt-0.5 font-medium text-neutral-700">{formatBytes(version.metadata.snapshotBytes)} · {version.snapshot.encoding}</dd></div>
      <div><dt className="text-neutral-400">Compression</dt><dd className="mt-0.5 font-medium text-neutral-700">{version.snapshot.compression === 'gzip' ? `${compression}% saved` : 'Portable'}</dd></div>
      <div className="col-span-2"><dt className="text-neutral-400">Document hash</dt><dd className="mt-0.5 truncate font-mono text-[9px] text-neutral-600">{version.documentHash}</dd></div>
      {version.metadata.reason && <div className="col-span-2"><dt className="text-neutral-400">Reason</dt><dd className="mt-0.5 leading-4 text-neutral-700">{version.metadata.reason}</dd></div>}
      {version.metadata.comments && <div className="col-span-2"><dt className="text-neutral-400">Comments</dt><dd className="mt-0.5 leading-4 text-neutral-700">{version.metadata.comments}</dd></div>}
    </dl>
  )
}
