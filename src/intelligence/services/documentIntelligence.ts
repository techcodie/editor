import { parseKnowledgeSourceFile } from '../../knowledge/services/fileParser'
import { loadPdfDocument } from '../../knowledge/services/pdfDocument'
import type { KnowledgeSourceType } from '../../knowledge/types/source'
import type {
  DocumentIntelligenceOptions,
  DocumentModel,
  DocumentPage,
  IntelligenceDocumentType,
} from '../types/documentModel'
import type { LayoutBlock } from '../types/layout'
import { classifyDocument, validateIntelligenceFile } from './documentClassifier'
import { analyzeHtmlLayout, analyzeOCRLayout, analyzeTextLayout, summarizeLayout } from './layoutAnalyzer'
import { extractMetadata } from './metadataExtractor'
import { buildSearchIndex } from './searchIndexer'

const analysisCache = new WeakMap<File, Promise<DocumentModel>>()
const completedAnalysisCache = new WeakMap<File, DocumentModel>()

function abortError(): DOMException {
  return new DOMException('Document analysis was cancelled.', 'AbortError')
}

function ensureActive(signal?: AbortSignal) {
  if (signal?.aborted) throw abortError()
}

function report(
  options: DocumentIntelligenceOptions,
  stage: Parameters<NonNullable<DocumentIntelligenceOptions['onProgress']>>[0]['stage'],
  progress: number,
  message: string,
  page?: number,
  pageCount?: number,
) {
  options.onProgress?.({ stage, progress, message, page, pageCount })
}

async function imageDimensions(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const dimensions = { width: bitmap.width, height: bitmap.height }
  bitmap.close()
  return dimensions
}

async function analyzeImage(
  file: File,
  options: DocumentIntelligenceOptions,
): Promise<{ pages: DocumentPage[]; hints: Record<string, never> }> {
  const dimensions = await imageDimensions(file)
  const { recognizeImage } = await import('./ocrEngine')
  const ocr = await recognizeImage(file, {
    language: options.language,
    signal: options.signal,
    width: dimensions.width,
    height: dimensions.height,
    onProgress: ({ progress, status }) =>
      report(options, 'ocr', 15 + progress * 45, `Recognizing image: ${status}`),
  })
  const imageBlock: LayoutBlock = {
    id: crypto.randomUUID(),
    pageNumber: 1,
    type: 'image',
    text: file.name,
    confidence: 100,
    boundingBox: {
      x: 0,
      y: 0,
      width: dimensions.width,
      height: dimensions.height,
      pageWidth: dimensions.width,
      pageHeight: dimensions.height,
    },
  }
  return {
    pages: [{
      pageNumber: 1,
      width: dimensions.width,
      height: dimensions.height,
      text: ocr.text,
      confidence: ocr.confidence,
      usedOCR: true,
      blocks: [...analyzeOCRLayout(ocr), imageBlock],
    }],
    hints: {},
  }
}

async function renderPdfPage(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof loadPdfDocument>>['getPage']>>,
): Promise<HTMLCanvasElement> {
  const natural = page.getViewport({ scale: 1 })
  const scale = Math.min(2, 2_000 / Math.max(natural.width, natural.height))
  const viewport = page.getViewport({ scale: Math.max(1.35, scale) })
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  await page.render({ canvas, viewport }).promise
  return canvas
}

