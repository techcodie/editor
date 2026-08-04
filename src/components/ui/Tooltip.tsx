import type { ReactNode } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '../../lib/cn'
import { MOTION } from './motion'

const TOOLTIP_CLASS = cn(
  'z-50 select-none rounded-md bg-neutral-900 px-2.5 py-1.5 text-[11px] font-medium text-white',
  'shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)]',
  MOTION.tooltipIn,
)

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: TooltipPrimitive.TooltipContentProps['side']
  sideOffset?: number
  disabled?: boolean
}

/** Single styled Radix tooltip. Wraps its own Provider so it works standalone anywhere. */
export function Tooltip({ content, children, side = 'bottom', sideOffset = 6, disabled }: TooltipProps) {
  if (disabled) return children

  return (
    <TooltipPrimitive.Provider delayDuration={300} skipDelayDuration={100}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content side={side} sideOffset={sideOffset} className={TOOLTIP_CLASS}>
            {content}
            <TooltipPrimitive.Arrow className="fill-neutral-900" width={10} height={5} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
