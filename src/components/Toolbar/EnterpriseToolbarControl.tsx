import { Fragment, useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Check, ChevronDown, LayoutGrid } from 'lucide-react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import { cn } from '../../lib/cn'
import type { ToolbarButtonSize } from './ToolbarButton'

export interface EnterpriseEntry {
  id: string
  /** Groups entries under a small section label (e.g. "AI & writing", "Review"). */
  section: string
  icon: LucideIcon
  label: string
  isActive: boolean
  /** Short status text (risk score, pending count, workflow stage, ...). */
  badge?: string
  onSelect: () => void
}

export interface EnterpriseToolbarControlProps {
  entries: EnterpriseEntry[]
  /** Trigger icon. Defaults to the general-purpose grid icon. */
  icon?: LucideIcon
  /** Trigger label, also its accessible name. Defaults to "Enterprise". */
  label?: string
  size?: ToolbarButtonSize
  onCloseAutoFocus?: () => void
}

const SIZE: Record<ToolbarButtonSize, { button: string; icon: number }> = {
  sm: { button: 'h-7', icon: 15 },
  md: { button: 'h-8', icon: 16 },
}

const TRIGGER_CLASS =
  'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border-none bg-transparent px-2 text-neutral-500 ' +
  'transition-[background-color,color,box-shadow,transform] duration-150 ' +
  'hover:bg-neutral-100 hover:text-neutral-950 ' +
  'active:scale-[0.98] active:bg-neutral-200/70 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] ' +
  'focus-visible:ring-offset-1 focus-visible:ring-offset-white ' +
  'data-[state=open]:bg-neutral-900 data-[state=open]:text-white'

const CONTENT_CLASS =
  'z-50 max-h-[calc(100vh-8rem)] w-[19rem] overflow-y-auto rounded-xl border border-neutral-200/80 bg-white p-1.5 ' +
  'shadow-[var(--document-editor-shadow-raised)] [animation:toolbar-tooltip-in_120ms_ease-out]'

const LABEL_CLASS = 'px-2.5 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 first:pt-1.5'

const ITEM_CLASS =
  'flex w-full cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-neutral-700 ' +
  'outline-none transition-colors duration-100 ' +
  'data-[highlighted]:bg-neutral-100 data-[highlighted]:text-neutral-950 ' +
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-40'

const BADGE_CLASS =
  'shrink-0 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-neutral-600'

/**
 * Single entry point for every enterprise-tier tool (AI, review, compliance,
 * contracts, workflow, forms, watermark, identity, ...) — none of it is
 * removed, it's just no longer a wall of icons in the primary editing
 * ribbon. Each item still calls the exact same open/close handler the
 * feature already used as a standalone toolbar button; this only changes
 * where that trigger lives.
 */
export function EnterpriseToolbarControl({
  entries,
  icon: Icon = LayoutGrid,
  label = 'Enterprise',
  size = 'md',
  onCloseAutoFocus,
}: EnterpriseToolbarControlProps) {
  const dimensions = SIZE[size]
  const activeCount = entries.filter((entry) => entry.isActive).length

  const sections = useMemo(() => {
    const order: string[] = []
    const bySection = new Map<string, EnterpriseEntry[]>()
    for (const entry of entries) {
      if (!bySection.has(entry.section)) {
        order.push(entry.section)
        bySection.set(entry.section, [])
      }
      bySection.get(entry.section)!.push(entry)
    }
    return order.map((section) => [section, bySection.get(section)!] as const)
  }, [entries])

  if (entries.length === 0) return null

  return (
    <DropdownMenuPrimitive.Root>
      <ToolbarPrimitive.Button asChild>
        <DropdownMenuPrimitive.Trigger
          aria-label={label}
          title={label}
          className={cn(TRIGGER_CLASS, dimensions.button)}
        >
          <Icon size={dimensions.icon} strokeWidth={1.9} aria-hidden />
          <span className="text-[13px] font-medium">{label}</span>
          {activeCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[9px] font-semibold leading-none text-white">
              {activeCount}
            </span>
          )}
          <ChevronDown size={13} strokeWidth={2.2} className="shrink-0 opacity-70" aria-hidden />
        </DropdownMenuPrimitive.Trigger>
      </ToolbarPrimitive.Button>
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
          {sections.map(([section, items], index) => (
            <Fragment key={section}>
              {index > 0 && <DropdownMenuPrimitive.Separator className="my-1 h-px bg-neutral-200/70" />}
              <DropdownMenuPrimitive.Label className={LABEL_CLASS}>{section}</DropdownMenuPrimitive.Label>
              {items.map((item) => (
                <DropdownMenuPrimitive.Item
                  key={item.id}
                  onSelect={item.onSelect}
                  className={ITEM_CLASS}
                >
                  <item.icon size={15} strokeWidth={1.9} className="shrink-0 text-neutral-500" aria-hidden />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && <span className={BADGE_CLASS}>{item.badge}</span>}
                  {item.isActive && (
                    <Check size={14} strokeWidth={2.2} className="shrink-0 text-neutral-900" aria-hidden />
                  )}
                </DropdownMenuPrimitive.Item>
              ))}
            </Fragment>
          ))}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}
