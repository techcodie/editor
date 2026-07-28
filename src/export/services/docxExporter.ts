import {
  AlignmentType,
  convertMillimetersToTwip,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  PageNumber,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type ISectionOptions,
} from 'docx'
import { rasterizeSvg } from './assetSerializer'
import type {
  ExportResult,
  RenderedBlock,
  RenderedDocument,
  RenderedText,
} from '../types/export'

function safeFileName(title: string): string {
  const safe = title.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '')
  return `${safe || 'document'}.docx`
}

function alignment(value: 'left' | 'center' | 'right') {
  if (value === 'center') return AlignmentType.CENTER
  if (value === 'right') return AlignmentType.RIGHT
  return AlignmentType.LEFT
}

function textRun(run: RenderedText): TextRun {
  const markTypes = new Set(run.marks.map((mark) => mark.type))
  const track = run.marks.find((mark) => mark.type === 'trackChange')
  const isDeletion = track?.attrs.segment === 'deletion'
  const isInsertion = Boolean(track) && !isDeletion
  return new TextRun({
    text: run.text,
    bold: markTypes.has('bold'),
    italics: markTypes.has('italic'),
    underline: markTypes.has('underline') || isInsertion ? {} : undefined,
    strike: markTypes.has('strike') || isDeletion,
    font: markTypes.has('code') ? 'Courier New' : undefined,
    color: isDeletion ? 'B91C1C' : isInsertion ? '15803D' : undefined,
    highlight: markTypes.has('highlight') || markTypes.has('reviewComment') ? 'yellow' : undefined,
  })
}

function headingLevel(level: number): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
  if (level === 1) return HeadingLevel.HEADING_1
  if (level === 2) return HeadingLevel.HEADING_2
  if (level === 3) return HeadingLevel.HEADING_3
  return HeadingLevel.HEADING_4
}

async function blockToDocx(block: RenderedBlock): Promise<Paragraph | Table> {
  if (block.formField) {
    const field = block.formField
    const marker = JSON.stringify({ techcodieFormField: field })
    return new Paragraph({
      children: [
        new TextRun({ text: `${field.label || field.type}${field.required ? ' *' : ''}`, bold: true }),
        new TextRun({ text: `\n${field.placeholder || 'Enter a value'}`, color: '737373' }),
        new TextRun({ text: marker, vanish: true }),
      ],
      border: { bottom: { style: 'single', size: 4, color: 'A3A3A3' } },
      spacing: { before: 80, after: 180 },
    })
  }
  if (block.asset) {
    const bytes = await rasterizeSvg(block.asset.svg, block.asset.width, block.asset.height)
    const maxWidth = Math.min(520, block.asset.width)
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({
        data: bytes,
        type: 'png',
        transformation: {
          width: maxWidth,
          height: maxWidth * (block.asset.height / block.asset.width),
        },
      })],
      spacing: { before: 120, after: 180 },
    })
  }
  if (block.rows) {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: block.rows.map((row) => new TableRow({
        children: row.map((cell) => new TableCell({
          children: cell.blocks.map((item) => new Paragraph({
            children: item.runs.length ? item.runs.map(textRun) : [new TextRun('')],
          })),
        })),
      })),
    })
  }
  if (block.type === 'horizontalRule') {
    return new Paragraph({
      border: { bottom: { style: 'single', size: 6, color: 'B8B8B8' } },
      spacing: { before: 80, after: 160 },
    })
  }
  const children = block.runs.length ? block.runs.map(textRun) : [new TextRun('')]
  const paragraphChildren = block.type === 'taskList'
    ? [new TextRun(`[${block.checked ? 'x' : ' '}] `), ...children]
    : children
  const options: ConstructorParameters<typeof Paragraph>[0] = {
    children: paragraphChildren,
    spacing: { after: block.type === 'heading' ? 160 : 100, line: 300 },
    ...(block.type === 'heading' ? { heading: headingLevel(block.level || 1) } : {}),
    ...(block.type === 'bulletList' ? { bullet: { level: block.level } } : {}),
    ...(block.type === 'orderedList'
      ? { numbering: { reference: 'export-numbering', level: Math.min(8, block.level) } }
      : {}),
    ...(block.type === 'blockquote'
      ? {
          indent: { left: 360 },
          border: { left: { style: 'single' as const, size: 12, color: 'A3A3A3', space: 8 } },
        }
      : {}),
    ...(block.type === 'codeBlock' ? { shading: { fill: 'F5F5F5' } } : {}),
  }
  return new Paragraph(options)
}

function headerChildren(document: RenderedDocument): Paragraph[] {
  const children: Paragraph[] = []
  if (document.watermark?.type === 'text') {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({
        text: document.watermark.text,
        bold: true,
        color: document.watermark.color.replace('#', '').toUpperCase(),
        size: 36,
      })],
      spacing: { after: 40 },
    }))
  }
  if (document.layout.header.enabled) {
    children.push(new Paragraph({
      alignment: alignment(document.layout.header.alignment),
      children: [new TextRun(document.layout.header.text)],
    }))
  }
  if (document.layout.pageNumber.enabled && document.layout.pageNumber.position === 'top') {
    children.push(new Paragraph({
      alignment: alignment(document.layout.pageNumber.alignment),
      children: [new TextRun({ children: [PageNumber.CURRENT] })],
    }))
  }
  return children.length ? children : [new Paragraph('')]
}

