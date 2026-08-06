import type { LucideIcon } from 'lucide-react'
import { Check, ChevronDown } from 'lucide-react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import { cn } from '../../lib/cn'
import { Tooltip } from '../ui/Tooltip'
import type { ToolbarButtonSize } from './ToolbarButton'

export interface ToolbarDropdownItem {
  id: string
  icon?: LucideIcon
  label: string
  isActive?: boolean
  disabled?: boolean
  onSelect: () => void
}

export interface ToolbarDropdownProps {
  /** Icon shown in the trigger. Optional when `triggerLabel` alone is enough context. */
  icon?: LucideIcon
  /** Accessible name for the trigger, also used as its tooltip when no visible text is shown. */
  label: string
  /** Visible text next to the icon (e.g. the active paragraph style). Omit for an icon-only menu trigger. */
  triggerLabel?: string
  items: ToolbarDropdownItem[]
  size?: ToolbarButtonSize
  disabled?: boolean
  align?: DropdownMenuPrimitive.DropdownMenuContentProps['align']
  id?: string
}

const SIZE: Record<ToolbarButtonSize, { button: string; icon: number }> = {
  sm: { button: 'h-7', icon: 15 },
  md: { button: 'h-8', icon: 16 },
}

const TRIGGER_CLASS =
  'inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border-none bg-transparent px-1.5 text-neutral-500 ' +
  'transition-[background-color,color,box-shadow,transform] duration-150 ' +
  'hover:bg-neutral-100 hover:text-neutral-950 ' +
  'active:scale-[0.98] active:bg-neutral-200/70 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] ' +
  'focus-visible:ring-offset-1 focus-visible:ring-offset-white ' +
  'disabled:pointer-events-none disabled:opacity-35 ' +
  'data-[state=open]:bg-neutral-900 data-[state=open]:text-white'

const CONTENT_CLASS =
  'z-50 min-w-[11rem] overflow-hidden rounded-lg border border-neutral-200 bg-white p-1 ' +
  'shadow-[var(--document-editor-shadow-raised)] [animation:toolbar-tooltip-in_120ms_ease-out]'

const ITEM_CLASS =
  'flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-neutral-700 ' +
  'outline-none transition-colors duration-100 ' +
  'data-[highlighted]:bg-neutral-100 data-[highlighted]:text-neutral-950 ' +
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-40'

/**
 * Toolbar menu trigger built on Radix DropdownMenu, styled to match ToolbarButton.
 * Composes as `Toolbar.Button asChild > DropdownMenu.Trigger` per Radix's documented
 * pattern so it keeps the toolbar's roving-focus keyboard behavior.
 */
export function ToolbarDropdown({
  icon: Icon,
  label,
  triggerLabel,
  items,
  size = 'md',
  disabled,
  align = 'start',
  id,
}: ToolbarDropdownProps) {
  const dimensions = SIZE[size]

  const triggerContent = (
    <>
      {Icon && <Icon size={dimensions.icon} strokeWidth={1.9} aria-hidden />}
      {triggerLabel && (
        <span className="max-w-[7rem] truncate text-[13px] font-medium">{triggerLabel}</span>
      )}
      <ChevronDown size={13} strokeWidth={2.2} className="shrink-0 opacity-70" aria-hidden />
    </>
  )

  const trigger = (
    <ToolbarPrimitive.Button asChild disabled={disabled}>
      <DropdownMenuPrimitive.Trigger
        id={id}
        aria-label={label}
        disabled={disabled}
        className={cn(
          TRIGGER_CLASS,
          dimensions.button,
          triggerLabel ? 'justify-between' : 'w-8 justify-center px-0',
        )}
      >
        {triggerContent}
      </DropdownMenuPrimitive.Trigger>
    </ToolbarPrimitive.Button>
  )

  return (
    <DropdownMenuPrimitive.Root>
      {triggerLabel ? trigger : <Tooltip content={label}>{trigger}</Tooltip>}
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content align={align} sideOffset={6} className={CONTENT_CLASS}>
          {items.map((item) => (
            <DropdownMenuPrimitive.Item
              key={item.id}
              disabled={item.disabled}
              onSelect={() => item.onSelect()}
              className={ITEM_CLASS}
            >
              {item.icon && (
                <item.icon
                  size={15}
                  strokeWidth={1.9}
                  className="shrink-0 text-neutral-500"
                  aria-hidden
                />
              )}
              <span className="flex-1 truncate">{item.label}</span>
              {item.isActive && (
                <Check size={14} strokeWidth={2.2} className="shrink-0 text-neutral-900" aria-hidden />
              )}
            </DropdownMenuPrimitive.Item>
          ))}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}
