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

const HEADING_TAGS: Record<string, 1 | 2 | 3 | 4 | 5 | 6> = {
  H1: 1,
  H2: 2,
  H3: 3,
  H4: 4,
  H5: 5,
  H6: 6,
}

/**
 * Builds layout blocks directly from a parser's own sanitized HTML (DOCX via
 * mammoth, Markdown via marked) instead of re-guessing structure from plain
 * text with {@link classifyBlock}. That heuristic is tuned for OCR output
 * with no real markup to fall back on; applied to plain text extracted from
 * a DOCX table it misclassifies every short cell ("Above", "Top left", ...)
 * as a heading. Real tags are unambiguous, so this path is used whenever the
 * parser already produced HTML.
 */
export function analyzeHtmlLayout(
  html: string,
  options: AnalyzeTextOptions,
): LayoutBlock[] {
  const container = document.createElement('div')
  container.innerHTML = html
  const pageWidth = options.pageWidth ?? 816
  const pageHeight = options.pageHeight ?? 1056
  const blocks: LayoutBlock[] = []

  for (const element of Array.from(container.children)) {
    const tag = element.tagName
    const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim()
    if (!text && tag !== 'TABLE' && tag !== 'HR') continue

    if (tag === 'TABLE') {
      blocks.push({
        id: crypto.randomUUID(),
        pageNumber: options.pageNumber,
        type: 'table',
        text,
        confidence: options.confidence ?? 100,
        html: element.outerHTML,
      })
      continue
    }

    if (tag in HEADING_TAGS) {
      blocks.push({
        id: crypto.randomUUID(),
        pageNumber: options.pageNumber,
        type: 'heading',
        text,
        confidence: options.confidence ?? 100,
        headingLevel: HEADING_TAGS[tag],
      })
      continue
    }

    if (tag === 'UL' || tag === 'OL') {
      const items = Array.from(element.querySelectorAll('li'))
        .map((item) => (item.textContent ?? '').trim())
        .filter(Boolean)
      blocks.push({
        id: crypto.randomUUID(),
        pageNumber: options.pageNumber,
        type: 'list',
        text: items.join('\n'),
        confidence: options.confidence ?? 100,
      })
      continue
    }

    if (tag === 'BLOCKQUOTE') {
      blocks.push({
        id: crypto.randomUUID(),
        pageNumber: options.pageNumber,
        type: 'caption',
        text,
        confidence: options.confidence ?? 100,
      })
      continue
    }

    blocks.push({
      id: crypto.randomUUID(),
      pageNumber: options.pageNumber,
      type: 'paragraph',
      text,
      confidence: options.confidence ?? 100,
    })
  }

  if (blocks.length === 0) {
    const text = (container.textContent ?? '').replace(/\s+/g, ' ').trim()
    if (!text) return []
    return [{
      id: crypto.randomUUID(),
      pageNumber: options.pageNumber,
      type: 'paragraph',
      text,
      confidence: options.confidence ?? 100,
      boundingBox: approximateBox(0, 1, pageWidth, pageHeight),
    }]
  }

  return blocks.map((block, index) => ({
    ...block,
    boundingBox: block.boundingBox ?? approximateBox(index, blocks.length, pageWidth, pageHeight),
  }))
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
