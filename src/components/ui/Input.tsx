import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  icon?: LucideIcon
  error?: string
  helperText?: string
  containerClassName?: string
  /** Extra classes merged onto the `<input>` itself, e.g. extra padding for an overlaid button. */
  inputClassName?: string
}

/** Standardizes the 25+ hand-written text inputs across feature panels. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { icon: Icon, error, helperText, containerClassName, inputClassName, id, ...rest },
  ref,
) {
  return (
    <div className={containerClassName}>
      <div className="relative">
        {Icon && (
          <Icon
            size={15}
            strokeWidth={1.9}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'h-9 w-full rounded-lg border bg-neutral-50 text-xs text-neutral-900 outline-none transition-[background-color,border-color,box-shadow] placeholder:text-neutral-400',
            'focus:bg-white focus:ring-2 focus:ring-[var(--document-editor-focus-ring)]',
            error ? 'border-[var(--document-editor-danger)]' : 'border-neutral-200 focus:border-neutral-300',
            Icon ? 'pl-9 pr-3' : 'px-3',
            inputClassName,
          )}
          aria-invalid={Boolean(error)}
          {...rest}
        />
      </div>
      {(error || helperText) && (
        <p className={cn('mt-1.5 text-[11px]', error ? 'text-[var(--document-editor-danger)]' : 'text-neutral-500')}>
          {error || helperText}
        </p>
      )}
    </div>
  )
})
