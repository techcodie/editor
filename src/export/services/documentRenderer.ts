import type { EditorDocumentNode } from '../../lib/editor-api'
import { resolvePageMetrics } from '../../layout/services/pageMetrics'
import { paginateBlocks } from '../../layout/services/paginationEngine'
import { serializeAsset } from './assetSerializer'
import type {
  ExportRequest,
  RenderedBlock,
  RenderedDocument,
  RenderedMark,
  RenderedPage,
  RenderedTableCell,
  RenderedText,
} from '../types/export'

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function nodeSize(node: EditorDocumentNode): number {
  if (node.text !== undefined) return node.text.length
  if (!node.content?.length) return 1
  return 2 + node.content.reduce((total, child) => total + nodeSize(child), 0)
}

function normalizeMarks(node: EditorDocumentNode, request: ExportRequest): RenderedMark[] {
  return (node.marks ?? []).flatMap((mark) => {
    if (mark.type === 'reviewComment' && !request.options.includeComments) return []
    if (mark.type === 'trackChange' && !request.options.includeTrackChanges) return []
    return [{ type: mark.type, attrs: mark.attrs ?? {} }]
  })
}

function shouldOmitText(node: EditorDocumentNode, request: ExportRequest): boolean {
  const change = node.marks?.find((mark) => mark.type === 'trackChange')
  if (!change) return false
  const segment = change.attrs?.segment
  return segment === 'deletion' && (
    request.options.flattenSuggestions || !request.options.includeTrackChanges
  )
}

function collectRuns(node: EditorDocumentNode, request: ExportRequest): RenderedText[] {
  if (node.text !== undefined) {
    if (shouldOmitText(node, request)) return []
    return [{ text: node.text, marks: normalizeMarks(node, request) }]
  }
  if (node.type === 'hardBreak') return [{ text: '\n', marks: [] }]
  return (node.content ?? []).flatMap((child) => collectRuns(child, request))
}

function blockText(runs: RenderedText[]): string {
  return runs.map((run) => run.text).join('')
}

function imageAsset(node: EditorDocumentNode) {
  const attrs = node.attrs ?? {}
  const source = typeof attrs.src === 'string' ? attrs.src : ''
  if (!source.startsWith('data:image/')) return null
  const width = typeof attrs.width === 'number' ? attrs.width : 320
  const height = typeof attrs.height === 'number' ? attrs.height : 180
  const title = typeof attrs.alt === 'string' && attrs.alt ? attrs.alt : 'Document image'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><image href="${escapeXml(source)}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/></svg>`
  return { title, width, height, rotation: 0, svg, renderData: { source } }
}

interface ParseState {
  blocks: RenderedBlock[]
  position: number
  nextId: number
}

function createBlock(
  node: EditorDocumentNode,
  request: ExportRequest,
  state: ParseState,
  type = node.type,
  level = 0,
): RenderedBlock {
  const runs = collectRuns(node, request)
  const block: RenderedBlock = {
    id: `export-block-${state.nextId++}`,
    type,
    level,
    position: state.position,
    runs,
    text: blockText(runs),
  }
  state.position += nodeSize(node)
  return block
}

function parseTableCell(
  node: EditorDocumentNode,
  request: ExportRequest,
  state: ParseState,
): RenderedTableCell {
  const blocks = (node.content ?? []).map((child) =>
    createBlock(child, request, state, child.type, 0),
  )
  return { blocks }
}

