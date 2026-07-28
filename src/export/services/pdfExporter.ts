import {
  degrees,
  PDFDocument,
  rgb,
  StandardFonts,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib'
import { appliesToPage } from '../../watermark/services/watermarkEngine'
import { rasterizeImageSource, rasterizeSvg } from './assetSerializer'
import type {
  ExportResult,
  RenderedBlock,
  RenderedDocument,
} from '../types/export'

const POINTS_PER_MILLIMETER = 72 / 25.4

function points(value: number): number {
  return value * POINTS_PER_MILLIMETER
}

function safeFileName(title: string): string {
  const safe = title.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '')
  return `${safe || 'document'}.pdf`
}

function colorFromHex(value: string) {
  const normalized = /^#[0-9a-f]{6}$/i.test(value) ? value.slice(1) : '64748b'
  return rgb(
    Number.parseInt(normalized.slice(0, 2), 16) / 255,
    Number.parseInt(normalized.slice(2, 4), 16) / 255,
    Number.parseInt(normalized.slice(4, 6), 16) / 255,
  )
}

function pdfText(value: string): string {
  return value
    .replace(/[\u2012-\u2015]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u2192/g, '->')
    .replace(/[^\x20-\x7e\n\t]/g, '?')
}

function wrapText(text: string, font: PDFFont, size: number, width: number): string[] {
  if (!text) return ['']
  const lines: string[] = []
  for (const paragraph of pdfText(text).replaceAll('\t', '    ').split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    let line = ''
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(candidate, size) <= width || !line) line = candidate
      else {
        lines.push(line)
        line = word
      }
    }
    lines.push(line)
  }
  return lines
}

function pageSize(document: RenderedDocument): [number, number] {
  const width = points(document.layout.width)
  const height = points(document.layout.height)
  return document.layout.orientation === 'portrait' ? [width, height] : [height, width]
}

function alignedX(
  alignment: 'left' | 'center' | 'right',
  text: string,
  font: PDFFont,
  size: number,
  pageWidth: number,
  left: number,
  right: number,
): number {
  if (alignment === 'center') return (pageWidth - font.widthOfTextAtSize(text, size)) / 2
  if (alignment === 'right') return pageWidth - right - font.widthOfTextAtSize(text, size)
  return left
}

function drawChrome(
  page: PDFPage,
  document: RenderedDocument,
  pageNumber: number,
  font: PDFFont,
) {
  const { width, height } = page.getSize()
  const left = points(document.layout.margins.left)
  const right = points(document.layout.margins.right)
  const muted = rgb(0.45, 0.45, 0.45)
  if (document.layout.header.enabled) {
    const text = pdfText(document.layout.header.text)
    page.drawText(text, {
      x: alignedX(document.layout.header.alignment, text, font, 8, width, left, right),
      y: height - 20,
      size: 8,
      font,
      color: muted,
    })
  }
  if (document.layout.footer.enabled) {
    const text = pdfText(document.layout.footer.text.replace('{page}', String(pageNumber)))
    page.drawText(text, {
      x: alignedX(document.layout.footer.alignment, text, font, 8, width, left, right),
      y: 14,
      size: 8,
      font,
      color: muted,
    })
  }
  const showPageNumber = document.layout.pageNumber.enabled &&
    !(document.layout.pageNumber.hideFirstPage && pageNumber === 1)
  if (showPageNumber) {
    const text = String(pageNumber)
    page.drawText(text, {
      x: alignedX(document.layout.pageNumber.alignment, text, font, 8, width, left, right),
      y: document.layout.pageNumber.position === 'top' ? height - 31 : 25,
      size: 8,
      font,
      color: muted,
    })
  }
}

