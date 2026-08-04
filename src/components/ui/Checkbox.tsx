import type { InputHTMLAttributes, ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> {
  label?: ReactNode
  className?: string
}

/** Standardizes the raw `<input type="checkbox">` usages across feature panels. */
export function Checkbox({ label, className, id, checked, ...rest }: CheckboxProps) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 text-xs text-neutral-700', className)}>
      <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          className={cn(
            // Computed from `checked` (rather than the `checked:` variant): the
            // unlayered `.bg-white` theme bridge in index.css otherwise always
            // beats layered Tailwind state variants regardless of specificity.
            'peer h-4 w-4 shrink-0 appearance-none rounded border transition-colors',
            checked ? 'border-neutral-900 bg-neutral-900' : 'border-neutral-300 bg-white',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          {...rest}
        />
        <Check
          size={11}
          strokeWidth={3}
          aria-hidden
          className="pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100"
        />
      </span>
      {label}
    </label>
  )
}
