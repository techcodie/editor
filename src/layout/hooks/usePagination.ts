import { useCallback, useEffect, useState } from 'react'
import type { EditorApi } from '../../lib/editor-api'
import type { PageLayout } from '../types/layout'
import type { PaginationSnapshot } from '../types/page'

const EMPTY_SNAPSHOT: PaginationSnapshot = {
  pages: [{
    id: 'page-1',
    index: 0,
    number: 1,
    top: 0,
    height: 0,
    contentTop: 0,
    contentHeight: 0,
  }],
  breaks: [],
  currentPage: 1,
  pageWidth: 0,
  pageHeight: 0,
  pageGap: 24,
}

export function usePagination(api: EditorApi | null, layout: PageLayout) {
  const [snapshot, setSnapshot] = useState<PaginationSnapshot>(EMPTY_SNAPSHOT)

  useEffect(() => {
    if (!api) return
    api.setPageLayout(layout)
  }, [api, layout])

  useEffect(() => () => api?.setPageLayout(null), [api])

  useEffect(() => {
    if (!api) return
    return api.subscribePagination(setSnapshot)
  }, [api])

  const insertPageBreak = useCallback(() => {
    if (!api) return false
    api.setPageLayout(layout)
    return api.insertPageBreak()
  }, [api, layout])
  const removePageBreak = useCallback(
    (pageBreakId: string) => api?.removePageBreak(pageBreakId) ?? false,
    [api],
  )

  return { snapshot, insertPageBreak, removePageBreak }
}
