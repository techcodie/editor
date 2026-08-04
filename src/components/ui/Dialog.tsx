import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { MOTION } from './motion'
import { useFocusTrap } from './useFocusTrap'

const ICON_TONE_CLASS = {
  neutral: 'bg-neutral-100 text-neutral-700',
  accent: 'bg-[var(--document-editor-info-surface)] text-[var(--document-editor-info)]',
  danger: 'bg-[var(--document-editor-danger-surface)] text-[var(--document-editor-danger)]',
} as const

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  icon?: LucideIcon
  iconTone?: keyof typeof ICON_TONE_CLASS
  /** Disables Escape/close-button dismissal, e.g. while a blocking operation is in flight. */
  disableClose?: boolean
  footer?: ReactNode
  children: ReactNode
  maxWidthClassName?: string
  labelledById?: string
  describedById?: string
  /** DOM id for the dialog container, useful as an `aria-controls` target from the trigger button. */
  id?: string
}

/**
 * Shared centered-modal shell. Consolidates the 7 independently hand-rolled
 * dialogs across the codebase (each with duplicated focus-trap logic) into a
 * single implementation on top of `useFocusTrap`.
 */
export function Dialog({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconTone = 'accent',
  disableClose,
  footer,
  children,
  maxWidthClassName = 'max-w-[34rem]',
  labelledById = 'de-dialog-title',
  describedById,
  id,
}: DialogProps) {
  const containerRef = useFocusTrap<HTMLDivElement>(
    isOpen,
    disableClose ? undefined : onClose,
    '[data-dialog-close]',
  )

  if (!isOpen) return null

  return (
    <div className={cn('fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/35 p-3 backdrop-blur-[2px] sm:p-6', MOTION.backdropIn)}>
      <div
        ref={containerRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        aria-describedby={describedById}
        className={cn(
          'flex max-h-[min(90vh,46rem)] w-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white text-neutral-950 shadow-[var(--document-editor-shadow-overlay)]',
          MOTION.dialogIn,
          maxWidthClassName,
        )}
      >
        <header className="flex h-14 shrink-0 items-center border-b border-neutral-200 px-4">
          {Icon && (
            <span className={cn('flex h-8 w-8 items-center justify-center rounded-md', ICON_TONE_CLASS[iconTone])}>
              <Icon size={16} aria-hidden />
            </span>
          )}
          <div className={cn('min-w-0', Icon && 'ml-3')}>
            <h2 id={labelledById} className="text-sm font-semibold">{title}</h2>
            {subtitle && (
              <p id={describedById} className="text-[10px] text-neutral-500">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            data-dialog-close
            onClick={onClose}
            disabled={disableClose}
            aria-label={`Close ${title.toLowerCase()}`}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] disabled:opacity-40"
          >
            <X size={16} aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {children}
        </div>

        {footer && (
          <footer className="flex shrink-0 items-center border-t border-neutral-200 bg-neutral-50 px-4 py-3 sm:px-5">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
