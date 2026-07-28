import { appliesToPage } from '../../watermark/services/watermarkEngine'
import type {
  ExportResult,
  RenderedBlock,
  RenderedDocument,
  RenderedMark,
  RenderedText,
} from '../types/export'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function fileName(title: string): string {
  const safe = title.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '')
  return `${safe || 'document'}.html`
}

function markTag(mark: RenderedMark, content: string): string {
  if (mark.type === 'bold') return `<strong>${content}</strong>`
  if (mark.type === 'italic') return `<em>${content}</em>`
  if (mark.type === 'underline') return `<u>${content}</u>`
  if (mark.type === 'strike') return `<s>${content}</s>`
  if (mark.type === 'code') return `<code>${content}</code>`
  if (mark.type === 'highlight') return `<mark>${content}</mark>`
  if (mark.type === 'link') {
    const href = typeof mark.attrs.href === 'string' ? mark.attrs.href : '#'
    return `<a href="${escapeHtml(href)}">${content}</a>`
  }
  if (mark.type === 'reviewComment') {
    const id = escapeHtml(String(mark.attrs.commentId ?? ''))
    return `<span class="comment" data-comment-id="${id}">${content}</span>`
  }
  if (mark.type === 'trackChange') {
    const segment = mark.attrs.segment === 'deletion' ? 'deletion' : 'insertion'
    return `<span class="suggestion ${segment}">${content}</span>`
  }
  return content
}

function renderRun(run: RenderedText): string {
  return run.marks.reduce(
    (content, mark) => markTag(mark, content),
    escapeHtml(run.text).replaceAll('\n', '<br>'),
  )
}

