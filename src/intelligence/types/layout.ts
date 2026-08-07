export type LayoutBlockType =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'table'
  | 'image'
  | 'caption'
  | 'header'
  | 'footer'

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
  pageWidth: number
  pageHeight: number
}

export interface LayoutBlock {
  id: string
  pageNumber: number
  type: LayoutBlockType
  text: string
  confidence: number
  boundingBox?: BoundingBox
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  /**
   * Pre-sanitized source HTML for this block, when the originating parser
   * already produced real markup (DOCX/Markdown tables) instead of plain
   * text. Editor insertion uses this verbatim instead of re-deriving markup
   * from `text`.
   */
  html?: string
}

export interface LayoutSummary {
  blockCount: number
  headings: number
  paragraphs: number
  lists: number
  tables: number
  images: number
  captions: number
  headers: number
  footers: number
  columnsDetected: number
}
