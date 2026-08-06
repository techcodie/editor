import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import { cn } from '../../lib/cn'
import { Tooltip } from '../ui/Tooltip'

export type ToolbarButtonSize = 'sm' | 'md'

export interface ToolbarButtonProps {
  /** Icon rendered inside the button. */
  icon: LucideIcon
  /** Accessible label, also shown as the tooltip. */
  label: string
  /** Toggle on-state. When provided, the button exposes `aria-pressed`. */
  isActive?: boolean
  /** Disables interaction. */
  disabled?: boolean
  /** Shows a spinner and disables the button (reserved for async actions). */
  isLoading?: boolean
  /** Visual size. Defaults to `md`. */
  size?: ToolbarButtonSize
  /** Click handler. */
  onClick?: () => void
  /** Optional DOM id, useful as an `aria-controls`/anchor target for a toggled panel. */
  id?: string
  /** Set when this button toggles a panel/dialog open and closed. */
  ariaExpanded?: boolean
  /** Id of the panel/dialog this button controls. */
  ariaControls?: string
  /** Small status/count indicator rendered in the top-right corner (e.g. a pending count or risk score). */
  badge?: ReactNode
}

const SIZE: Record<ToolbarButtonSize, { button: string; icon: number }> = {
  sm: { button: 'h-7 w-7', icon: 15 },
  md: { button: 'h-8 w-8', icon: 16 },
}

const BUTTON_CLASS =
  'inline-flex shrink-0 items-center justify-center rounded-md text-neutral-500 ' +
  'transition-[background-color,color,box-shadow,transform] duration-150 ' +
  'hover:bg-neutral-100 hover:text-neutral-950 ' +
  'active:scale-[0.96] active:bg-neutral-200/70 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] ' +
  'focus-visible:ring-offset-1 focus-visible:ring-offset-white ' +
  'disabled:pointer-events-none disabled:opacity-35 ' +
  'aria-pressed:bg-neutral-900 aria-pressed:text-white aria-pressed:shadow-sm ' +
  'aria-pressed:hover:bg-neutral-800 aria-pressed:hover:text-white'

export function ToolbarButton({
  icon: Icon,
  label,
  isActive,
  disabled,
  isLoading,
  size = 'md',
  onClick,
  id,
  ariaExpanded,
  ariaControls,
  badge,
}: ToolbarButtonProps) {
  const dimensions = SIZE[size]

  return (
    <Tooltip content={label}>
      <ToolbarPrimitive.Button
        id={id}
        type="button"
        aria-label={label}
        aria-pressed={isActive}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        disabled={disabled || isLoading}
        onClick={onClick}
        className={cn(BUTTON_CLASS, 'relative', dimensions.button)}
      >
        {isLoading ? (
          <Loader2 size={dimensions.icon} strokeWidth={2} className="animate-spin" aria-hidden />
        ) : (
          <Icon size={dimensions.icon} strokeWidth={1.9} aria-hidden />
        )}
        {badge != null && (
          <span className="pointer-events-none absolute -right-1 -top-1 flex items-center justify-center">
            {typeof badge === 'string' || typeof badge === 'number' ? (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[9px] font-semibold leading-none text-white shadow-sm">
                {badge}
              </span>
            ) : (
              badge
            )}
          </span>
        )}
      </ToolbarPrimitive.Button>
    </Tooltip>
  )
}
