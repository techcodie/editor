import { FileText } from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import type { EditorApi } from '../../lib/editor-api'
import type { PaginationSnapshot } from '../../layout/types/page'

export interface DocumentPropertiesDialogProps {
  isOpen: boolean
  onClose: () => void
  api: EditorApi | null
  pagination: PaginationSnapshot
}

function countStats(text: string) {
  const trimmed = text.trim()
  const words = trimmed ? trimmed.split(/\s+/).length : 0
  const paragraphs = trimmed ? trimmed.split(/\n{2,}|\n/).filter((line) => line.trim()).length : 0
  return { words, characters: text.length, paragraphs }
}

function readingTime(words: number): string {
  const minutes = Math.max(1, Math.round(words / 200))
  return `${minutes} min${minutes === 1 ? '' : 's'}`
}

function inferredTitle(text: string): string {
  const firstLine = text
    .split('\n')
    .map((line) => line.replace(/^#+\s*/, '').trim())
    .find(Boolean)
  return firstLine?.slice(0, 80) || 'Untitled document'
}

const ROW_CLASS = 'flex items-center justify-between gap-3 py-2 text-[13px]'

/**
 * Read-only document properties, computed from the same `getDocumentText()`
 * and pagination snapshot the status bar and Export dialog already use — no
 * new Editor API surface. There is no persisted document name to rename
 * (storage is host-owned and not part of this milestone, see
 * CODEX_CONTEXT.md's Intentionally Deferred list), so the title shown here
 * is inferred the same way Export already infers a filename.
 */
export function DocumentPropertiesDialog({ isOpen, onClose, api, pagination }: DocumentPropertiesDialogProps) {
  const text = api?.getDocumentText() ?? ''
  const stats = countStats(text)

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Document properties" icon={FileText} maxWidthClassName="max-w-[26rem]">
      <dl className="divide-y divide-neutral-100">
        <div className={ROW_CLASS}>
          <dt className="text-neutral-500">Title</dt>
          <dd className="truncate font-medium text-neutral-900">{inferredTitle(text)}</dd>
        </div>
        <div className={ROW_CLASS}>
          <dt className="text-neutral-500">Words</dt>
          <dd className="font-medium tabular-nums text-neutral-900">{stats.words.toLocaleString()}</dd>
        </div>
        <div className={ROW_CLASS}>
          <dt className="text-neutral-500">Characters</dt>
          <dd className="font-medium tabular-nums text-neutral-900">{stats.characters.toLocaleString()}</dd>
        </div>
        <div className={ROW_CLASS}>
          <dt className="text-neutral-500">Paragraphs</dt>
          <dd className="font-medium tabular-nums text-neutral-900">{stats.paragraphs.toLocaleString()}</dd>
        </div>
        <div className={ROW_CLASS}>
          <dt className="text-neutral-500">Pages</dt>
          <dd className="font-medium tabular-nums text-neutral-900">{pagination.pages.length}</dd>
        </div>
        <div className={ROW_CLASS}>
          <dt className="text-neutral-500">Estimated reading time</dt>
          <dd className="font-medium tabular-nums text-neutral-900">{readingTime(stats.words)}</dd>
        </div>
      </dl>
      <p className="text-[11px] leading-5 text-neutral-400">
        The title above is inferred from your document's first heading or line. Renaming and a
        durable document name require a host-provided storage integration, which this milestone
        does not include.
      </p>
    </Dialog>
  )
}
