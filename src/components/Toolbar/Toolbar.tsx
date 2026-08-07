import { Fragment, memo, type ReactNode, useSyncExternalStore } from 'react'
import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '../../lib/cn'
import type { EditorApi } from '../../lib/editor-api'
import { ToolbarButton } from './ToolbarButton'
import type { ToolbarButtonSize } from './ToolbarButton'
import { ToolbarGroup } from './ToolbarGroup'
import { ToolbarDivider } from './ToolbarDivider'
import { ParagraphStyleDropdown } from './ParagraphStyleDropdown'
import { FontFamilyDropdown } from './FontFamilyDropdown'
import { FontSizeDropdown } from './FontSizeDropdown'
import { TextColorDropdown } from './TextColorDropdown'
import { HighlightColorDropdown } from './HighlightColorDropdown'
import { LinkToolbarControl } from './LinkToolbarControl'
import { TOOLBAR_SECTIONS } from './toolbar.config'

const NOOP_SUBSCRIBE = () => () => {}
const NULL_SNAPSHOT = () => null

/** A labelled group of feature controls appended after the formatting sections. */
export interface ToolbarTrailingSection {
  id: string
  label: string
  content: ReactNode
}

export interface ToolbarProps {
  /** Public editor API the toolbar drives. Null until the editor is ready. */
  api: EditorApi | null
  /** Pin the toolbar to the top of its scroll container. */
  sticky?: boolean
  /** Size applied to every button. */
  size?: ToolbarButtonSize
  className?: string
  /** Labelled groups of feature/workspace controls appended after formatting (Insert, Document, Review, AI, ...). */
  trailingSections?: ToolbarTrailingSection[]
}

const TOOLBAR_CLASS =
  // Lighter chrome than a boxed panel — the ribbon should recede so the page
  // stays the visual focus. A soft single shadow reads as "floating" instead
  // of the previous harder double-shadow + opaque border combination.
  'flex w-full items-center gap-x-1 gap-y-1.5 rounded-lg border border-neutral-200/70 bg-white/90 p-2 ' +
  'shadow-[0_1px_2px_rgba(20,20,20,0.03),0_6px_20px_-16px_rgba(20,20,20,0.22)] ' +
  'supports-[backdrop-filter]:bg-white/75 backdrop-blur-xl ' +
  // Below `sm`, the ribbon still shares its row with fixed-width workspace
  // icons (command palette, Ask Document, identity, presence) that leave too
  // little width for even one group to wrap sensibly — keep that width class
  // scrolling horizontally there. From `sm` up there's enough room to grow
  // into full, wrapped rows with every command visible and no scrolling.
  'flex-nowrap overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ' +
  '[mask-image:linear-gradient(to_right,transparent,black_14px,black_calc(100%-14px),transparent)] ' +
  'sm:flex-wrap sm:overflow-visible sm:[mask-image:none]'

// Forces the feature groups (Insert, Document, Review, AI) onto their own row
// below the formatting groups, so every command stays visible at once instead
// of requiring horizontal scrolling. Only meaningful once sm:flex-wrap applies.
const ROW_BREAK_CLASS = 'hidden sm:block sm:basis-full sm:h-0'

function ToolbarComponent({
  api,
  sticky = false,
  size = 'md',
  className,
  trailingSections,
}: ToolbarProps) {
  // Re-render on every editor change so active/disabled states stay in sync —
  // without the toolbar ever importing Tiptap.
  useSyncExternalStore(api?.subscribe ?? NOOP_SUBSCRIBE, api?.getSnapshot ?? NULL_SNAPSHOT)

  return (
    // Kept for the feature-specific *ToolbarControl components composed into
    // trailingSections that still use raw @radix-ui/react-tooltip directly.
    <TooltipPrimitive.Provider delayDuration={300} skipDelayDuration={200}>
      <ToolbarPrimitive.Root
        aria-label="Document editor ribbon"
        className={cn(TOOLBAR_CLASS, sticky && 'sticky top-3 z-30 sm:top-4', className)}
      >
        {TOOLBAR_SECTIONS.map((section, index) => (
          <Fragment key={section.id}>
            {index > 0 && <ToolbarDivider />}
            <ToolbarGroup label={section.label}>
              {section.id === 'paragraph' && (
                <>
                  <ParagraphStyleDropdown api={api} size={size} />
                  <FontFamilyDropdown api={api} size={size} />
                  <FontSizeDropdown api={api} size={size} />
                </>
              )}
              {section.items.map((item) => {
                const isActive = api && item.isActive ? item.isActive(api) : undefined
                const disabled = !api || (item.canExecute ? !item.canExecute(api) : false)
                return (
                  <ToolbarButton
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    size={size}
                    isActive={isActive}
                    disabled={disabled}
                    onClick={() => {
                      if (api) item.execute(api)
                    }}
                  />
                )
              })}
              {section.id === 'formatting' && (
                <>
                  <TextColorDropdown api={api} size={size} />
                  <HighlightColorDropdown api={api} size={size} />
                  <LinkToolbarControl api={api} size={size} />
                </>
              )}
            </ToolbarGroup>
          </Fragment>
        ))}
        {trailingSections && trailingSections.length > 0 && (
          <div className={ROW_BREAK_CLASS} aria-hidden />
        )}
        {trailingSections?.map((section, index) => (
          <Fragment key={section.id}>
            {index > 0 && <ToolbarDivider />}
            <ToolbarGroup label={section.label}>{section.content}</ToolbarGroup>
          </Fragment>
        ))}
      </ToolbarPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

export const Toolbar = memo(ToolbarComponent)
