import type { LucideIcon } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import * as Tooltip from '@radix-ui/react-tooltip'
import { cn } from '../../lib/cn'

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
}

const SIZE: Record<ToolbarButtonSize, { button: string; icon: number }> = {
  sm: { button: 'h-7 w-7', icon: 15 },
  md: { button: 'h-8 w-8', icon: 16 },
}

const BUTTON_CLASS =
  'inline-flex shrink-0 items-center justify-center rounded-lg text-neutral-500 ' +
  'transition-[background-color,color] duration-150 ' +
  'hover:bg-neutral-100 hover:text-neutral-800 ' +
  'active:bg-neutral-200/70 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ' +
  'focus-visible:ring-offset-1 focus-visible:ring-offset-white ' +
  'disabled:pointer-events-none disabled:opacity-40 ' +
  'aria-pressed:bg-indigo-50 aria-pressed:text-indigo-600 ' +
  'aria-pressed:hover:bg-indigo-100 aria-pressed:hover:text-indigo-700'

const TOOLTIP_CLASS =
  'z-50 select-none rounded-md bg-neutral-900 px-2 py-1 text-xs font-medium text-white shadow-md ' +
  '[animation:toolbar-tooltip-in_120ms_ease-out]'

export function ToolbarButton({
  icon: Icon,
  label,
  isActive,
  disabled,
  isLoading,
  size = 'md',
  onClick,
}: ToolbarButtonProps) {
  const dimensions = SIZE[size]

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <ToolbarPrimitive.Button
          type="button"
          aria-label={label}
          aria-pressed={isActive}
          disabled={disabled || isLoading}
          onClick={onClick}
          className={cn(BUTTON_CLASS, dimensions.button)}
        >
          {isLoading ? (
            <Loader2 size={dimensions.icon} strokeWidth={2} className="animate-spin" aria-hidden />
          ) : (
            <Icon size={dimensions.icon} strokeWidth={1.9} aria-hidden />
          )}
        </ToolbarPrimitive.Button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="bottom" sideOffset={6} className={TOOLTIP_CLASS}>
          {label}
          <Tooltip.Arrow className="fill-neutral-900" width={10} height={5} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
