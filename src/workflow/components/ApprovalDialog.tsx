import { useEffect, useRef, useState } from 'react'
import { Check, FileText, LoaderCircle, MessageSquareText, SkipForward, X } from 'lucide-react'
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

export function ApprovalDialog({ mode, reviewers, comments, author, busy, onSubmit, onCancel }: ApprovalDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const busyRef = useRef(busy)
  busyRef.current = busy
  const [reviewerId, setReviewerId] = useState(reviewers[0]?.id ?? author.id)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [linkedCommentIds, setLinkedCommentIds] = useState<string[]>([])
  const selectedReviewer = reviewers.find((reviewer) => reviewer.id === reviewerId)
  const needsReviewer = !['note', 'skip-stage'].includes(mode)

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null
    requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>('select, input, textarea, button')?.focus())
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) { event.preventDefault(); onCancel(); return }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])')]
      const first = focusable[0]; const last = focusable[focusable.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', handle)
    return () => {
      window.removeEventListener('keydown', handle)
      requestAnimationFrame(() => {
        if (previousFocusRef.current?.isConnected) previousFocusRef.current.focus()
        else document.querySelector<HTMLElement>('#workflow-panel [aria-label="Close approval workflow"]')?.focus()
      })
    }
  }, [onCancel])

  const submit = () => {
    const actor = needsReviewer ? selectedReviewer : author
    if (!actor || (mode !== 'note' && !reason.trim()) || (mode === 'note' && !notes.trim())) return
    onSubmit({ actorId: actor.id, actorName: actor.name, reason, notes, linkedCommentIds })
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-neutral-950/35 p-4 backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel() }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="approval-dialog-title" className="w-full max-w-md overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
        <header className="flex items-start gap-3 border-b border-neutral-200 px-4 py-4 dark:border-neutral-800"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"><FileText size={15} aria-hidden /></span><div className="min-w-0 flex-1"><h2 id="approval-dialog-title" className="text-sm font-semibold text-neutral-950 dark:text-neutral-100">{content[mode].title}</h2><p className="mt-0.5 text-[10px] leading-4 text-neutral-500">{content[mode].description}</p></div><button type="button" onClick={onCancel} disabled={busy} aria-label="Close approval dialog" className="flex h-7 w-7 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 dark:hover:bg-neutral-800"><X size={14} aria-hidden /></button></header>
        <div className="max-h-[65vh] space-y-3 overflow-y-auto p-4">
          {needsReviewer && <label className="block"><span className="text-[9px] font-semibold text-neutral-600 dark:text-neutral-300">Acting reviewer</span><select value={reviewerId} onChange={(event) => setReviewerId(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-[11px] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 dark:border-neutral-700 dark:bg-neutral-900">{reviewers.map((reviewer) => <option key={reviewer.id} value={reviewer.id}>{reviewer.name}</option>)}</select></label>}
          {mode !== 'note' && <label className="block"><span className="text-[9px] font-semibold text-neutral-600 dark:text-neutral-300">Reason</span><input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder="Required audit reason" className="mt-1 h-9 w-full rounded-md border border-neutral-200 px-2.5 text-[11px] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 dark:border-neutral-700 dark:bg-neutral-900" /></label>}
          <label className="block"><span className="text-[9px] font-semibold text-neutral-600 dark:text-neutral-300">{mode === 'note' ? 'Note' : 'Decision notes'}</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} rows={4} placeholder="Add context for the audit trail" className="mt-1 w-full resize-none rounded-md border border-neutral-200 p-2.5 text-[11px] leading-5 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 dark:border-neutral-700 dark:bg-neutral-900" /></label>
          {comments.length > 0 && <fieldset><legend className="flex items-center gap-1.5 text-[9px] font-semibold text-neutral-600 dark:text-neutral-300"><MessageSquareText size={11} aria-hidden />Link comments</legend><div className="mt-1.5 max-h-32 space-y-1 overflow-y-auto rounded-md border border-neutral-200 p-1.5 dark:border-neutral-800">{comments.map((comment) => <label key={comment.id} className="flex cursor-pointer items-start gap-2 rounded p-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-900"><input type="checkbox" checked={linkedCommentIds.includes(comment.id)} onChange={(event) => setLinkedCommentIds((current) => event.target.checked ? [...current, comment.id] : current.filter((id) => id !== comment.id))} className="mt-0.5 h-3 w-3 accent-indigo-600" /><span className="min-w-0"><span className="block truncate text-[9px] font-semibold text-neutral-700 dark:text-neutral-300">{comment.author.name}</span><span className="line-clamp-2 text-[9px] leading-4 text-neutral-500">{comment.text}</span></span></label>)}</div></fieldset>}
        </div>
        <footer className="flex justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"><button type="button" onClick={onCancel} disabled={busy} className="h-8 rounded-md px-3 text-[10px] font-semibold text-neutral-600 hover:bg-white disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800">Cancel</button><button type="button" onClick={submit} disabled={busy || (mode !== 'note' && !reason.trim()) || (mode === 'note' && !notes.trim()) || (needsReviewer && !selectedReviewer)} className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-[10px] font-semibold text-white disabled:opacity-40 ${mode === 'reject' ? 'bg-red-600 hover:bg-red-500' : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200'}`}>{busy ? <LoaderCircle size={12} className="animate-spin" aria-hidden /> : mode === 'skip-stage' ? <SkipForward size={12} aria-hidden /> : <Check size={12} aria-hidden />}{content[mode].button}</button></footer>
      </div>
    </div>
  )
}
