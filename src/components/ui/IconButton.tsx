import type { LucideIcon } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Tooltip } from './Tooltip'

export type IconButtonSize = 'sm' | 'md'
export type IconButtonTone = 'default' | 'danger'

export interface IconButtonProps {
  icon: LucideIcon
  /** Accessible label, also shown as the tooltip unless `showTooltip` is false. */
  label: string
  isActive?: boolean
  disabled?: boolean
  isLoading?: boolean
  size?: IconButtonSize
  tone?: IconButtonTone
  showTooltip?: boolean
  className?: string
  onClick?: () => void
}

const SIZE: Record<IconButtonSize, { button: string; icon: number }> = {
  sm: { button: 'h-7 w-7', icon: 15 },
  md: { button: 'h-8 w-8', icon: 16 },
}

const TONE_CLASS: Record<IconButtonTone, string> = {
  default: cn(
    'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950',
    'aria-pressed:bg-neutral-900 aria-pressed:text-white aria-pressed:shadow-sm aria-pressed:hover:bg-neutral-800',
  ),
  danger: 'text-[var(--document-editor-danger)] hover:bg-[var(--document-editor-danger-surface)]',
}

const BASE_CLASS = cn(
  'inline-flex shrink-0 items-center justify-center rounded-md',
  'transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.96]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-white',
  'disabled:pointer-events-none disabled:opacity-35',
)

/** Icon button with a built-in tooltip. Usable anywhere (not just inside the main Toolbar). */
export function IconButton({
  icon: Icon,
  label,
  isActive,
  disabled,
  isLoading,
  size = 'md',
  tone = 'default',
  showTooltip = true,
  className,
  onClick,
}: IconButtonProps) {
  const dimensions = SIZE[size]
  const button = (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={cn(BASE_CLASS, dimensions.button, TONE_CLASS[tone], className)}
    >
      {isLoading ? (
        <Loader2 size={dimensions.icon} strokeWidth={2} className="animate-spin" aria-hidden />
      ) : (
        <Icon size={dimensions.icon} strokeWidth={1.9} aria-hidden />
      )}
    </button>
  )

  return (
    <Tooltip content={label} disabled={!showTooltip}>
      {button}
    </Tooltip>
  )
}
