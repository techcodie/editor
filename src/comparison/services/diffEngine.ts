import { diffWordsWithSpace } from 'diff'
import type { CommentAuthor } from '../../review/types/comment'
import type {
  TrackChange,
  TrackChangeType,
} from '../../review/trackChanges/types/trackChange'
import type { DiffResult, DiffSegment } from '../types/diff'

interface MutablePosition {
  left: number
  right: number
}

const MARKDOWN_FORMATTING = /(?:\*\*|__|~~|`|[*_#>])/g

function formattingComparable(value: string): string {
  return value.replace(MARKDOWN_FORMATTING, '').replace(/\s+/g, ' ').trim()
}

function classifyPair(before: string, after: string): TrackChangeType {
  const left = formattingComparable(before)
  const right = formattingComparable(after)
  return left.length > 0 && left === right ? 'format' : 'replace'
}

function createChange(
  id: string,
  type: TrackChangeType,
  before: string,
  after: string,
  range: { from: number; to: number },
  author: CommentAuthor,
  createdAt: number,
): TrackChange {
  return {
    id,
    type,
    author,
    createdAt,
    updatedAt: createdAt,
    status: 'pending',
    accepted: false,
    rejected: false,
    range,
    before,
    after,
  }
}

function unchangedSegment(
  id: string,
  value: string,
  position: MutablePosition,
): DiffSegment {
  const segment = {
    id,
    changeId: null,
    type: null,
    role: 'unchanged' as const,
    value,
    leftStart: position.left,
    leftEnd: position.left + value.length,
    rightStart: position.right,
    rightEnd: position.right + value.length,
  }
  position.left += value.length
  position.right += value.length
  return segment
}

export function createDocumentDiff(
  left: string,
  right: string,
  comparisonId: string,
  author: CommentAuthor,
  createdAt: number,
): DiffResult {
  const leftComparable = formattingComparable(left)
  const rightComparable = formattingComparable(right)
  if (
    left !== right &&
    leftComparable.length > 0 &&
    leftComparable === rightComparable
  ) {
    const changeId = `${comparisonId}-change-0`
    return {
      changes: [
        createChange(
          changeId,
          'format',
          left,
          right,
          { from: 0, to: right.length },
          author,
          createdAt,
        ),
      ],
      segments: [
        {
          id: `${changeId}-before`,
          changeId,
          type: 'format',
          role: 'before',
          value: left,
          leftStart: 0,
          leftEnd: left.length,
          rightStart: 0,
          rightEnd: 0,
        },
        {
          id: `${changeId}-after`,
          changeId,
          type: 'format',
          role: 'after',
          value: right,
          leftStart: left.length,
          leftEnd: left.length,
          rightStart: 0,
          rightEnd: right.length,
        },
      ],
    }
  }

  const rawChanges = diffWordsWithSpace(left, right)
  const changes: TrackChange[] = []
  const segments: DiffSegment[] = []
  const position: MutablePosition = { left: 0, right: 0 }
  let changeIndex = 0

  for (let index = 0; index < rawChanges.length; index += 1) {
    const current = rawChanges[index]
    if (!current.added && !current.removed) {
      segments.push(
        unchangedSegment(`${comparisonId}-segment-${segments.length}`, current.value, position),
      )
      continue
    }

    const next = rawChanges[index + 1]
    const isPair = Boolean(
      next &&
        ((current.removed && next.added) || (current.added && next.removed)),
    )
    const removed = isPair
      ? current.removed
        ? current
        : next
      : current.removed
        ? current
        : null
    const added = isPair
      ? current.added
        ? current
        : next
      : current.added
        ? current
        : null
    const before = removed?.value ?? ''
    const after = added?.value ?? ''
    const type: TrackChangeType = isPair
      ? classifyPair(before, after)
      : removed
        ? 'delete'
        : 'insert'
    const changeId = `${comparisonId}-change-${changeIndex}`
    const leftStart = position.left
    const rightStart = position.right

    if (before) {
      segments.push({
        id: `${changeId}-before`,
        changeId,
        type,
        role: 'before',
        value: before,
        leftStart,
        leftEnd: leftStart + before.length,
        rightStart,
        rightEnd: rightStart,
      })
      position.left += before.length
    }
    if (after) {
      segments.push({
        id: `${changeId}-after`,
        changeId,
        type,
        role: 'after',
        value: after,
        leftStart: position.left,
        leftEnd: position.left,
        rightStart,
        rightEnd: rightStart + after.length,
      })
      position.right += after.length
    }

    changes.push(
      createChange(
        changeId,
        type,
        before,
        after,
        { from: rightStart, to: Math.max(rightStart, position.right) },
        author,
        createdAt + changeIndex,
      ),
    )
    changeIndex += 1
    if (isPair) index += 1
  }

  return { changes, segments }
}
