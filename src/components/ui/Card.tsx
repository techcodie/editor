import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface CardBaseProps {
  selected?: boolean
  interactive?: boolean
  className?: string
  children: ReactNode
}

const BASE_CLASS = cn(
  'w-full rounded-lg border border-neutral-200 bg-white p-3 text-left transition-[box-shadow,border-color,background-color] duration-150',
)

function cardClassName({ selected, interactive, className }: CardBaseProps) {
  return cn(
    BASE_CLASS,
    interactive && 'hover:border-neutral-300 hover:shadow-[var(--document-editor-shadow-raised)]',
    selected && 'border-[var(--document-editor-accent)] shadow-[var(--document-editor-shadow-raised)]',
    className,
  )
}

export type CardProps = CardBaseProps & HTMLAttributes<HTMLDivElement>
export type CardButtonProps = CardBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>

/** Generic card shell shared by asset/comment/suggestion/snapshot/approval cards. */
export function Card({ selected, interactive, className, children, ...rest }: CardProps) {
  return (
    <div className={cardClassName({ selected, interactive, className, children })} {...rest}>
      {children}
    </div>
  )
}

/** Interactive variant rendered as a real `<button>` for clickable cards. */
export function CardButton({ selected, interactive = true, className, children, ...rest }: CardButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        cardClassName({ selected, interactive, className, children }),
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]',
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
