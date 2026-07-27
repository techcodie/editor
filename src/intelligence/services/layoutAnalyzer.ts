import type { OCRPageResult } from '../types/ocr'
import type {
  BoundingBox,
  LayoutBlock,
  LayoutBlockType,
  LayoutSummary,
} from '../types/layout'

interface AnalyzeTextOptions {
  pageNumber: number
  confidence?: number
  pageWidth?: number
  pageHeight?: number
}

function classifyBlock(text: string, index: number, total: number): LayoutBlockType {
  const trimmed = text.trim()
  if (/^(figure|fig\.|table)\s+\d+/i.test(trimmed)) return 'caption'
  if (/^(?:[-*+]\s+|\d+[.)]\s+)/.test(trimmed)) return 'list'
  if (trimmed.includes('\t') || /^\|.+\|$/.test(trimmed)) return 'table'
  if (index === total - 1 && /^(?:page\s+)?\d+(?:\s+of\s+\d+)?$/i.test(trimmed)) return 'footer'
  if (
    trimmed.length < 100 &&
    (trimmed === trimmed.toLocaleUpperCase() || /^[A-Z][^.!?]{2,70}$/.test(trimmed))
  ) {
    return 'heading'
  }
  return 'paragraph'
}

function headingLevel(text: string): 1 | 2 | 3 {
  if (text.length <= 32) return 1
  if (text.length <= 64) return 2
  return 3
}

function approximateBox(
  index: number,
  total: number,
  pageWidth: number,
  pageHeight: number,
): BoundingBox {
  const contentHeight = pageHeight * 0.84
  const blockHeight = Math.max(24, contentHeight / Math.max(total, 1))
  return {
    x: pageWidth * 0.08,
    y: pageHeight * 0.08 + blockHeight * index,
    width: pageWidth * 0.84,
    height: Math.min(blockHeight * 0.82, pageHeight * 0.12),
    pageWidth,
    pageHeight,
  }
}

export function analyzeTextLayout(
  text: string,
  options: AnalyzeTextOptions,
): LayoutBlock[] {
  const chunks = text
    .split(/\n\s*\n|(?<=\.)\s*\n/)
    .map((chunk) => chunk.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
  const pageWidth = options.pageWidth ?? 816
  const pageHeight = options.pageHeight ?? 1056

  return chunks.map((chunk, index) => {
    const type = classifyBlock(chunk, index, chunks.length)
    return {
      id: crypto.randomUUID(),
      pageNumber: options.pageNumber,
      type,
      text: chunk,
      confidence: options.confidence ?? 100,
      boundingBox: approximateBox(index, chunks.length, pageWidth, pageHeight),
      headingLevel: type === 'heading' ? headingLevel(chunk) : undefined,
    }
  })
}

export function analyzeOCRLayout(page: OCRPageResult): LayoutBlock[] {
  if (page.regions.length === 0) {
    return analyzeTextLayout(page.text, {
      pageNumber: page.pageNumber,
      confidence: page.confidence,
      pageWidth: page.width,
      pageHeight: page.height,
    })
  }

  return page.regions.map((region, index) => {
    const topRatio = region.boundingBox.y / region.boundingBox.pageHeight
    const bottomRatio =
      (region.boundingBox.y + region.boundingBox.height) /
      region.boundingBox.pageHeight
    const type = topRatio < 0.025
      ? 'header'
      : bottomRatio > 0.975
        ? 'footer'
        : classifyBlock(region.text, index, page.regions.length)
    return {
      id: region.id,
      pageNumber: page.pageNumber,
      type,
      text: region.text.trim(),
      confidence: region.confidence,
      boundingBox: region.boundingBox,
      headingLevel: type === 'heading' ? headingLevel(region.text) : undefined,
    }
  })
}

export function summarizeLayout(blocks: LayoutBlock[]): LayoutSummary {
  const count = (type: LayoutBlockType) =>
    blocks.filter((block) => block.type === type).length
  return {
    blockCount: blocks.length,
    headings: count('heading'),
    paragraphs: count('paragraph'),
    lists: count('list'),
    tables: count('table'),
    images: count('image'),
    captions: count('caption'),
    headers: count('header'),
    footers: count('footer'),
    columnsDetected: 1,
  }
}
