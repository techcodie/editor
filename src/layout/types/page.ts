export interface Page {
  id: string
  index: number
  number: number
  top: number
  height: number
  contentTop: number
  contentHeight: number
}

export interface PageBreak {
  id: string
  position: number
  pageIndex: number
  top: number
  manual: boolean
}

export interface PaginationSnapshot {
  pages: Page[]
  breaks: PageBreak[]
  currentPage: number
  pageWidth: number
  pageHeight: number
  pageGap: number
}

export interface PaginationBlock {
  position: number
  top: number
  height: number
}

export interface PaginationOffset {
  position: number
  offset: number
  pageIndex: number
  manualBreakId: string | null
}
