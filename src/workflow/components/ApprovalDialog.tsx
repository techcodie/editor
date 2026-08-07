import { useState } from 'react'
import { Check, FileText, LoaderCircle, MessageSquareText, SkipForward } from 'lucide-react'
import { Dialog } from '../../components/ui/Dialog'
import type { Comment, CommentAuthor } from '../../review/types/comment'
import type { ApprovalDecision, ApprovalReviewer } from '../types/approval'

export type ApprovalDialogMode = ApprovalDecision | 'note'

interface ApprovalDialogValue {
  actorId: string
  actorName: string
  reason: string
  notes: string
  linkedCommentIds: string[]
}

interface ApprovalDialogProps {
  mode: ApprovalDialogMode
  reviewers: ApprovalReviewer[]
  comments: Comment[]
  author: CommentAuthor
  busy: boolean
  onSubmit: (value: ApprovalDialogValue) => void
  onCancel: () => void
}

const content: Record<ApprovalDialogMode, { title: string; description: string; button: string }> = {
  approve: { title: 'Approve stage', description: 'Record approval for the selected reviewer.', button: 'Approve' },
  reject: { title: 'Reject workflow', description: 'End this review and record the reason.', button: 'Reject' },
  'request-changes': { title: 'Request changes', description: 'Return the document for revision with clear guidance.', button: 'Request changes' },
  'skip-stage': { title: 'Skip stage', description: 'Continue to the next review stage and preserve this audit event.', button: 'Skip stage' },
  note: { title: 'Add review note', description: 'Add context to the workflow without changing its status.', button: 'Add note' },
}

const FIELD_LABEL_CLASS = 'text-[9px] font-semibold text-neutral-600'
const FIELD_FOCUS_CLASS = 'outline-none focus:border-neutral-300 focus:ring-2 focus:ring-[var(--document-editor-focus-ring)]'

export function ApprovalDialog({ mode, reviewers, comments, author, busy, onSubmit, onCancel }: ApprovalDialogProps) {
  const [reviewerId, setReviewerId] = useState(reviewers[0]?.id ?? author.id)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [linkedCommentIds, setLinkedCommentIds] = useState<string[]>([])
  const selectedReviewer = reviewers.find((reviewer) => reviewer.id === reviewerId)
  const needsReviewer = !['note', 'skip-stage'].includes(mode)

  const submit = () => {
    const actor = needsReviewer ? selectedReviewer : author
    if (!actor || (mode !== 'note' && !reason.trim()) || (mode === 'note' && !notes.trim())) return
    onSubmit({ actorId: actor.id, actorName: actor.name, reason, notes, linkedCommentIds })
  }

  return (
    <Dialog
      isOpen
      onClose={onCancel}
      disableClose={busy}
      title={content[mode].title}
      subtitle={content[mode].description}
      icon={FileText}
      iconTone="accent"
      maxWidthClassName="max-w-md"
      footer={
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-8 rounded-md px-3 text-[10px] font-semibold text-neutral-600 hover:bg-white disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || (mode !== 'note' && !reason.trim()) || (mode === 'note' && !notes.trim()) || (needsReviewer && !selectedReviewer)}
            className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-[10px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] disabled:opacity-40 ${mode === 'reject' ? 'bg-red-600 hover:bg-red-500' : 'bg-neutral-900 hover:bg-neutral-800'}`}
          >
            {busy ? <LoaderCircle size={12} className="animate-spin" aria-hidden /> : mode === 'skip-stage' ? <SkipForward size={12} aria-hidden /> : <Check size={12} aria-hidden />}
            {content[mode].button}
          </button>
        </div>
      }
    >
      {needsReviewer && (
        <label className="block">
          <span className={FIELD_LABEL_CLASS}>Acting reviewer</span>
          <select
            value={reviewerId}
            onChange={(event) => setReviewerId(event.target.value)}
            className={`mt-1 h-9 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-[11px] ${FIELD_FOCUS_CLASS}`}
          >
            {reviewers.map((reviewer) => <option key={reviewer.id} value={reviewer.id}>{reviewer.name}</option>)}
          </select>
        </label>
      )}
      {mode !== 'note' && (
        <label className="block">
          <span className={FIELD_LABEL_CLASS}>Reason</span>
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            placeholder="Required audit reason"
            className={`mt-1 h-9 w-full rounded-md border border-neutral-200 px-2.5 text-[11px] ${FIELD_FOCUS_CLASS}`}
          />
        </label>
      )}
      <label className="block">
        <span className={FIELD_LABEL_CLASS}>{mode === 'note' ? 'Note' : 'Decision notes'}</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Add context for the audit trail"
          className={`mt-1 w-full resize-none rounded-md border border-neutral-200 p-2.5 text-[11px] leading-5 ${FIELD_FOCUS_CLASS}`}
        />
      </label>
      {comments.length > 0 && (
        <fieldset>
          <legend className="flex items-center gap-1.5 text-[9px] font-semibold text-neutral-600">
            <MessageSquareText size={11} aria-hidden />Link comments
          </legend>
          <div className="mt-1.5 max-h-32 space-y-1 overflow-y-auto rounded-md border border-neutral-200 p-1.5">
            {comments.map((comment) => (
              <label key={comment.id} className="flex cursor-pointer items-start gap-2 rounded p-1.5 hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={linkedCommentIds.includes(comment.id)}
                  onChange={(event) => setLinkedCommentIds((current) => event.target.checked ? [...current, comment.id] : current.filter((id) => id !== comment.id))}
                  className="mt-0.5 h-3 w-3 accent-indigo-600"
                />
                <span className="min-w-0">
                  <span className="block truncate text-[9px] font-semibold text-neutral-700">{comment.author.name}</span>
                  <span className="line-clamp-2 text-[9px] leading-4 text-neutral-500">{comment.text}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </Dialog>
  )
}
