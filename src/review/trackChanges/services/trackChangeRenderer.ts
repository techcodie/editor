import type { TrackChange } from '../types/trackChange'

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
})

export function formatTrackChangeDate(timestamp: number): string {
  const date = new Date(timestamp)
  const today = new Date()
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  return isToday ? TIME_FORMATTER.format(date) : DATE_FORMATTER.format(date)
}
export function getTrackChangeLabel(change: TrackChange): string {
  if (change.type === 'insert') return 'Inserted text'
  if (change.type === 'delete') return 'Deleted text'
  if (change.type === 'replace') return 'Replaced text'
  return 'Changed formatting'
}

export function matchesTrackChangeSearch(
  change: TrackChange,
  query: string,
): boolean {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return true

  const date = new Date(change.createdAt)
  const searchable = [
    change.author.name,
    change.type,
    change.status,
    change.before,
    change.after,
    date.toISOString(),
    DATE_FORMATTER.format(date),
  ]
    .join(' ')
    .toLocaleLowerCase()

  return normalized.split(/\s+/).every((term) => searchable.includes(term))
}
