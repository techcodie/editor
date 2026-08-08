import type {
  Page,
  PageBreak,
  PaginationBlock,
  PaginationOffset,
} from '../types/page'

interface PaginationInput {
  blocks: PaginationBlock[]
  manualBreaks: { id: string; position: number }[]
  pageHeight: number
  contentHeight: number
  marginTop: number
  pageGap: number
}

export interface PaginationResult {
  pages: Page[]
  breaks: PageBreak[]
  offsets: PaginationOffset[]
}

export function paginateBlocks({
  blocks,
  manualBreaks,
  pageHeight,
  contentHeight,
  marginTop,
  pageGap,
}: PaginationInput): PaginationResult {
  const offsets: PaginationOffset[] = []
  const breaks: PageBreak[] = []
  let pageIndex = 0
  let accumulatedOffset = 0
  let manualIndex = 0

  for (const block of blocks) {
    let top = block.top + accumulatedOffset
    let pageTop = pageIndex * (pageHeight + pageGap)
    let contentStart = pageTop + marginTop
    let pageEnd = contentStart + contentHeight
    const manualBreak = manualBreaks[manualIndex]
    const needsManualBreak = Boolean(
      manualBreak &&
        block.position >= manualBreak.position,
    )
    const needsAutomaticBreak = top + block.height > pageEnd && top > contentStart + 1

    if (needsManualBreak || needsAutomaticBreak) {
      pageIndex += 1
      pageTop = pageIndex * (pageHeight + pageGap)
      contentStart = pageTop + marginTop
      const offset = Math.max(0, contentStart - top)
      accumulatedOffset += offset
      top += offset
      const id = needsManualBreak && manualBreak
        ? manualBreak.id
        : `automatic-page-break-${pageIndex}`
      offsets.push({
        position: block.position,
        offset,
        pageIndex,
        manualBreakId: needsManualBreak && manualBreak ? manualBreak.id : null,
      })
      breaks.push({
        id,
        position: block.position,
        pageIndex,
        top: pageTop - pageGap / 2,
        manual: needsManualBreak,
      })
      if (needsManualBreak) manualIndex += 1
      pageEnd = contentStart + contentHeight
    }

    while (top + block.height > pageEnd + pageHeight + pageGap) {
      pageIndex += 1
      // A block taller than one page can't be split, so it isn't pushed
      // further here — it overflows through the page(s) it spans. But the
      // *next* block's `top = block.top + accumulatedOffset` must still land
      // on the page `pageIndex` now points to. Without advancing
      // `accumulatedOffset` in step with `pageIndex`, that next block's `top`
      // stays far behind the page boundary bookkeeping, so its own
      // `contentStart - top` push clamps to 0 (`top` already reads past
      // `contentStart`) and it never gets pushed onto its correct page —
      // silently breaking pagination for every block after the oversized one.
      accumulatedOffset += pageHeight + pageGap
      pageEnd = pageIndex * (pageHeight + pageGap) + marginTop + contentHeight
    }
  }

  while (manualIndex < manualBreaks.length) {
    const manualBreak = manualBreaks[manualIndex]
    pageIndex += 1
    const pageTop = pageIndex * (pageHeight + pageGap)
    breaks.push({
      id: manualBreak.id,
      position: manualBreak.position,
      pageIndex,
      top: pageTop - pageGap / 2,
      manual: true,
    })
    manualIndex += 1
  }

  const pageCount = Math.max(1, pageIndex + 1)
  const pages: Page[] = Array.from({ length: pageCount }, (_, index) => ({
    id: `page-${index + 1}`,
    index,
    number: index + 1,
    top: index * (pageHeight + pageGap),
    height: pageHeight,
    contentTop: index * (pageHeight + pageGap) + marginTop,
    contentHeight,
  }))
  return { pages, breaks, offsets }
}

/** Matches the `pageBreak` text serializer in `create-editor-api.ts`'s `getDocumentText()`. */
const MANUAL_PAGE_BREAK_MARKER = '\f'

function wrapSegment(text: string, targetCapacity: number): string[] {
  const words = text.split(/(\s+)/)
  const pages: string[] = []
  let current = ''
  for (const word of words) {
    if (current.length + word.length > targetCapacity && current.trim()) {
      pages.push(current.trimEnd())
      current = word.trimStart()
    } else {
      current += word
    }
  }
  if (current || pages.length === 0) pages.push(current.trimEnd())
  return pages
}

/**
 * A text-only, word-count approximation of pagination for Print Preview and
 * other plain-text page previews — deliberately NOT the same measured-DOM
 * engine `paginateBlocks` uses for the live editor (that operates on real
 * block heights, fonts, and formatting, which plain text doesn't have), so
 * exact page boundaries here are an approximation of the live document, not
 * a guarantee. Respecting each manual page break as a forced page boundary
 * (rather than only approximating overall page *count*) at least keeps the
 * one deliberate, content-independent signal a user actually controls
 * accurate between preview and editor.
 */
export function paginateText(
  text: string,
  contentWidth: number,
  contentHeight: number,
  minimumPages = 1,
): string[] {
  if (!text.trim()) return ['']
  const charactersPerLine = Math.max(24, Math.floor(contentWidth / 7.4))
  const linesPerPage = Math.max(8, Math.floor(contentHeight / 25))
  const capacity = charactersPerLine * linesPerPage
  const targetCapacity = Math.min(
    capacity,
    Math.max(1, Math.ceil(text.length / Math.max(1, minimumPages))),
  )
  const segments = text.split(MANUAL_PAGE_BREAK_MARKER)
  const pages = segments.flatMap((segment) => wrapSegment(segment.trim(), targetCapacity))
  while (pages.length < minimumPages) pages.push('')
  return pages
}
