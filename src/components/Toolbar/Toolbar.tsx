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
import { TOOLBAR_SECTIONS, type ToolbarItemConfig } from './toolbar.config'

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
  /** Labelled groups of feature and workspace controls appended after formatting. */
  trailingSections?: ToolbarTrailingSection[]
}

const TOOLBAR_CLASS =
  'flex h-10 w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-neutral-200/90 bg-white/95 px-1.5 ' +
  'shadow-[0_1px_2px_rgba(20,20,20,0.05),0_10px_28px_-18px_rgba(20,20,20,0.34)] ' +
  'supports-[backdrop-filter]:bg-white/88 backdrop-blur-xl ' +
  'flex-nowrap overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

function ToolbarItems({
  api,
  items,
  size,
}: {
  api: EditorApi | null
  items: ToolbarItemConfig[]
  size: ToolbarButtonSize
}) {
  return items.map((item) => {
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
        onClick={() => api && item.execute(api)}
      />
    )
  })
}

function ToolbarComponent({
  api,
  sticky = false,
  size = 'md',
  className,
  trailingSections,
}: ToolbarProps) {
  useSyncExternalStore(api?.subscribe ?? NOOP_SUBSCRIBE, api?.getSnapshot ?? NULL_SNAPSHOT)

  const clipboard = TOOLBAR_SECTIONS.find((section) => section.id === 'clipboard')
  const typography = TOOLBAR_SECTIONS.find((section) => section.id === 'formatting')
  const alignment = TOOLBAR_SECTIONS.find((section) => section.id === 'paragraph')
  const listSection = TOOLBAR_SECTIONS.find((section) => section.id === 'lists')
  const listItems = listSection?.items.filter((item) =>
    ['bulletList', 'orderedList', 'taskList'].includes(item.id),
  ) ?? []
  const moreItems = [
    ...(clipboard?.items.filter((item) => item.id === 'clearFormatting') ?? []),
    ...(listSection?.items.filter((item) => ['blockquote', 'codeBlock'].includes(item.id)) ?? []),
  ]

  return (
    <TooltipPrimitive.Provider delayDuration={300} skipDelayDuration={200}>
      <ToolbarPrimitive.Root
        aria-label="Document editor ribbon"
        className={cn(TOOLBAR_CLASS, sticky && 'sticky top-3 z-30 sm:top-4', className)}
      >
        {clipboard && (
          <ToolbarGroup label="Clipboard">
            <ToolbarItems
              api={api}
              items={clipboard.items.filter((item) => item.id !== 'clearFormatting')}
              size={size}
            />
          </ToolbarGroup>
        )}
        <ToolbarDivider />
        <ToolbarGroup label="Paragraph">
          <ParagraphStyleDropdown api={api} size={size} />
        </ToolbarGroup>
        {typography && (
          <>
            <ToolbarDivider />
            <ToolbarGroup label="Typography">
              <ToolbarItems api={api} items={typography.items} size={size} />
            </ToolbarGroup>
          </>
        )}
        {alignment && (
          <>
            <ToolbarDivider />
            <ToolbarGroup label="Alignment">
              <ToolbarItems api={api} items={alignment.items} size={size} />
            </ToolbarGroup>
          </>
        )}
        <ToolbarDivider />
        <ToolbarGroup label="Lists">
          <ToolbarItems api={api} items={listItems} size={size} />
        </ToolbarGroup>
        <ToolbarDivider />
        <ToolbarGroup label="More formatting">
          <ToolbarItems api={api} items={moreItems} size={size} />
        </ToolbarGroup>
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
