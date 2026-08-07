import { useEffect, useRef, useState } from 'react'
import { Link2 } from 'lucide-react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import { cn } from '../../lib/cn'
import type { EditorApi } from '../../lib/editor-api'
import { Tooltip } from '../ui/Tooltip'
import type { ToolbarButtonSize } from './ToolbarButton'

export interface LinkToolbarControlProps {
  api: EditorApi | null
  size?: ToolbarButtonSize
}

const SIZE: Record<ToolbarButtonSize, { button: string; icon: number }> = {
  sm: { button: 'h-7 w-7', icon: 15 },
  md: { button: 'h-8 w-8', icon: 16 },
}

const TRIGGER_CLASS =
  'inline-flex shrink-0 items-center justify-center rounded-md text-neutral-500 ' +
  'transition-[background-color,color,box-shadow,transform] duration-150 ' +
  'hover:bg-neutral-100 hover:text-neutral-950 ' +
  'active:scale-[0.96] active:bg-neutral-200/70 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] ' +
  'focus-visible:ring-offset-1 focus-visible:ring-offset-white ' +
  'disabled:pointer-events-none disabled:opacity-35 ' +
  'aria-pressed:bg-neutral-900 aria-pressed:text-white aria-pressed:hover:bg-neutral-800 aria-pressed:hover:text-white'

const CONTENT_CLASS =
  'z-50 w-[19rem] overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-3 ' +
  'shadow-[var(--document-editor-shadow-raised)] [animation:toolbar-tooltip-in_120ms_ease-out]'

const INPUT_CLASS =
  'w-full rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[13px] text-neutral-900 ' +
  'outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-neutral-400 ' +
  'focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-[var(--document-editor-focus-ring)]/40'

const APPLY_BUTTON_CLASS =
  'rounded-md bg-neutral-900 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors ' +
  'hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)] ' +
  'disabled:pointer-events-none disabled:opacity-40'

const REMOVE_BUTTON_CLASS =
  'rounded-md px-3 py-1.5 text-[12px] font-semibold text-red-600 transition-colors hover:bg-red-50 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]'

/**
 * Insert/Edit/Remove Link. `Link` ships inside StarterKit already (see
 * src/extensions/index.ts) — this exposes it through EditorApi.setLink /
 * unsetLink / isLink / getLinkHref instead of a new capability.
 */
export function LinkToolbarControl({ api, size = 'md' }: LinkToolbarControlProps) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const isLink = api?.isLink() ?? false
  const dimensions = SIZE[size]

  useEffect(() => {
    if (!open) return
    setUrl(api?.getLinkHref() ?? '')
    // Radix's DropdownMenuContent doesn't expose `onOpenAutoFocus` publicly
    // (it focuses its own container by default) — grab focus back for the
    // URL input a frame after mount so typing works immediately.
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
    return () => cancelAnimationFrame(frame)
  }, [open, api])

  const apply = () => {
    if (!api) return
    const trimmed = url.trim()
    if (trimmed) api.setLink(trimmed)
    setOpen(false)
  }

  const remove = () => {
    api?.unsetLink()
    setOpen(false)
  }

  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
      <Tooltip content={isLink ? 'Edit link' : 'Insert link'}>
        <ToolbarPrimitive.Button asChild disabled={!api}>
          <DropdownMenuPrimitive.Trigger
            aria-label={isLink ? 'Edit link' : 'Insert link'}
            aria-pressed={isLink}
            disabled={!api}
            className={cn(TRIGGER_CLASS, dimensions.button)}
          >
            <Link2 size={dimensions.icon} strokeWidth={1.9} aria-hidden />
          </DropdownMenuPrimitive.Trigger>
        </ToolbarPrimitive.Button>
      </Tooltip>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="start"
          sideOffset={6}
          className={CONTENT_CLASS}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            api?.focus()
          }}
        >
          <label htmlFor="document-editor-link-url" className="mb-1.5 block text-[11px] font-semibold text-neutral-500">
            Link URL
          </label>
          <input
            id="document-editor-link-url"
            ref={inputRef}
            type="text"
            inputMode="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                apply()
              }
              if (event.key === 'Escape') {
                event.preventDefault()
                setOpen(false)
              }
            }}
            placeholder="https://example.com"
            className={INPUT_CLASS}
          />
          <div className="mt-2.5 flex items-center justify-end gap-1.5">
            {isLink && (
              <button type="button" onClick={remove} className={REMOVE_BUTTON_CLASS}>
                Remove
              </button>
            )}
            <button type="button" onClick={apply} disabled={!url.trim()} className={APPLY_BUTTON_CLASS}>
              {isLink ? 'Update' : 'Insert'}
            </button>
          </div>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}
