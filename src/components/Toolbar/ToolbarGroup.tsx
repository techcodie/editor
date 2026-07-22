import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface ToolbarGroupProps {
  children: ReactNode
  /** Accessible label describing the group of controls. */
  label?: string
  className?: string
}

export function ToolbarGroup({ children, label, className }: ToolbarGroupProps) {
  return (
    <div role="group" aria-label={label} className={cn('flex items-center gap-px', className)}>
      {children}
    </div>
  )
}
