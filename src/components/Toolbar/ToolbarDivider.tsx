import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import { cn } from '../../lib/cn'

export interface ToolbarDividerProps {
  className?: string
}

export function ToolbarDivider({ className }: ToolbarDividerProps) {
  return (
    <ToolbarPrimitive.Separator
      className={cn('mx-1 h-5 w-px shrink-0 self-center bg-neutral-200/80', className)}
    />
  )
}
