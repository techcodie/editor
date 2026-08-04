import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { MOTION } from './motion'
import { useFocusTrap } from './useFocusTrap'

const ICON_TONE_CLASS = {
  neutral: 'border border-neutral-200 bg-neutral-50 text-neutral-700',
  accent: 'bg-[var(--document-editor-info-surface)] text-[var(--document-editor-info)]',
} as const

export interface PanelShellProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  icon?: LucideIcon
  iconTone?: keyof typeof ICON_TONE_CLASS
  /** Rendered after the title block, before the close button (e.g. prev/next navigators). */
  headerActions?: ReactNode
  footer?: ReactNode
  children: ReactNode
  labelledById: string
  panelId?: string
  className?: string
  /** Overrides the default panel width (`sm:max-w-[25rem] lg:w-[24rem]`) for content-heavy panels. */
  widthClassName?: string
  /** Overrides the default Escape behavior (close). Use for panels with a drill-down view to back out of first. */
  onEscape?: () => void
  /** CSS selector for the element to focus when the panel opens. Defaults to the first focusable element. */
  initialFocusSelector?: string
}

/**
 * Shared right-hand slide-in panel shell. Consolidates the ~24 independently
 * hand-rolled "sidebar panel" implementations (Ask Document, Review,
 * Compliance, Search, ...) which previously varied in width, animation
 * mechanism, and header/footer markup.
 */
export function PanelShell({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconTone = 'neutral',
  headerActions,
  footer,
  children,
  labelledById,
  panelId,
  className,
  widthClassName = 'sm:max-w-[25rem] lg:w-[24rem]',
  onEscape,
  initialFocusSelector,
}: PanelShellProps) {
  const containerRef = useFocusTrap<HTMLElement>(isOpen, onEscape ?? onClose, initialFocusSelector)

  if (!isOpen) return null

  return (
    <>
      <button
        type="button"
        aria-label={`Close ${title.toLowerCase()}`}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] lg:hidden"
      />
      <aside
        ref={containerRef}
        id={panelId}
        role="dialog"
        aria-labelledby={labelledById}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-hidden border-l border-neutral-200 bg-white shadow-[var(--document-editor-shadow-overlay)]',
          MOTION.panelIn,
          'lg:sticky lg:top-6 lg:z-30 lg:h-[calc(100vh-3rem)] lg:rounded-lg lg:border',
          widthClassName,
          className,
        )}
      >
        <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3.5">
          {Icon && (
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', ICON_TONE_CLASS[iconTone])}>
              <Icon size={17} strokeWidth={1.8} aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <h2 id={labelledById} className="text-sm font-semibold text-neutral-950">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-[11px] text-neutral-500">{subtitle}</p>}
          </div>
          <div className="ml-auto flex items-center gap-1">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label={`Close ${title.toLowerCase()}`}
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
            >
              <X size={16} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>

        {footer && (
          <footer className="shrink-0 border-t border-neutral-200 px-4 py-3">{footer}</footer>
        )}
      </aside>
    </>
  )
}
