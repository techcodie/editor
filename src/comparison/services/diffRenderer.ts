import type { DiffSegment } from '../types/diff'

export function createDiffLines(segments: DiffSegment[]): DiffSegment[][] {
  const lines: DiffSegment[][] = [[]]
  for (const segment of segments) {
    const parts = segment.value.split('\n')
    parts.forEach((part, index) => {
      if (part) {
        lines[lines.length - 1].push({
          ...segment,
          id: `${segment.id}-part-${index}`,
          value: part,
        })
      }
      if (index < parts.length - 1) lines.push([])
    })
  }
  return lines
}
