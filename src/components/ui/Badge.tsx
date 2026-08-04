import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  tone?: BadgeTone
  size?: BadgeSize
  className?: string
  children: ReactNode
}

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: 'bg-neutral-100 text-neutral-600',
  accent: 'bg-neutral-900 text-white',
  success: 'bg-[var(--document-editor-success-surface)] text-[var(--document-editor-success)]',
  warning: 'bg-[var(--document-editor-warning-surface)] text-[var(--document-editor-warning)]',
  danger: 'bg-[var(--document-editor-danger-surface)] text-[var(--document-editor-danger)]',
  info: 'bg-[var(--document-editor-info-surface)] text-[var(--document-editor-info)]',
}

const SIZE_CLASS: Record<BadgeSize, string> = {
  sm: 'h-5 px-1.5 text-[8px]',
  md: 'h-6 px-2 text-[10px]',
}

/** Consolidates the status-pill logic previously duplicated across StatusBadge/SourceBadges. */
export function Badge({ tone = 'neutral', size = 'sm', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded font-semibold uppercase tracking-wide',
        TONE_CLASS[tone],
        SIZE_CLASS[size],
        className,
      )}
    >
      {children}
    </span>
  )
}
