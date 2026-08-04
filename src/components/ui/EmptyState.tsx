import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Button } from './Button'

export interface EmptyStateAction {
  label: string
  onClick: () => void
  icon?: LucideIcon
}

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: EmptyStateAction
  /** Small decoration overlaid on the icon square corner (e.g. an online-status dot). */
  iconBadge?: ReactNode
  /** Extra content rendered below the description (e.g. suggested-action chips). */
  children?: ReactNode
  /** Vertically center within a full-height scrollable parent instead of using a fixed min-height. */
  fillParent?: boolean
  className?: string
}

/** Shared empty-state block: icon square + heading + copy + optional primary action. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  iconBadge,
  children,
  fillParent,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center px-6 py-8 text-center',
        fillParent ? 'min-h-full [justify-content:safe_center]' : 'min-h-64 justify-center',
        className,
      )}
    >
      <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-800 shadow-[var(--document-editor-shadow-raised)]">
        <Icon size={22} strokeWidth={1.8} aria-hidden />
        {iconBadge}
      </div>
      <h3 className="text-sm font-semibold text-neutral-950">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-[17rem] text-xs leading-5 text-neutral-500">{description}</p>
      )}
      {action && (
        <Button variant="secondary" size="sm" icon={action.icon} onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
      {children}
    </div>
  )
}
