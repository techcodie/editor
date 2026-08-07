import { useEffect, useState } from 'react'
import type { EditorApi } from '../../lib/editor-api'
import type { PaginationSnapshot } from '../../layout/types/page'

export interface StatusBarProps {
  api: EditorApi | null
  pagination: PaginationSnapshot
}

interface DocumentStats {
  words: number
  characters: number
}

const EMPTY_STATS: DocumentStats = { words: 0, characters: 0 }

function countStats(text: string): DocumentStats {
  const trimmed = text.trim()
  return { words: trimmed ? trimmed.split(/\s+/).length : 0, characters: text.length }
}

/**
 * Word/character count, sourced from the same `getDocumentText()` already
 * used by Search and Ask Document. Recomputation is debounced off
 * `subscribeDocumentChanges` (content changes only, not every selection
 * move) so a 100+ page document isn't re-serialized on every keystroke.
 */
function useDocumentStats(api: EditorApi | null): DocumentStats {
  const [stats, setStats] = useState<DocumentStats>(EMPTY_STATS)

  useEffect(() => {
    if (!api) {
      setStats(EMPTY_STATS)
      return
    }
    let timeout: ReturnType<typeof setTimeout> | null = null
    const recompute = () => setStats(countStats(api.getDocumentText()))
    recompute()
    const unsubscribe = api.subscribeDocumentChanges((change) => {
      if (!change.docChanged) return
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(recompute, 400)
    })
    return () => {
      if (timeout) clearTimeout(timeout)
      unsubscribe()
    }
  }, [api])

  return stats
}

export function StatusBar({ api, pagination }: StatusBarProps) {
  const stats = useDocumentStats(api)

  return (
    <div
      className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 text-[11px] font-medium tabular-nums text-neutral-400"
      role="status"
    >
      <span>
        {stats.words.toLocaleString()} word{stats.words === 1 ? '' : 's'} · {stats.characters.toLocaleString()}{' '}
        character{stats.characters === 1 ? '' : 's'}
      </span>
      <span>
        Page {pagination.currentPage} of {pagination.pages.length}
      </span>
    </div>
  )
}
