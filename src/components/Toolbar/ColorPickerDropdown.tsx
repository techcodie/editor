import { Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import { cn } from '../../lib/cn'
import { Tooltip } from '../ui/Tooltip'
import type { ToolbarButtonSize } from './ToolbarButton'

export interface ColorSwatch {
  label: string
  value: string
}

export interface ColorPickerDropdownProps {
  icon: LucideIcon
  label: string
  swatches: readonly ColorSwatch[]
  current: string | null
  onSelect: (color: string) => void
  onClear: () => void
  disabled?: boolean
  size?: ToolbarButtonSize
  /** See ToolbarDropdown's `onCloseAutoFocus` — returns focus to the document instead of this trigger. */
  onCloseAutoFocus?: () => void
}

const SIZE: Record<ToolbarButtonSize, string> = { sm: 'h-7 w-7', md: 'h-8 w-8' }

const TRIGGER_CLASS =
  'relative inline-flex shrink-0 items-center justify-center rounded-md text-neutral-500 ' +
  'transition-[background-color,color,box-shadow,transform] duration-150 ' +
  'hover:bg-neutral-100 hover:text-neutral-950 ' +
  'active:scale-[0.96] active:bg-neutral-200/70 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] ' +
  'focus-visible:ring-offset-1 focus-visible:ring-offset-white ' +
  'disabled:pointer-events-none disabled:opacity-35 ' +
  'data-[state=open]:bg-neutral-900 data-[state=open]:text-white'

const CONTENT_CLASS =
  'z-50 w-[13rem] overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-2.5 ' +
  'shadow-[var(--document-editor-shadow-raised)] [animation:toolbar-tooltip-in_120ms_ease-out]'

const CLEAR_ITEM_CLASS =
  'mb-2 flex w-full cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-[12px] font-medium text-neutral-700 ' +
  'outline-none transition-colors duration-100 ' +
  'data-[highlighted]:bg-neutral-100 data-[highlighted]:text-neutral-950'

const SWATCH_ITEM_CLASS =
  'flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-black/10 outline-none ' +
  'transition-transform duration-100 data-[highlighted]:scale-110 data-[highlighted]:ring-2 data-[highlighted]:ring-offset-1 data-[highlighted]:ring-[var(--document-editor-focus-ring)]'

/**
 * Shared swatch-grid color picker used for both text color and highlight
 * color — the two components differ only in their swatch palette and which
 * EditorApi setter/getter they're wired to.
 */
export function ColorPickerDropdown({
  icon: Icon,
  label,
  swatches,
  current,
  onSelect,
  onClear,
  disabled,
  size = 'md',
  onCloseAutoFocus,
}: ColorPickerDropdownProps) {
  return (
    <DropdownMenuPrimitive.Root>
      <Tooltip content={label}>
        <ToolbarPrimitive.Button asChild disabled={disabled}>
          <DropdownMenuPrimitive.Trigger
            aria-label={label}
            disabled={disabled}
            className={cn(TRIGGER_CLASS, SIZE[size])}
          >
            <Icon size={size === 'sm' ? 15 : 16} strokeWidth={1.9} aria-hidden />
            <span
              aria-hidden
              className="absolute bottom-1 left-1/2 h-[3px] w-3.5 -translate-x-1/2 rounded-full"
              style={{ backgroundColor: current ?? 'transparent', outline: current ? undefined : '1.5px solid currentColor' }}
            />
          </DropdownMenuPrimitive.Trigger>
        </ToolbarPrimitive.Button>
      </Tooltip>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="start"
          sideOffset={6}
          className={CONTENT_CLASS}
          onCloseAutoFocus={(event) => {
            if (!onCloseAutoFocus) return
            event.preventDefault()
            onCloseAutoFocus()
          }}
        >
          <DropdownMenuPrimitive.Item className={CLEAR_ITEM_CLASS} onSelect={onClear}>
            Default
          </DropdownMenuPrimitive.Item>
          <div className="grid grid-cols-6 gap-1.5" role="group" aria-label={`${label} swatches`}>
            {swatches.map((swatch) => (
              <DropdownMenuPrimitive.Item
                key={swatch.value}
                title={swatch.label}
                aria-label={swatch.label}
                className={SWATCH_ITEM_CLASS}
                style={{ backgroundColor: swatch.value }}
                onSelect={() => onSelect(swatch.value)}
              >
                {current === swatch.value && (
                  <Check size={12} strokeWidth={2.5} className="text-white mix-blend-difference" aria-hidden />
                )}
              </DropdownMenuPrimitive.Item>
            ))}
          </div>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}
