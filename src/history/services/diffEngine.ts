import { compareDocuments } from '../../comparison/services/comparisonEngine'
import type { DocumentComparison } from '../../comparison/types/comparison'
import type { CommentAuthor } from '../../review/types/comment'
import { resolveSnapshot } from './snapshotEngine'
import type { Version, VersionSnapshotContent } from '../types/version'

const HISTORY_AUTHOR: CommentAuthor = { id: 'version-history', name: 'Version History' }

export function compareVersionContent(
  leftName: string,
  left: VersionSnapshotContent,
  rightName: string,
  rightText: string,
): DocumentComparison {
  return compareDocuments(
    { id: crypto.randomUUID(), name: leftName, kind: 'version', content: left.text },
    { id: crypto.randomUUID(), name: rightName, kind: rightName === 'Current document' ? 'document' : 'version', content: rightText },
    HISTORY_AUTHOR,
  )
}

export async function compareVersionToCurrent(
  version: Version,
  versions: Version[],
  currentText: string,
): Promise<DocumentComparison> {
  const content = await resolveSnapshot(version, versions)
  return compareVersionContent(version.name, content, 'Current document', currentText)
}

export async function compareVersions(
  left: Version,
  right: Version,
  versions: Version[],
): Promise<DocumentComparison> {
  const [leftContent, rightContent] = await Promise.all([
    resolveSnapshot(left, versions),
    resolveSnapshot(right, versions),
  ])
  return compareVersionContent(left.name, leftContent, right.name, rightContent.text)
}