function parseNode(
  node: EditorDocumentNode,
  request: ExportRequest,
  state: ParseState,
  level = 0,
): void {
  if (node.type === 'bulletList' || node.type === 'orderedList' || node.type === 'taskList') {
    const listType = node.type
    for (const child of node.content ?? []) {
      const item = createBlock({
        ...child,
        content: child.content?.filter((nested) => !nested.type.endsWith('List')),
      }, request, state, listType, level)
      if (child.type === 'taskItem') item.checked = Boolean(child.attrs?.checked)
      state.blocks.push(item)
      for (const nested of child.content ?? []) {
        if (nested.type.endsWith('List')) parseNode(nested, request, state, level + 1)
      }
    }
    return
  }

  if (node.type === 'table') {
    const block = createBlock(node, request, state, 'table', level)
    block.rows = (node.content ?? []).map((row) =>
      (row.content ?? []).map((cell) => parseTableCell(cell, request, state)),
    )
    state.blocks.push(block)
    return
  }

  if (node.type === 'enterpriseAsset') {
    const block = createBlock(node, request, state, 'asset', level)
    block.asset = request.options.includeAssets ? serializeAsset(node) ?? undefined : undefined
    block.text = block.asset?.title ?? ''
    state.blocks.push(block)
    return
  }

  if (node.type === 'image') {
    const block = createBlock(node, request, state, 'image', level)
    block.asset = request.options.includeAssets ? imageAsset(node) ?? undefined : undefined
    block.text = block.asset?.title ?? ''
    state.blocks.push(block)
    return
  }

  if (node.type === 'horizontalRule') {
    state.blocks.push(createBlock(node, request, state, 'horizontalRule', level))
    return
  }

  if (node.type === 'doc') {
    for (const child of node.content ?? []) parseNode(child, request, state, level)
    return
  }

  state.blocks.push(createBlock(node, request, state, node.type, level))
}

function estimateBlockHeight(block: RenderedBlock, contentWidth: number): number {
  if (block.asset) {
    const scale = Math.min(1, contentWidth / Math.max(1, block.asset.width))
    return block.asset.height * scale + 20
  }
  if (block.rows) {
    return block.rows.reduce((total, row) => {
      const lines = Math.max(1, ...row.map((cell) =>
        cell.blocks.reduce((count, item) => count + Math.max(1, Math.ceil(item.text.length / 28)), 0),
      ))
      return total + lines * 24 + 12
    }, 8)
  }
  if (block.type === 'horizontalRule') return 20
  const charactersPerLine = Math.max(24, Math.floor(contentWidth / 7.4))
  const lines = Math.max(1, Math.ceil(block.text.length / charactersPerLine))
  const lineHeight = block.type === 'heading' ? 29 : block.type === 'codeBlock' ? 21 : 24
  return lines * lineHeight + (block.type === 'heading' ? 18 : 10)
}

function paginate(
  blocks: RenderedBlock[],
  request: ExportRequest,
): RenderedPage[] {
  const metrics = resolvePageMetrics(request.source.layout)
  let top = metrics.marginTop
  const measured = blocks.map((block) => {
    const height = estimateBlockHeight(block, metrics.contentWidth)
    const result = { position: block.position, top, height }
    top += height
    return result
  })
  const result = paginateBlocks({
    blocks: measured,
    manualBreaks: request.source.pagination.breaks
      .filter((pageBreak) => pageBreak.manual)
      .map((pageBreak) => ({ id: pageBreak.id, position: pageBreak.position })),
    pageHeight: metrics.height,
    contentHeight: metrics.contentHeight,
    marginTop: metrics.marginTop,
    pageGap: 0,
  })
  const pages: RenderedPage[] = result.pages.map((page) => ({ number: page.number, blocks: [] }))
  let accumulatedOffset = 0
  let offsetIndex = 0
  measured.forEach((measurement, index) => {
    while (
      offsetIndex < result.offsets.length &&
      result.offsets[offsetIndex].position <= measurement.position
    ) {
      accumulatedOffset += result.offsets[offsetIndex].offset
      offsetIndex += 1
    }
    const adjustedTop = measurement.top + accumulatedOffset
    const pageIndex = Math.min(pages.length - 1, Math.max(0, Math.floor(adjustedTop / metrics.height)))
    pages[pageIndex].blocks.push(blocks[index])
  })
  while (pages.length < request.source.pagination.pages.length) {
    pages.push({ number: pages.length + 1, blocks: [] })
  }
  return pages
}

export function renderDocument(request: ExportRequest): RenderedDocument {
  const state: ParseState = { blocks: [], position: 0, nextId: 1 }
  parseNode(request.source.document, request, state)
  return {
    title: request.source.title,
    createdAt: Date.now(),
    currentPage: request.source.pagination.currentPage,
    layout: structuredClone(request.source.layout),
    watermark: request.options.includeWatermarks
      ? structuredClone(request.source.watermark)
      : null,
    options: structuredClone(request.options),
    pages: paginate(state.blocks, request),
    blocks: state.blocks,
    comments: request.options.includeComments
      ? structuredClone(request.source.comments)
      : [],
    trackChanges: request.options.includeTrackChanges
      ? structuredClone(request.source.trackChanges)
      : [],
  }
}
