import type { DocumentComparison } from '../../comparison/types/comparison'
import { compareVersions, compareVersionToCurrent } from './diffEngine'
import {
  createFullSnapshot,
  createSnapshot,
  hashDocument,
  resolveSnapshot,
} from './snapshotEngine'
import type { HistoryFilter, HistorySort, VersionGroup } from '../types/history'
import type { CreateVersionInput, Version } from '../types/version'

function countWords(value: string): number {
  const text = value.trim()
  return text ? text.split(/\s+/).length : 0
}

function safeName(value: string): string {
  return value.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '') || 'version'
}

function download(content: BlobPart, type: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

export async function createVersion(
  input: CreateVersionInput,
  versions: Version[],
): Promise<Version> {
  const parent = versions[0]
  const parentContent = parent ? await resolveSnapshot(parent, versions) : undefined
  const snapshot = await createSnapshot(
    input.content,
    parent && parentContent ? { id: parent.id, content: parentContent } : undefined,
  )
  const createdAt = Date.now()
  return {
    id: crypto.randomUUID(),
    name: input.name.trim().slice(0, 120) || `Version ${versions.length + 1}`,
    description: input.description?.trim().slice(0, 500) ?? '',
    createdAt,
    author: { ...input.author },
    documentHash: hashDocument(input.content),
    snapshot,
    metadata: {
      reason: input.reason?.trim().slice(0, 240) ?? '',
      comments: input.comments?.trim().slice(0, 1_000) ?? '',
      source: input.source ?? 'manual',
      wordCount: countWords(input.content.text),
      characterCount: input.content.text.length,
      snapshotBytes: snapshot.byteLength,
      bookmarked: false,
      favorite: false,
      parentVersionId: parent?.id,
    },
  }
}

export function updateVersion(
  versions: Version[],
  versionId: string,
  patch: Partial<Pick<Version, 'name' | 'description'>> & {
    reason?: string
    comments?: string
    bookmarked?: boolean
    favorite?: boolean
  },
): Version[] {
  return versions.map((version) => version.id === versionId ? {
    ...version,
    name: patch.name === undefined ? version.name : patch.name.trim().slice(0, 120) || version.name,
    description: patch.description === undefined ? version.description : patch.description.trim().slice(0, 500),
    metadata: {
      ...version.metadata,
      reason: patch.reason === undefined ? version.metadata.reason : patch.reason.trim().slice(0, 240),
      comments: patch.comments === undefined ? version.metadata.comments : patch.comments.trim().slice(0, 1_000),
      bookmarked: patch.bookmarked ?? version.metadata.bookmarked,
      favorite: patch.favorite ?? version.metadata.favorite,
    },
  } : version)
}

export async function deleteVersion(versions: Version[], versionId: string): Promise<Version[]> {
  const next = versions.filter((version) => version.id !== versionId)
  const directChildren = next.filter((version) => version.snapshot.baseVersionId === versionId)
  if (directChildren.length === 0) return next
  const materialized = new Map<string, Version>()
  for (const child of directChildren) {
    const content = await resolveSnapshot(child, versions)
    const snapshot = await createFullSnapshot(content)
    materialized.set(child.id, {
      ...child,
      snapshot,
      metadata: { ...child.metadata, snapshotBytes: snapshot.byteLength, parentVersionId: undefined },
    })
  }
  return next.map((version) => materialized.get(version.id) ?? version)
}

export function filterVersions(
  versions: Version[],
  query: string,
  filter: HistoryFilter,
  sort: HistorySort,
): Version[] {
  const needle = query.trim().toLocaleLowerCase()
  return versions
    .filter((version) => {
      if (filter === 'bookmarked' && !version.metadata.bookmarked) return false
      if (filter === 'favorites' && !version.metadata.favorite) return false
      if (filter === 'manual' && version.metadata.source !== 'manual') return false
      if (filter === 'recovery' && version.metadata.source !== 'recovery') return false
      if (filter === 'workflow' && version.metadata.source !== 'workflow') return false
      if (filter === 'contract' && version.metadata.source !== 'contract') return false
      if (filter === 'writing' && version.metadata.source !== 'writing') return false
      if (!needle) return true
      return [version.name, version.description, version.author.name, version.metadata.reason, version.metadata.comments]
        .some((value) => value.toLocaleLowerCase().includes(needle))
    })
    .toSorted((left, right) => sort === 'oldest'
      ? left.createdAt - right.createdAt
      : sort === 'name'
        ? left.name.localeCompare(right.name)
        : right.createdAt - left.createdAt)
}

export function groupVersions(versions: Version[]): VersionGroup[] {
  const groups = new Map<string, VersionGroup>()
  for (const version of versions) {
    const date = new Date(version.createdAt)
    const id = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    const label = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    const group = groups.get(id) ?? { id, label, versions: [] }
    group.versions.push(version)
    groups.set(id, group)
  }
  return [...groups.values()]
}

export async function exportVersion(version: Version, versions: Version[]) {
  const content = await resolveSnapshot(version, versions)
  download(JSON.stringify({ format: 'techcodie-document-version', version: { ...version, snapshot: undefined }, content }, null, 2), 'application/json', `${safeName(version.name)}.version.json`)
}

export function exportTimeline(versions: Version[]) {
  const rows = [['Name', 'Created', 'Author', 'Reason', 'Comments', 'Hash', 'Words']]
  for (const version of versions) rows.push([
    version.name,
    new Date(version.createdAt).toISOString(),
    version.author.name,
    version.metadata.reason,
    version.metadata.comments,
    version.documentHash,
    String(version.metadata.wordCount),
  ])
  const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n')
  download(csv, 'text/csv;charset=utf-8', 'document-version-timeline.csv')
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

export function exportComparison(comparison: DocumentComparison) {
  const changes = comparison.changes.map((change) => `<tr><td>${escapeHtml(change.type)}</td><td>${escapeHtml(change.before)}</td><td>${escapeHtml(change.after)}</td></tr>`).join('')
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(comparison.leftDocument.name)} comparison</title><style>body{max-width:900px;margin:40px auto;padding:0 24px;color:#171717;font:14px/1.55 Arial,sans-serif}h1{font-size:24px}table{width:100%;border-collapse:collapse}th,td{padding:10px;border:1px solid #ddd;text-align:left;vertical-align:top}th{background:#f5f5f5}</style></head><body><h1>Version comparison</h1><p>${escapeHtml(comparison.summary.description)}</p><table><thead><tr><th>Type</th><th>Before</th><th>After</th></tr></thead><tbody>${changes}</tbody></table></body></html>`
  download(html, 'text/html;charset=utf-8', `${safeName(comparison.leftDocument.name)}-comparison.html`)
}

export { compareVersions, compareVersionToCurrent }
