import { Fragment } from 'react'
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
  /** Small muted line under the label — e.g. explaining why an item is disabled. */
  description?: string
  isActive?: boolean
  disabled?: boolean
  /** Renders a divider above this item, for lightly grouping a long item list. */
  separatorBefore?: boolean
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
  /**
   * Called instead of Radix's default close-focus behavior, which returns
   * focus to the trigger button. Without this, selecting an item and then
   * continuing to type sends keystrokes into the toolbar (not the document);
   * depending on which keys land on the now-focused button, this can even
   * reopen the menu and scatter subsequent input. Pass e.g. `() => api?.focus()`
   * to keep the document editable immediately after a selection.
   */
  onCloseAutoFocus?: () => void
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
  'z-50 min-w-[12rem] overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-1.5 ' +
  'shadow-[var(--document-editor-shadow-raised)] [animation:toolbar-tooltip-in_120ms_ease-out]'

const ITEM_CLASS =
  'flex w-full cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-neutral-700 ' +
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
  onCloseAutoFocus,
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
        <DropdownMenuPrimitive.Content
          align={align}
          sideOffset={6}
          className={CONTENT_CLASS}
          onCloseAutoFocus={(event) => {
            if (!onCloseAutoFocus) return
            event.preventDefault()
            onCloseAutoFocus()
          }}
        >
          {items.map((item, index) => (
            <Fragment key={item.id}>
              {item.separatorBefore && index > 0 && (
                <DropdownMenuPrimitive.Separator className="my-1 h-px bg-neutral-200/70" />
              )}
              <DropdownMenuPrimitive.Item
                disabled={item.disabled}
                onSelect={() => item.onSelect()}
                className={ITEM_CLASS}
              >
                {item.icon && (
                  <item.icon
                    size={15}
                    strokeWidth={1.9}
                    className="mt-0.5 shrink-0 self-start text-neutral-500"
                    aria-hidden
                  />
                )}
                <span className="flex-1 min-w-0">
                  <span className="block truncate">{item.label}</span>
                  {item.description && (
                    <span className="block truncate text-[11px] font-normal text-neutral-400">
                      {item.description}
                    </span>
                  )}
                </span>
                {item.isActive && (
                  <Check size={14} strokeWidth={2.2} className="shrink-0 text-neutral-900" aria-hidden />
                )}
              </DropdownMenuPrimitive.Item>
            </Fragment>
          ))}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}
