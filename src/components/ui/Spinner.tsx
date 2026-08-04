import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

export type SpinnerSize = 'sm' | 'md' | 'lg'

const SIZE: Record<SpinnerSize, number> = { sm: 14, md: 18, lg: 24 }

export interface SpinnerProps {
  size?: SpinnerSize
  className?: string
  label?: string
}

/** Standardizes the ~20 ad hoc `Loader2 + animate-spin` usages across the codebase. */
export function Spinner({ size = 'md', className, label = 'Loading' }: SpinnerProps) {
  return (
    <Loader2
      size={SIZE[size]}
      strokeWidth={2}
      className={cn('animate-spin text-neutral-400', className)}
      aria-label={label}
      role="status"
    />
  )
}