async function drawWatermark(
  pdf: PDFDocument,
  page: PDFPage,
  document: RenderedDocument,
  pageNumber: number,
  font: PDFFont,
) {
  const watermark = document.watermark
  if (!watermark || !appliesToPage(watermark, pageNumber, document.currentPage)) return
  const { width, height } = page.getSize()
  const coordinates = watermark.position === 'custom'
    ? watermark.customPosition
    : {
        center: { x: 50, y: 50 },
        'top-left': { x: 20, y: 82 },
        'top-right': { x: 80, y: 82 },
        'bottom-left': { x: 20, y: 18 },
        'bottom-right': { x: 80, y: 18 },
      }[watermark.position]
  const x = (coordinates.x / 100) * width
  const y = (coordinates.y / 100) * height
  if (watermark.type === 'text') {
    const text = pdfText(watermark.text)
    const size = Math.max(24, Math.min(60, 42 * (watermark.scale / 100)))
    const textWidth = font.widthOfTextAtSize(text, size)
    page.drawText(text, {
      x: x - textWidth / 2,
      y: y - size / 2,
      size,
      font,
      color: colorFromHex(watermark.color),
      opacity: watermark.opacity / 100,
      rotate: degrees(watermark.rotation),
    })
    return
  }
  if (!watermark.image) return
  const bytes = await rasterizeImageSource(watermark.image.source, 520, 280)
  const image = await pdf.embedPng(bytes)
  const imageWidth = Math.min(width * 0.55, 300) * (watermark.scale / 100)
  const imageHeight = imageWidth * (image.height / image.width)
  page.drawImage(image, {
    x: x - imageWidth / 2,
    y: y - imageHeight / 2,
    width: imageWidth,
    height: imageHeight,
    opacity: watermark.opacity / 100,
    rotate: degrees(watermark.rotation),
  })
}

async function drawAsset(
  pdf: PDFDocument,
  page: PDFPage,
  block: RenderedBlock,
  x: number,
  y: number,
  maxWidth: number,
): Promise<number> {
  if (!block.asset) return y
  const bytes = await rasterizeSvg(block.asset.svg, block.asset.width, block.asset.height)
  const image = await pdf.embedPng(bytes)
  const width = Math.min(maxWidth, block.asset.width * 0.75)
  const height = width * (image.height / image.width)
  page.drawImage(image, { x, y: y - height, width, height })
  return y - height - 12
}

async function drawBlock(
  pdf: PDFDocument,
  page: PDFPage,
  block: RenderedBlock,
  fonts: { regular: PDFFont; bold: PDFFont; mono: PDFFont },
  x: number,
  y: number,
  width: number,
): Promise<number> {
  if (block.formField) {
    const field = block.formField
    if (field.visibility === 'hidden') return y
    const height = Math.max(30, Math.min(90, field.height * 0.65))
    page.drawText(pdfText(`${field.label || field.type}${field.required ? ' *' : ''}`), { x, y, size: 9, font: fonts.bold, color: rgb(0.12, 0.12, 0.12) })
    page.drawRectangle({ x, y: y - height - 6, width: width * (field.width / 100), height, borderWidth: 0.7, borderColor: rgb(0.62, 0.62, 0.62), color: rgb(0.99, 0.99, 0.99) })
    page.drawText(pdfText(field.placeholder || 'Enter a value'), { x: x + 7, y: y - 21, size: 8, font: fonts.regular, color: rgb(0.48, 0.48, 0.48) })
    return y - height - 20
  }
  if (block.asset) return drawAsset(pdf, page, block, x, y, width)
  if (block.type === 'horizontalRule') {
    page.drawLine({ start: { x, y: y - 4 }, end: { x: x + width, y: y - 4 }, thickness: 0.75, color: rgb(0.7, 0.7, 0.7) })
    return y - 18
  }
  if (block.rows) {
    const columns = Math.max(1, ...block.rows.map((row) => row.length))
    const cellWidth = width / columns
    let cursor = y
    for (const row of block.rows) {
      const cellLines = row.map((cell) => wrapText(cell.blocks.map((item) => item.text).join(' '), fonts.regular, 8, cellWidth - 10))
      const rowHeight = Math.max(24, ...cellLines.map((lines) => lines.length * 11 + 8))
      row.forEach((_, index) => {
        page.drawRectangle({ x: x + index * cellWidth, y: cursor - rowHeight, width: cellWidth, height: rowHeight, borderWidth: 0.5, borderColor: rgb(0.72, 0.72, 0.72) })
        cellLines[index].forEach((line, lineIndex) => page.drawText(line, { x: x + index * cellWidth + 5, y: cursor - 12 - lineIndex * 11, size: 8, font: fonts.regular, color: rgb(0.12, 0.12, 0.12) }))
      })
      cursor -= rowHeight
    }
    return cursor - 10
  }
  const heading = block.type === 'heading'
  const code = block.type === 'codeBlock'
  const size = heading ? Math.max(14, 22 - Math.max(1, block.level) * 2) : code ? 9 : 10.5
  const font = heading ? fonts.bold : code ? fonts.mono : fonts.regular
  const prefix = block.type === 'bulletList'
    ? '- '
    : block.type === 'orderedList'
      ? '1. '
      : block.type === 'taskList'
        ? `[${block.checked ? 'x' : ' '}] `
        : block.type === 'blockquote'
          ? '| '
          : ''
  const lines = wrapText(`${prefix}${block.text}`, font, size, width - block.level * 12)
  lines.forEach((line, index) => page.drawText(line, {
    x: x + block.level * 12,
    y: y - index * (size * 1.45),
    size,
    font,
    color: rgb(0.1, 0.1, 0.1),
  }))
  return y - lines.length * size * 1.45 - (heading ? 10 : 7)
}

