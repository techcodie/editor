export interface StructuredEditorContent {
  html: string
  unsupportedBlocks: string[]
}

const ALLOWED_TAGS = [
  'a',
  'blockquote',
  'br',
  'code',
  'del',
  'em',
  'h1',
  'h2',
  'h3',
  'hr',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'strong',
  'ul',
]

const ALLOWED_ATTRIBUTES = [
  'data-checked',
  'data-type',
  'href',
  'start',
  'title',
]

function normalizeHeadings(document: Document): void {
  for (const heading of document.querySelectorAll('h4, h5, h6')) {
    const replacement = document.createElement('h3')
    replacement.innerHTML = heading.innerHTML
    heading.replaceWith(replacement)
  }
}

function normalizeTaskLists(document: Document): void {
  for (const list of document.querySelectorAll('ul')) {
    const taskItems = Array.from(list.children).filter(
      (child): child is HTMLLIElement =>
        child instanceof HTMLLIElement &&
        child.querySelector(':scope > input[type="checkbox"]') !== null,
    )
    if (taskItems.length === 0) continue

    list.setAttribute('data-type', 'taskList')
    for (const item of taskItems) {
      const checkbox = item.querySelector<HTMLInputElement>(
        ':scope > input[type="checkbox"]',
      )
      item.setAttribute('data-type', 'taskItem')
      item.setAttribute('data-checked', checkbox?.checked ? 'true' : 'false')
      checkbox?.remove()
      const leadingText = Array.from(item.childNodes).find(
        (node) => node.nodeType === 3,
      )
      if (leadingText?.textContent) {
        leadingText.textContent = leadingText.textContent.replace(/^\s+/, '')
      }
    }
  }
}

function normalizeTables(document: Document): string[] {
  const tables = Array.from(document.querySelectorAll('table'))
  for (const table of tables) {
    const replacement = document.createDocumentFragment()
    for (const row of table.querySelectorAll('tr')) {
      const paragraph = document.createElement('p')
      paragraph.textContent = Array.from(row.querySelectorAll('th, td'))
        .map((cell) => cell.textContent?.trim() ?? '')
        .join(' | ')
      replacement.append(paragraph)
    }
    table.replaceWith(replacement)
  }
  return tables.length > 0 ? ['table'] : []
}

export async function normalizeAssistantResponse(
  response: string,
): Promise<StructuredEditorContent | null> {
  const trimmedResponse = response.trim()
  if (!trimmedResponse) return null

  const [{ default: DOMPurify }, { marked }] = await Promise.all([
    import('dompurify'),
    import('marked'),
  ])
  const parsed = marked.parse(trimmedResponse, {
    async: false,
    breaks: false,
    gfm: true,
  })
  if (typeof parsed !== 'string') return null

  const document = new DOMParser().parseFromString(parsed, 'text/html')
  normalizeHeadings(document)
  normalizeTaskLists(document)
  const unsupportedBlocks = normalizeTables(document)
  const html = DOMPurify.sanitize(document.body.innerHTML, {
    ALLOWED_ATTR: ALLOWED_ATTRIBUTES,
    ALLOWED_TAGS,
  }).trim()
  const plainText = document.body.textContent?.trim() ?? ''
  if (!html || !plainText) return null

  return {
    html,
    unsupportedBlocks,
  }
}
