import type { Comment } from '../types/comment'

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
})

export function formatCommentDate(timestamp: number): string {
  const date = new Date(timestamp)
  const today = new Date()
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  return isToday ? TIME_FORMATTER.format(date) : DATE_FORMATTER.format(date)
}

export function getCommentPreview(comment: Comment, maximumLength = 120): string {
  const text = comment.text.replace(/\s+/g, ' ').trim()
  return text.length > maximumLength ? `${text.slice(0, maximumLength - 1)}…` : text
}

export function matchesCommentSearch(comment: Comment, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return true

  const date = new Date(comment.createdAt)
  const searchable = [
    comment.author.name,
    comment.text,
    comment.status,
    comment.resolved ? 'resolved' : 'active',
    comment.anchor.quote,
    date.toISOString(),
    DATE_FORMATTER.format(date),
    ...comment.replies.flatMap((reply) => [reply.author.name, reply.text]),
  ]
    .join(' ')
    .toLocaleLowerCase()

  return normalized.split(/\s+/).every((term) => searchable.includes(term))
}