function appendixLines(document: RenderedDocument): string[] {
  const lines: string[] = []
  if (document.comments.length) {
    lines.push('COMMENTS')
    for (const comment of document.comments) {
      lines.push(`${comment.author.name}: ${comment.text}`, `Selection: ${comment.anchor.quote}`)
      for (const reply of comment.replies) lines.push(`  ${reply.author.name}: ${reply.text}`)
    }
  }
  if (document.trackChanges.length) {
    lines.push('TRACKED CHANGES')
    for (const change of document.trackChanges) {
      lines.push(`${change.author.name} - ${change.type} (${change.status})`, `${change.before} -> ${change.after}`)
    }
  }
  return lines
}

export async function exportPdf(document: RenderedDocument): Promise<ExportResult> {
  const pdf = await PDFDocument.create()
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const mono = await pdf.embedFont(StandardFonts.Courier)
  if (document.options.exportMetadata) {
    pdf.setTitle(document.title)
    pdf.setAuthor('Techcodie Document Editor')
    pdf.setCreator('Techcodie Document Editor')
    pdf.setCreationDate(new Date(document.createdAt))
  }
  const size = pageSize(document)
  const left = points(document.layout.margins.left)
  const right = points(document.layout.margins.right)
  const top = points(document.layout.margins.top)
  const bottom = points(document.layout.margins.bottom)
  for (const renderedPage of document.pages) {
    const page = pdf.addPage(size)
    drawChrome(page, document, renderedPage.number, regular)
    await drawWatermark(pdf, page, document, renderedPage.number, bold)
    let y = page.getHeight() - top
    const contentWidth = page.getWidth() - left - right
    for (const block of renderedPage.blocks) {
      if (y < bottom + 28) break
      y = await drawBlock(pdf, page, block, { regular, bold, mono }, left, y, contentWidth)
    }
  }
  const appendix = appendixLines(document)
  if (appendix.length) {
    let page = pdf.addPage(size)
    let y = page.getHeight() - top
    for (const line of appendix) {
      const isTitle = line === 'COMMENTS' || line === 'TRACKED CHANGES'
      const font = isTitle ? bold : regular
      const fontSize = isTitle ? 14 : 9
      for (const wrapped of wrapText(line, font, fontSize, page.getWidth() - left - right)) {
        if (y < bottom + 20) {
          page = pdf.addPage(size)
          y = page.getHeight() - top
        }
        page.drawText(wrapped, { x: left, y, size: fontSize, font, color: rgb(0.12, 0.12, 0.12) })
        y -= fontSize * 1.5
      }
      y -= isTitle ? 6 : 3
    }
  }
  const bytes = await pdf.save()
  const blob = new Blob([Uint8Array.from(bytes).buffer], { type: 'application/pdf' })
  return { blob, fileName: safeFileName(document.title), mimeType: blob.type, size: blob.size }
}