async function analyzePdf(
  file: File,
  options: DocumentIntelligenceOptions,
): Promise<{ pages: DocumentPage[]; hints: Record<string, string | string[] | undefined> }> {
  const pdf = await loadPdfDocument(file)
  try {
    const metadata = await pdf.getMetadata().catch(() => null)
    const info = (metadata?.info ?? {}) as Record<string, unknown>
    const pages: DocumentPage[] = []

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      ensureActive(options.signal)
      report(options, 'analyzing', 8 + ((pageNumber - 1) / pdf.numPages) * 18, `Reading page ${pageNumber}`, pageNumber, pdf.numPages)
      const page = await pdf.getPage(pageNumber)
      const viewport = page.getViewport({ scale: 1 })
      const content = await page.getTextContent()
      const digitalText = content.items
        .map((item) => ('str' in item ? `${item.str}${item.hasEOL ? '\n' : ' '}` : ''))
        .join('')
        .replace(/[ \t]+/g, ' ')
        .replace(/\s*\n\s*/g, '\n')
        .trim()

      if (digitalText.length >= 24) {
        pages.push({
          pageNumber,
          width: viewport.width,
          height: viewport.height,
          text: digitalText,
          confidence: 100,
          usedOCR: false,
          blocks: analyzeTextLayout(digitalText, {
            pageNumber,
            pageWidth: viewport.width,
            pageHeight: viewport.height,
          }),
        })
        continue
      }

      report(options, 'ocr', 26 + ((pageNumber - 1) / pdf.numPages) * 42, `Recognizing scanned page ${pageNumber}`, pageNumber, pdf.numPages)
      const canvas = await renderPdfPage(page)
      const { recognizeImage } = await import('./ocrEngine')
      const recognized = await recognizeImage(canvas, {
        language: options.language,
        signal: options.signal,
        pageNumber,
        width: canvas.width,
        height: canvas.height,
        onProgress: ({ progress }) =>
          report(options, 'ocr', 26 + ((pageNumber - 1 + progress) / pdf.numPages) * 42, `Recognizing scanned page ${pageNumber}`, pageNumber, pdf.numPages),
      })
      pages.push({
        pageNumber,
        width: canvas.width,
        height: canvas.height,
        text: recognized.text,
        confidence: recognized.confidence,
        usedOCR: true,
        blocks: analyzeOCRLayout(recognized),
      })
    }

    return {
      pages,
      hints: {
        title: typeof info.Title === 'string' ? info.Title : undefined,
        author: typeof info.Author === 'string' ? info.Author : undefined,
        keywords: typeof info.Keywords === 'string' ? info.Keywords.split(/[,;]/) : undefined,
        createdAt: typeof info.CreationDate === 'string' ? info.CreationDate : undefined,
        modifiedAt: typeof info.ModDate === 'string' ? info.ModDate : undefined,
      },
    }
  } finally {
    await pdf.destroy()
  }
}

async function analyzeTextDocument(
  file: File,
  type: Exclude<IntelligenceDocumentType, 'image' | 'pdf'>,
): Promise<{ pages: DocumentPage[]; hints: Record<string, never> }> {
  const sourceType: KnowledgeSourceType = type === 'text' ? 'txt' : type
  const parsed = await parseKnowledgeSourceFile(file, sourceType)
  // DOCX and Markdown already produce real HTML (mammoth/marked); use it for
  // accurate heading/table/list detection instead of re-guessing structure
  // from plain text, which misclassifies short table cells as headings.
  const blocks = parsed.html
    ? analyzeHtmlLayout(parsed.html, { pageNumber: 1 })
    : analyzeTextLayout(parsed.text, { pageNumber: 1 })
  return {
    pages: [{
      pageNumber: 1,
      width: 816,
      height: 1056,
      text: parsed.text,
      confidence: 100,
      usedOCR: false,
      blocks,
    }],
    hints: {},
  }
}

function buildAIContext(model: Omit<DocumentModel, 'aiContext'>): string {
  const metadata = [
    `Title: ${model.metadata.title}`,
    model.metadata.author ? `Author: ${model.metadata.author}` : null,
    `Language: ${model.language}`,
    `Pages: ${model.pages.length}`,
  ].filter(Boolean).join('\n')
  return `[Document metadata]\n${metadata}\n\n[Recognized content]\n${model.text}`
}

