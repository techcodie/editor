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
  'flex w-full items-center gap-0.5 rounded-lg border border-neutral-200 bg-white/90 p-1.5 ' +
  'shadow-[0_1px_2px_rgba(20,20,20,0.04),0_8px_24px_-16px_rgba(20,20,20,0.28)] ' +
  'supports-[backdrop-filter]:bg-white/80 backdrop-blur-xl ' +
  // A Jodit-style ribbon always stays a single row and scrolls horizontally
  // once its groups no longer fit, instead of wrapping onto multiple rows.
  'flex-nowrap overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ' +
  // Edge-fade signals there's more to scroll to.
  '[mask-image:linear-gradient(to_right,transparent,black_14px,black_calc(100%-14px),transparent)]'

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
              {section.id === 'paragraph' && <ParagraphStyleDropdown api={api} size={size} />}
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
            </ToolbarGroup>
          </Fragment>
        ))}
        {trailingSections?.map((section) => (
          <Fragment key={section.id}>
            <ToolbarDivider />
            <ToolbarGroup label={section.label}>{section.content}</ToolbarGroup>
          </Fragment>
        ))}
      </ToolbarPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

export const Toolbar = memo(ToolbarComponent)