function footerChildren(document: RenderedDocument): Paragraph[] {
  const children: Paragraph[] = []
  if (document.layout.footer.enabled) {
    children.push(new Paragraph({
      alignment: alignment(document.layout.footer.alignment),
      children: [new TextRun(document.layout.footer.text.replace('{page}', ''))],
    }))
  }
  if (document.layout.pageNumber.enabled && document.layout.pageNumber.position === 'bottom') {
    children.push(new Paragraph({
      alignment: alignment(document.layout.pageNumber.alignment),
      children: [new TextRun({ children: [PageNumber.CURRENT] })],
    }))
  }
  return children.length ? children : [new Paragraph('')]
}

function appendix(document: RenderedDocument): Paragraph[] {
  const children: Paragraph[] = []
  if (document.workflow) {
    children.push(new Paragraph({ text: 'Approval workflow', heading: HeadingLevel.HEADING_1 }))
    children.push(new Paragraph({ children: [new TextRun({ text: `${document.workflow.name}: `, bold: true }), new TextRun(document.workflow.status.replaceAll('-', ' '))] }))
    children.push(new Paragraph({ text: 'Stages', heading: HeadingLevel.HEADING_2 }))
    for (const stage of document.workflow.stages) children.push(new Paragraph({ children: [new TextRun({ text: `${stage.name} - ${stage.status}`, bold: true }), new TextRun(stage.description ? `\n${stage.description}` : '')] }))
    children.push(new Paragraph({ text: 'Audit timeline', heading: HeadingLevel.HEADING_2 }))
    for (const entry of document.workflow.history) children.push(new Paragraph({ children: [new TextRun({ text: `${entry.actorName} - ${entry.action.replaceAll('-', ' ')}: `, bold: true }), new TextRun(`${entry.reason} (${new Date(entry.timestamp).toLocaleString()})`)] }))
  }
  if (document.comments.length) {
    children.push(new Paragraph({ text: 'Comments', heading: HeadingLevel.HEADING_1 }))
    for (const comment of document.comments) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${comment.author.name}: `, bold: true }),
          new TextRun(comment.text),
        ],
      }))
      children.push(new Paragraph({ text: `Selection: ${comment.anchor.quote}` }))
      for (const reply of comment.replies) {
        children.push(new Paragraph({
          indent: { left: 360 },
          children: [
            new TextRun({ text: `${reply.author.name}: `, bold: true }),
            new TextRun(reply.text),
          ],
        }))
      }
    }
  }
  if (document.trackChanges.length) {
    children.push(new Paragraph({ text: 'Tracked changes', heading: HeadingLevel.HEADING_1 }))
    for (const change of document.trackChanges) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${change.author.name} - ${change.type}: `, bold: true }),
          new TextRun(`${change.before} -> ${change.after} (${change.status})`),
        ],
      }))
    }
  }
  return children
}

export async function exportDocx(document: RenderedDocument): Promise<ExportResult> {
  const width = document.layout.orientation === 'portrait'
    ? document.layout.width
    : document.layout.height
  const height = document.layout.orientation === 'portrait'
    ? document.layout.height
    : document.layout.width
  const content: (Paragraph | Table)[] = []
  for (const page of document.pages) {
    if (page.number > 1) content.push(new Paragraph({ pageBreakBefore: true }))
    for (const block of page.blocks) content.push(await blockToDocx(block))
  }
  content.push(...appendix(document))
  const properties: ISectionOptions['properties'] = {
    page: {
      size: {
        width: convertMillimetersToTwip(width),
        height: convertMillimetersToTwip(height),
        orientation: document.layout.orientation === 'landscape'
          ? PageOrientation.LANDSCAPE
          : PageOrientation.PORTRAIT,
      },
      margin: {
        top: convertMillimetersToTwip(document.layout.margins.top),
        right: convertMillimetersToTwip(document.layout.margins.right),
        bottom: convertMillimetersToTwip(document.layout.margins.bottom),
        left: convertMillimetersToTwip(document.layout.margins.left),
      },
    },
    titlePage: document.layout.pageNumber.hideFirstPage,
  }
  const docx = new Document({
    creator: document.options.exportMetadata ? 'Techcodie Document Editor' : undefined,
    title: document.options.exportMetadata ? document.title : undefined,
    description: document.options.exportMetadata ? 'Document export' : undefined,
    numbering: {
      config: [{
        reference: 'export-numbering',
        levels: Array.from({ length: 9 }, (_, level) => ({
          level,
          format: LevelFormat.DECIMAL,
          text: `%${level + 1}.`,
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720 + level * 360, hanging: 360 } } },
        })),
      }],
    },
    sections: [{
      properties,
      headers: { default: new Header({ children: headerChildren(document) }) },
      footers: { default: new Footer({ children: footerChildren(document) }) },
      children: content.length ? content : [new Paragraph('')],
    }],
  })
  const blob = await Packer.toBlob(docx)
  return {
    blob,
    fileName: safeFileName(document.title),
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: blob.size,
  }
}