async function analyzeUncachedDocument(
  file: File,
  options: DocumentIntelligenceOptions,
): Promise<DocumentModel> {
  const validationError = validateIntelligenceFile(file)
  if (validationError) throw new Error(validationError)
  const type = classifyDocument(file)
  if (!type) throw new Error('This document type is not supported.')

  report(options, 'analyzing', 3, 'Inspecting document')
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
  ensureActive(options.signal)
  const analyzed = type === 'image'
    ? await analyzeImage(file, options)
    : type === 'pdf'
      ? await analyzePdf(file, options)
      : await analyzeTextDocument(file, type)
  ensureActive(options.signal)

  report(options, 'layout', 75, 'Analyzing document structure')
  const blocks = analyzed.pages.flatMap((page) => page.blocks)
  const text = analyzed.pages.map((page) => page.text).filter(Boolean).join('\n\n')
  const confidence = analyzed.pages.length
    ? analyzed.pages.reduce((sum, page) => sum + page.confidence, 0) / analyzed.pages.length
    : 0
  const language = options.language ?? 'eng'

  report(options, 'metadata', 84, 'Extracting metadata')
  const metadata = extractMetadata(file, type, analyzed.pages.length, language, analyzed.hints)
  report(options, 'indexing', 92, 'Building local search index')
  const partial = {
    id: crypto.randomUUID(),
    pages: analyzed.pages,
    blocks,
    paragraphs: blocks.filter((block) => block.type === 'paragraph'),
    tables: blocks.filter((block) => block.type === 'table'),
    images: blocks.filter((block) => block.type === 'image'),
    metadata,
    text,
    language,
    confidence,
    layout: summarizeLayout(blocks),
    searchIndex: buildSearchIndex(blocks),
  }
  const model: DocumentModel = { ...partial, aiContext: buildAIContext(partial) }
  completedAnalysisCache.set(file, model)
  report(options, 'complete', 100, 'Document ready')
  return model
}

export function analyzeDocument(
  file: File,
  options: DocumentIntelligenceOptions = {},
): Promise<DocumentModel> {
  const completed = completedAnalysisCache.get(file)
  if (completed) {
    report(options, 'complete', 100, 'Document ready from local cache')
    return Promise.resolve(completed)
  }
  if (!options.signal && !options.onProgress) {
    const cached = analysisCache.get(file)
    if (cached) return cached
    const analysis = analyzeUncachedDocument(file, options)
    analysisCache.set(file, analysis)
    void analysis.catch(() => analysisCache.delete(file))
    return analysis
  }
  return analyzeUncachedDocument(file, options)
}

export function createDocumentModelFromText(
  text: string,
  title = 'Current document',
): DocumentModel {
  const normalizedText = text.trim()
  const blocks = analyzeTextLayout(normalizedText, { pageNumber: 1 })
  const pages: DocumentPage[] = [{
    pageNumber: 1,
    width: 816,
    height: 1056,
    text: normalizedText,
    confidence: 100,
    usedOCR: false,
    blocks,
  }]
  const partial = {
    id: crypto.randomUUID(),
    pages,
    blocks,
    paragraphs: blocks.filter((block) => block.type === 'paragraph'),
    tables: blocks.filter((block) => block.type === 'table'),
    images: blocks.filter((block) => block.type === 'image'),
    metadata: {
      fileName: title,
      fileType: 'text' as const,
      mimeType: 'text/plain',
      fileSize: new Blob([normalizedText]).size,
      title,
      keywords: [],
      language: 'eng',
      pageCount: 1,
    },
    text: normalizedText,
    language: 'eng',
    confidence: 100,
    layout: summarizeLayout(blocks),
    searchIndex: buildSearchIndex(blocks),
  }
  return { ...partial, aiContext: buildAIContext(partial) }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function documentModelToEditorHtml(model: DocumentModel): string {
  return model.blocks
    .filter((block) => block.type !== 'image' && block.type !== 'header' && block.type !== 'footer')
    .map((block) => {
      const text = escapeHtml(block.text).replaceAll('\n', '<br>')
      if (block.type === 'table' && block.html) return block.html
      if (block.type === 'heading') return `<h${block.headingLevel ?? 2}>${text}</h${block.headingLevel ?? 2}>`
      if (block.type === 'list') {
        const items = block.text
          .split('\n')
          .map((item) => item.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '').trim())
          .filter(Boolean)
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('')
        return `<ul>${items}</ul>`
      }
      if (block.type === 'caption') return `<p><em>${text}</em></p>`
      return `<p>${text}</p>`
    })
    .join('')
}
