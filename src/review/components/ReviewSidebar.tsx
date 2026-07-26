import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  ListFilter,
  MessagesSquare,
  Search,
  UserRound,
  X,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { CommentCard } from './CommentCard'
import { CommentThread } from './CommentThread'
import { ReviewNavigator } from './ReviewNavigator'
import { matchesCommentSearch } from '../services/commentRenderer'
import type { Comment } from '../types/comment'
import type { ReviewFilter, ReviewSort } from '../types/review'

interface ReviewSidebarProps {
  isOpen: boolean
  comments: readonly Comment[]
  selectedCommentId: string | null
  currentAuthorId: string
  onClose: () => void
  onSelectComment: (commentId: string | null) => void
  onReply: (commentId: string, text: string) => boolean
  onResolve: (commentId: string, resolved: boolean) => void
  onEdit: (commentId: string, text: string) => boolean
  onDelete: (commentId: string) => boolean
  onJump: (commentId: string) => boolean
}

const FILTERS: readonly {
  id: ReviewFilter
  label: string
  icon: typeof MessagesSquare
}[] = [
  { id: 'active', label: 'Active', icon: MessagesSquare },
  { id: 'resolved', label: 'Resolved', icon: CheckCircle2 },
  { id: 'mine', label: 'Mine', icon: UserRound },
  { id: 'all', label: 'All', icon: ListFilter },
]

export function ReviewSidebar({
  isOpen,
  comments,
  selectedCommentId,
  currentAuthorId,
  onClose,
  onSelectComment,
  onReply,
  onResolve,
  onEdit,
  onDelete,
  onJump,
}: ReviewSidebarProps) {
  const [filter, setFilter] = useState<ReviewFilter>('active')
  const [sort, setSort] = useState<ReviewSort>('newest')
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const selectedComment = selectedCommentId
    ? comments.find((comment) => comment.id === selectedCommentId) ?? null
    : null

  const visibleComments = useMemo(() => {
    const filtered = comments.filter((comment) => {
      if (filter === 'active' && comment.resolved) return false
      if (filter === 'resolved' && !comment.resolved) return false
      if (filter === 'mine' && comment.author.id !== currentAuthorId) return false
      return matchesCommentSearch(comment, query)
    })
    return [...filtered].sort((left, right) =>
      sort === 'newest'
        ? right.updatedAt - left.updatedAt
        : left.updatedAt - right.updatedAt,
    )
  }, [comments, currentAuthorId, filter, query, sort])

  const currentIndex = selectedCommentId
    ? visibleComments.findIndex((comment) => comment.id === selectedCommentId)
    : -1

  const selectAndJump = useCallback(
    (comment: Comment) => {
      onSelectComment(comment.id)
      onJump(comment.id)
    },
    [onJump, onSelectComment],
  )

  const navigateTo = (index: number) => {
    const comment = visibleComments[index]
    if (comment) selectAndJump(comment)
  }

  useEffect(() => {
    if (!isOpen) return
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 120)
    return () => window.clearTimeout(focusTimer)
  }, [isOpen])

  useEffect(() => {
    if (selectedCommentId) contentRef.current?.scrollTo({ top: 0 })
  }, [selectedCommentId])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      if (selectedCommentId) onSelectComment(null)
      else onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onSelectComment, selectedCommentId])

  if (!isOpen) return null

  const activeCount = comments.filter((comment) => !comment.resolved).length
  const resolvedCount = comments.length - activeCount
  const mineCount = comments.filter(
    (comment) => comment.author.id === currentAuthorId,
  ).length
  const counts: Record<ReviewFilter, number> = {
    active: activeCount,
    resolved: resolvedCount,
    mine: mineCount,
    all: comments.length,
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close review sidebar"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] lg:hidden"
      />
      <aside
        id="review-sidebar"
        role="dialog"
        aria-labelledby="review-sidebar-title"
        className="review-sidebar fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-hidden border-l border-neutral-200 bg-white shadow-[var(--document-editor-shadow-overlay)] [animation:review-sidebar-in_180ms_ease-out] sm:max-w-[25rem] lg:sticky lg:top-6 lg:z-30 lg:h-[calc(100vh-3rem)] lg:w-[24rem] lg:rounded-lg lg:border"
      >
        <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700">
            <MessagesSquare size={17} strokeWidth={1.8} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="review-sidebar-title" className="text-sm font-semibold text-neutral-950">
              Review
            </h2>
            <p className="mt-0.5 text-[11px] text-neutral-500">
              {activeCount} active {activeCount === 1 ? 'comment' : 'comments'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ReviewNavigator
              currentIndex={currentIndex}
              total={visibleComments.length}
              onPrevious={() => navigateTo(currentIndex - 1)}
              onNext={() => navigateTo(currentIndex + 1)}
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close review sidebar"
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
            >
              <X size={16} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </header>

        {!selectedComment && (
          <>
            <div className="border-b border-neutral-200 px-3 py-3">
              <label htmlFor="review-comment-search" className="sr-only">
                Search comments
              </label>
              <div className="relative">
                <Search size={15} strokeWidth={1.9} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden />
                <input
                  ref={searchRef}
                  id="review-comment-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search comments"
                  className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 text-xs text-neutral-900 outline-none transition-[background-color,border-color,box-shadow] placeholder:text-neutral-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>
              <nav aria-label="Comment sections" className="mt-2 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {FILTERS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFilter(id)}
                    aria-label={label}
                    aria-pressed={filter === id}
                    className={cn(
                      'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35',
                      filter === id
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-950',
                    )}
                  >
                    <Icon size={13} strokeWidth={1.9} aria-hidden />
                    {label}
                    <span aria-hidden className={filter === id ? 'text-neutral-300' : 'text-neutral-400'}>
                      {counts[id]}
                    </span>
                  </button>
                ))}
              </nav>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[10px] text-neutral-400">
                  {visibleComments.length} shown
                </span>
                <div className="flex rounded-md bg-neutral-100 p-0.5" aria-label="Comment sort order">
                  {(['newest', 'oldest'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSort(value)}
                      aria-pressed={sort === value}
                      className={cn(
                        'h-6 rounded px-2 text-[10px] font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35',
                        sort === value
                          ? 'bg-white text-neutral-900 shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-900',
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {visibleComments.length > 0 ? (
                visibleComments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    onSelect={onSelectComment}
                  />
                ))
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center px-8 text-center">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-400">
                    <MessagesSquare size={18} strokeWidth={1.8} aria-hidden />
                  </span>
                  <p className="text-sm font-semibold text-neutral-900">
                    {query ? 'No matching comments' : 'No comments here'}
                  </p>
                  <p className="mt-1 max-w-56 text-xs leading-5 text-neutral-500">
                    {query
                      ? 'Try another author, phrase, status, or date.'
                      : 'Select text in the document to start a discussion.'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {selectedComment && (
          <div ref={contentRef} className="min-h-0 flex-1">
            <CommentThread
              comment={selectedComment}
              currentAuthorId={currentAuthorId}
              onBack={() => onSelectComment(null)}
              onReply={onReply}
              onResolve={onResolve}
              onEdit={onEdit}
              onDelete={onDelete}
              onJump={onJump}
            />
          </div>
        )}
      </aside>
    </>
  )
}