function renderBlock(block: RenderedBlock): string {
  const content = block.runs.map(renderRun).join('') || '&nbsp;'
  if (block.formField) {
    const field = block.formField
    if (field.visibility === 'hidden') return ''
    const id = escapeHtml(field.id)
    const label = escapeHtml(field.label || 'Unlabelled field')
    const required = field.required ? ' required' : ''
    const readonly = field.readonly ? ' readonly' : ''
    const placeholder = escapeHtml(field.placeholder)
    const metadata = escapeHtml(JSON.stringify(field))
    let control: string
    if (field.type === 'paragraph') control = `<textarea id="${id}" name="${id}" placeholder="${placeholder}"${required}${readonly}>${escapeHtml(String(field.defaultValue))}</textarea>`
    else if (field.type === 'checkbox') control = `<label class="form-choice"><input id="${id}" name="${id}" type="checkbox"${field.defaultValue ? ' checked' : ''}${required}${field.readonly ? ' disabled' : ''}> ${placeholder || label}</label>`
    else if (field.type === 'radio-group') control = `<div class="form-options">${field.options.map((option) => `<label><input type="radio" name="${id}" value="${escapeHtml(option.value)}"${field.defaultValue === option.value ? ' checked' : ''}${required}${field.readonly ? ' disabled' : ''}> ${escapeHtml(option.label)}</label>`).join('')}</div>`
    else if (field.type === 'dropdown') control = `<select id="${id}" name="${id}"${required}${field.readonly ? ' disabled' : ''}><option value="">${placeholder || 'Select an option'}</option>${field.options.map((option) => `<option value="${escapeHtml(option.value)}"${field.defaultValue === option.value ? ' selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}</select>`
    else if (field.type === 'signature' || field.type === 'initials') control = `<div class="signature-placeholder" role="img" aria-label="${placeholder || label}">${placeholder || label}</div>`
    else if (field.type === 'file-upload') control = `<input id="${id}" name="${id}" type="file"${required}${field.readonly ? ' disabled' : ''}>`
    else {
      const type = field.type === 'phone' ? 'tel' : field.type === 'currency' ? 'number' : field.type
      const constraints = `${field.validation.minLength === undefined ? '' : ` minlength="${field.validation.minLength}"`}${field.validation.maxLength === undefined ? '' : ` maxlength="${field.validation.maxLength}"`}${field.validation.pattern ? ` pattern="${escapeHtml(field.validation.pattern)}"` : ''}`
      control = `<input id="${id}" name="${id}" type="${type}" value="${escapeHtml(String(field.defaultValue))}" placeholder="${placeholder}"${required}${readonly}${constraints}>`
    }
    return `<div class="form-field" data-field-definition="${metadata}" style="width:${field.width}%"><label for="${id}">${label}${field.required ? ' <span aria-label="required">*</span>' : ''}</label>${control}${field.helpText ? `<small>${escapeHtml(field.helpText)}</small>` : ''}</div>`
  }
  if (block.asset) {
    return `<figure class="asset" aria-label="${escapeHtml(block.asset.title)}">${block.asset.svg}<figcaption>${escapeHtml(block.asset.title)}</figcaption></figure>`
  }
  if (block.rows) {
    const rows = block.rows.map((row) => `<tr>${row.map((cell) =>
      `<td>${cell.blocks.map(renderBlock).join('')}</td>`,
    ).join('')}</tr>`).join('')
    return `<table><tbody>${rows}</tbody></table>`
  }
  if (block.type === 'heading') {
    const level = Math.min(6, Math.max(1, block.level || 1))
    return `<h${level}>${content}</h${level}>`
  }
  if (block.type === 'bulletList') return `<p class="list" data-list="bullet">• ${content}</p>`
  if (block.type === 'orderedList') return `<p class="list" data-list="ordered">${content}</p>`
  if (block.type === 'taskList') return `<p class="list">${block.checked ? '☑' : '☐'} ${content}</p>`
  if (block.type === 'blockquote') return `<blockquote>${content}</blockquote>`
  if (block.type === 'codeBlock') return `<pre><code>${content}</code></pre>`
  if (block.type === 'horizontalRule') return '<hr>'
  return `<p>${content}</p>`
}

function watermarkHtml(document: RenderedDocument, pageNumber: number): string {
  const watermark = document.watermark
  if (!watermark || !appliesToPage(watermark, pageNumber, document.currentPage)) return ''
  const position = watermark.position === 'custom'
    ? watermark.customPosition
    : {
        center: { x: 50, y: 50 },
        'top-left': { x: 20, y: 18 },
        'top-right': { x: 80, y: 18 },
        'bottom-left': { x: 20, y: 82 },
        'bottom-right': { x: 80, y: 82 },
      }[watermark.position]
  const style = `left:${position.x}%;top:${position.y}%;opacity:${watermark.opacity / 100};transform:translate(-50%,-50%) rotate(${watermark.rotation}deg) scale(${watermark.scale / 100})`
  if (watermark.type === 'text') {
    return `<div class="watermark" style="${style};color:${escapeHtml(watermark.color)}">${escapeHtml(watermark.text)}</div>`
  }
  if (!watermark.image) return ''
  return `<div class="watermark watermark-image" style="${style}"><img alt="" src="${escapeHtml(watermark.image.source)}"></div>`
}

function commentsHtml(document: RenderedDocument): string {
  if (document.comments.length === 0) return ''
  return `<section class="appendix"><h2>Comments</h2>${document.comments.map((comment) =>
    `<article><strong>${escapeHtml(comment.author.name)}</strong><p>${escapeHtml(comment.text)}</p><small>Selection: ${escapeHtml(comment.anchor.quote)}</small>${comment.replies.map((reply) => `<p class="reply"><strong>${escapeHtml(reply.author.name)}:</strong> ${escapeHtml(reply.text)}</p>`).join('')}</article>`,
  ).join('')}</section>`
}

function changesHtml(document: RenderedDocument): string {
  if (document.trackChanges.length === 0) return ''
  return `<section class="appendix"><h2>Tracked changes</h2>${document.trackChanges.map((change) =>
    `<article><strong>${escapeHtml(change.author.name)} · ${escapeHtml(change.type)}</strong><p>${escapeHtml(change.before)} → ${escapeHtml(change.after)}</p><small>${escapeHtml(change.status)}</small></article>`,
  ).join('')}</section>`
}

export async function exportHtml(document: RenderedDocument): Promise<ExportResult> {
  const { layout } = document
  const width = layout.orientation === 'portrait' ? layout.width : layout.height
  const height = layout.orientation === 'portrait' ? layout.height : layout.width
  const pages = document.pages.map((page) => `
    <section class="page" aria-label="Page ${page.number}">
      ${watermarkHtml(document, page.number)}
      <header>${layout.header.enabled ? escapeHtml(layout.header.text) : ''}${layout.pageNumber.enabled && layout.pageNumber.position === 'top' && !(layout.pageNumber.hideFirstPage && page.number === 1) ? `<span class="page-number ${layout.pageNumber.alignment}">${page.number}</span>` : ''}</header>
      <main>${page.blocks.map(renderBlock).join('')}</main>
      <footer>${layout.footer.enabled ? escapeHtml(layout.footer.text.replace('{page}', String(page.number))) : ''}${layout.pageNumber.enabled && layout.pageNumber.position === 'bottom' && !(layout.pageNumber.hideFirstPage && page.number === 1) ? `<span class="page-number ${layout.pageNumber.alignment}">${page.number}</span>` : ''}</footer>
    </section>`,
  ).join('')
  const metadata = document.options.exportMetadata
    ? `<meta name="generator" content="Techcodie Document Editor"><meta name="created" content="${new Date(document.createdAt).toISOString()}">`
    : ''
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(document.title)}</title>${metadata}<style>
    *{box-sizing:border-box}html{background:#e5e7eb}body{margin:0;color:#171717;font:11pt/1.6 Arial,sans-serif}.page{position:relative;width:${width}mm;min-height:${height}mm;margin:12mm auto;padding:${layout.margins.top}mm ${layout.margins.right}mm ${layout.margins.bottom}mm ${layout.margins.left}mm;background:#fff;box-shadow:0 2px 16px #0002;overflow:hidden;break-after:page}.page>header,.page>footer{position:absolute;left:${layout.margins.left}mm;right:${layout.margins.right}mm;z-index:1;color:#737373;font-size:9pt;text-align:${layout.header.alignment}}.page>header{top:8mm}.page>footer{bottom:8mm;text-align:${layout.footer.alignment}}.page>main{position:relative;z-index:1}.page-number{display:block}.page-number.left{text-align:left}.page-number.center{text-align:center}.page-number.right{text-align:right}h1,h2,h3{line-height:1.25;margin:0 0 12pt}p{margin:0 0 9pt}.list{padding-left:18pt}blockquote{margin:0 0 12pt;padding-left:12pt;border-left:3px solid #a3a3a3;color:#525252}pre{padding:10pt;background:#f5f5f5;white-space:pre-wrap}code{font-family:monospace}table{width:100%;border-collapse:collapse;margin:0 0 12pt}td{border:1px solid #d4d4d4;padding:6pt;vertical-align:top}.asset{text-align:center;margin:12pt 0}.asset svg,.asset img{max-width:100%;height:auto}.asset figcaption{font-size:8pt;color:#737373}.form-field{margin:0 0 12pt}.form-field>label{display:block;margin-bottom:4pt;font-size:9pt;font-weight:700}.form-field input:not([type=checkbox]):not([type=radio]),.form-field textarea,.form-field select{width:100%;min-height:28pt;padding:6pt 8pt;border:1px solid #a3a3a3;border-radius:4pt;background:#fff;font:inherit}.form-field textarea{min-height:60pt}.form-field small{display:block;margin-top:3pt;color:#737373}.form-options{display:grid;gap:3pt}.signature-placeholder{min-height:38pt;padding-top:20pt;border-bottom:1px solid #525252;color:#737373;font-style:italic}.watermark{position:absolute;z-index:0;font-size:46pt;font-weight:700;white-space:nowrap;pointer-events:none}.watermark-image img{display:block;max-width:90mm;max-height:90mm}.comment{background:#fef3c7}.suggestion.insertion{text-decoration:underline;text-decoration-color:#16a34a}.suggestion.deletion{text-decoration:line-through;color:#b91c1c}.appendix{width:${width}mm;margin:12mm auto;padding:18mm;background:#fff}.appendix article{padding:8pt 0;border-bottom:1px solid #e5e5e5}.appendix p{margin:3pt 0}.appendix small{color:#737373}.reply{padding-left:12pt}@media print{html{background:#fff}.page,.appendix{margin:0;box-shadow:none}@page{size:${width}mm ${height}mm;margin:0}}
  </style></head><body>${pages}${commentsHtml(document)}${changesHtml(document)}</body></html>`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  return { blob, fileName: fileName(document.title), mimeType: blob.type, size: blob.size }
}
