import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  ListFilter,
  MessagesSquare,
  Search,
  UserRound,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { PanelShell } from '../../components/ui/PanelShell'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
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
    if (selectedCommentId) contentRef.current?.scrollTo({ top: 0 })
  }, [selectedCommentId])

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
    <PanelShell
      isOpen={isOpen}
      onClose={onClose}
      onEscape={() => (selectedCommentId ? onSelectComment(null) : onClose())}
      initialFocusSelector="#review-comment-search"
      title="Review"
      subtitle={`${activeCount} active ${activeCount === 1 ? 'comment' : 'comments'}`}
      icon={MessagesSquare}
      labelledById="review-sidebar-title"
      panelId="review-sidebar"
      className="review-sidebar"
      headerActions={
        <ReviewNavigator
          currentIndex={currentIndex}
          total={visibleComments.length}
          onPrevious={() => navigateTo(currentIndex - 1)}
          onNext={() => navigateTo(currentIndex + 1)}
        />
      }
    >
      {!selectedComment && (
        <>
          <div className="border-b border-neutral-200 px-3 py-3">
            <label htmlFor="review-comment-search" className="sr-only">
              Search comments
            </label>
            <Input
              icon={Search}
              id="review-comment-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search comments"
            />
            <nav aria-label="Comment sections" className="mt-2 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTERS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  aria-label={label}
                  aria-pressed={filter === id}
                  className={cn(
                    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]',
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
                      'h-6 rounded px-2 text-[10px] font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]',
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
              <EmptyState
                icon={MessagesSquare}
                title={query ? 'No matching comments' : 'No comments here'}
                description={
                  query
                    ? 'Try another author, phrase, status, or date.'
                    : 'Select text in the document to start a discussion.'
                }
              />
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
    </PanelShell>
  )
}
