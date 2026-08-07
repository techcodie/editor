/**
 * Google Docs always wraps its clipboard HTML payload in exactly one
 * `<b id="docs-internal-guid-...">...</b>` container (a `font-weight:normal`
 * `<b>`, never real bold — purely a marker Google's own clipboard writer
 * adds). `<b>` isn't valid HTML around block-level `<p>` children, so the
 * browser's own HTML parser reparents/splits it while parsing the clipboard
 * payload into a DOM tree, which was leaving a stray empty paragraph in the
 * pasted content. Unwrapping it before ProseMirror's DOM parser sees it
 * removes that artifact without touching paste from any other source.
 */
const GOOGLE_DOCS_WRAPPER = /^([\s\S]*?)<b[^>]*\bid="docs-internal-guid-[^"]*"[^>]*>([\s\S]*)<\/b>([\s\S]*)$/i

export function transformPastedHtml(html: string): string {
  const match = html.match(GOOGLE_DOCS_WRAPPER)
  if (!match) return html
  const [, before, inner, after] = match
  return `${before}${inner}${after}`
}
