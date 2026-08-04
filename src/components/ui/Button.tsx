import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  icon?: LucideIcon
  className?: string
  children: ReactNode
}

const BASE_CLASS = cn(
  'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md font-semibold',
  'transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-white',
  'disabled:pointer-events-none disabled:opacity-50',
)

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[11px]',
  md: 'h-9 px-4 text-[12px]',
}

const ICON_SIZE: Record<ButtonSize, number> = { sm: 13, md: 14 }

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-neutral-900 text-white shadow-sm hover:bg-neutral-800',
  // hover uses border/shadow, not background: the unlayered `.bg-white` theme
  // bridge in index.css would otherwise permanently beat a layered `hover:bg-*`.
  secondary: 'border border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300 hover:shadow-[var(--document-editor-shadow-raised)]',
  ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950',
  danger: 'bg-[var(--document-editor-danger)] text-white shadow-sm hover:opacity-90',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  isLoading,
  icon: Icon,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={cn(BASE_CLASS, SIZE_CLASS[size], VARIANT_CLASS[variant], className)}
      {...rest}
    >
      {isLoading ? (
        <Loader2 size={ICON_SIZE[size]} strokeWidth={2} className="animate-spin" aria-hidden />
      ) : (
        Icon && <Icon size={ICON_SIZE[size]} strokeWidth={2} aria-hidden />
      )}
      {children}
    </button>
  )
}
