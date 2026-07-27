import type { KnowledgeSourceType } from '../types/source'
import { loadPdfDocument } from './pdfDocument'

export interface ParsedKnowledgeSource {
  text: string
  html?: string
  pageCount?: number
}

const parsedFileCache = new WeakMap<File, Promise<ParsedKnowledgeSource>>()

export class KnowledgeSourceParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'KnowledgeSourceParseError'
  }
}

function requireReadableText(text: string, type: KnowledgeSourceType): string {
  if (text.trim()) return text

  const label = type === 'markdown' ? 'Markdown' : type.toUpperCase()
  throw new KnowledgeSourceParseError(
    `${label} file does not contain readable text. Try another file.`,
  )
}

async function sanitizePreviewHtml(html: string): Promise<string> {
  const { default: DOMPurify } = await import('dompurify')
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'a',
      'blockquote',
      'br',
      'code',
      'del',
      'em',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'li',
      'ol',
      'p',
      'pre',
      'strong',
      'table',
      'tbody',
      'td',
      'th',
      'thead',
      'tr',
      'ul',
    ],
    ALLOWED_ATTR: ['colspan', 'href', 'rowspan', 'title'],
    ALLOW_DATA_ATTR: false,
  })
}

async function parsePdf(file: File): Promise<ParsedKnowledgeSource> {
  const document = await loadPdfDocument(file)

  try {
    const pageTexts: string[] = []
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber)
      const content = await page.getTextContent()
      pageTexts.push(
        content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
          .trim(),
      )
    }

    return {
      text: pageTexts.join('\n\n'),
      pageCount: document.numPages,
    }
  } finally {
    await document.destroy()
  }
}

async function parseDocx(file: File): Promise<ParsedKnowledgeSource> {
  const mammoth = await import('mammoth')
  const data = await file.arrayBuffer()
  const [htmlResult, textResult] = await Promise.all([
    mammoth.convertToHtml({ arrayBuffer: data.slice(0) }),
    mammoth.extractRawText({ arrayBuffer: data.slice(0) }),
  ])
  const text = requireReadableText(textResult.value, 'docx')

  return {
    text,
    html: await sanitizePreviewHtml(htmlResult.value),
  }
}

async function parseText(file: File): Promise<ParsedKnowledgeSource> {
  const text = requireReadableText(await file.text(), 'txt')
  return { text }
}

async function parseMarkdown(file: File): Promise<ParsedKnowledgeSource> {
  const text = requireReadableText(await file.text(), 'markdown')
  const { marked } = await import('marked')
  const html = marked.parse(text, {
    async: false,
    breaks: false,
    gfm: true,
  })

  return {
    text,
    html: await sanitizePreviewHtml(html),
  }
}

function getParsingFailureMessage(type: KnowledgeSourceType): string {
  switch (type) {
    case 'pdf':
      return 'This PDF could not be read. It may be corrupted or password protected.'
    case 'docx':
      return 'This Word document could not be read. It may be corrupted.'
    case 'txt':
      return 'This text file could not be read.'
    case 'markdown':
      return 'This Markdown file could not be read.'
    case 'document':
      return 'This document could not be read.'
    case 'image':
      return 'This image must be prepared through Document Intelligence.'
  }
}

async function parseUncachedKnowledgeSourceFile(
  file: File,
  type: KnowledgeSourceType,
): Promise<ParsedKnowledgeSource> {
  try {
    switch (type) {
      case 'pdf':
        return await parsePdf(file)
      case 'docx':
        return await parseDocx(file)
      case 'txt':
        return await parseText(file)
      case 'markdown':
        return await parseMarkdown(file)
      case 'document':
        throw new KnowledgeSourceParseError('The current document is previewed in the editor.')
      case 'image':
        throw new KnowledgeSourceParseError(
          'Use Document Intelligence to recognize text in this image.',
        )
    }
  } catch (error) {
    if (error instanceof KnowledgeSourceParseError) throw error
    throw new KnowledgeSourceParseError(getParsingFailureMessage(type))
  }
}

export function parseKnowledgeSourceFile(
  file: File,
  type: KnowledgeSourceType,
): Promise<ParsedKnowledgeSource> {
  const cached = parsedFileCache.get(file)
  if (cached) return cached

  const parsing = parseUncachedKnowledgeSourceFile(file, type)
  parsedFileCache.set(file, parsing)
  void parsing.catch(() => {
    if (parsedFileCache.get(file) === parsing) parsedFileCache.delete(file)
  })
  return parsing
}
