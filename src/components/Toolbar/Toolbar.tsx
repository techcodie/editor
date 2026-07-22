import { Fragment, useSyncExternalStore } from 'react'
import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import * as Tooltip from '@radix-ui/react-tooltip'
import { cn } from '../../lib/cn'
import type { EditorApi } from '../../lib/editor-api'
import { ToolbarButton } from './ToolbarButton'
import type { ToolbarButtonSize } from './ToolbarButton'
import { ToolbarGroup } from './ToolbarGroup'
import { ToolbarDivider } from './ToolbarDivider'
import { TOOLBAR_SECTIONS } from './toolbar.config'

const NOOP_SUBSCRIBE = () => () => {}
const NULL_SNAPSHOT = () => null

export interface ToolbarProps {
  /** Public editor API the toolbar drives. Null until the editor is ready. */
  api: EditorApi | null
  /** Pin the toolbar to the top of its scroll container. */
  sticky?: boolean
  /** Size applied to every button. */
  size?: ToolbarButtonSize
  className?: string
}

const TOOLBAR_CLASS =
  'flex w-full items-center gap-1 rounded-xl border border-neutral-200/80 bg-white/85 p-1.5 ' +
  'shadow-[0_1px_2px_rgba(16,15,15,0.04),0_10px_30px_-16px_rgba(16,15,15,0.12)] ' +
  'supports-[backdrop-filter]:bg-white/70 backdrop-blur-md ' +
  // Horizontal scroll on mobile; wrap into rows from the `sm` breakpoint up.
  'flex-nowrap overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ' +
  'sm:flex-wrap sm:overflow-visible'

export function Toolbar({ api, sticky = false, size = 'md', className }: ToolbarProps) {
  // Re-render on every editor change so active/disabled states stay in sync —
  // without the toolbar ever importing Tiptap.
  useSyncExternalStore(api?.subscribe ?? NOOP_SUBSCRIBE, api?.getSnapshot ?? NULL_SNAPSHOT)

  return (
    <Tooltip.Provider delayDuration={300} skipDelayDuration={200}>
      <ToolbarPrimitive.Root
        aria-label="Text formatting"
        className={cn(TOOLBAR_CLASS, sticky && 'sticky top-4 z-30', className)}
      >
        {TOOLBAR_SECTIONS.map((section, index) => (
          <Fragment key={section.id}>
            {index > 0 && <ToolbarDivider />}
            <ToolbarGroup label={section.label}>
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
      </ToolbarPrimitive.Root>
    </Tooltip.Provider>
  )
}
