import { lazy, Suspense } from 'react'
import { Image, LoaderCircle } from 'lucide-react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import { cn } from '../../lib/cn'
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary'
import type { Asset } from '../../assets/types/asset'
import type { ToolbarButtonSize } from './ToolbarButton'

const AssetLibraryContent = lazy(async () => {
  const module = await import('../../assets/components/AssetLibrary')
  return { default: module.AssetLibrary }
})

export interface AssetLibraryToolbarControlProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  recentAssetIds: readonly string[]
  onSelectAsset: (asset: Asset) => void
  onCloseAutoFocus?: () => void
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
  'data-[state=open]:bg-neutral-900 data-[state=open]:text-white'

const CONTENT_CLASS =
  'z-50 flex h-[28rem] w-[25rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl ' +
  'border border-neutral-200/80 bg-white shadow-[var(--document-editor-shadow-raised)] ' +
  '[animation:toolbar-tooltip-in_120ms_ease-out]'

/**
 * Jodit-style floating asset picker anchored to its own toolbar trigger —
 * deliberately not the docked PanelShell/right-dock pattern every other
 * panel uses. AssetLibrary previously rendered as a flex sibling of the
 * editor column inside the same outer flex row, so opening it genuinely
 * shrank the editor's width; every other right-dock panel (Ask AI, Search,
 * Review, ...) keeps that docked layout intentionally — this is the one
 * exception, since browsing assets is a picker interaction, not a working
 * sidebar. Internal search/browse/insert logic (useAssetInsertion,
 * assetRegistry, AssetLibrary's own state) is untouched — only this outer
 * shell is new. Radix's default mount-on-open/unmount-on-close behavior is
 * used as-is (no forceMount): asset data is a static in-memory array with
 * nothing to fetch, so there's no slow reload to avoid by keeping it
 * mounted, and this keeps the popover implementation simple.
 */
export function AssetLibraryToolbarControl({
  isOpen,
  onOpenChange,
  recentAssetIds,
  onSelectAsset,
  onCloseAutoFocus,
  size = 'md',
}: AssetLibraryToolbarControlProps) {
  const dimensions = SIZE[size]

  return (
    <DropdownMenuPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <ToolbarPrimitive.Button asChild>
        <DropdownMenuPrimitive.Trigger
          aria-label={isOpen ? 'Close stamps & assets' : 'Stamps & assets'}
          title="Stamps & assets"
          className={cn(TRIGGER_CLASS, dimensions.button)}
        >
          <Image size={dimensions.icon} strokeWidth={1.9} aria-hidden />
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
          <ErrorBoundary compact title="Asset library needs a retry">
            <Suspense
              fallback={
                <div
                  className="flex h-full w-full items-center justify-center"
                  role="status"
                  aria-label="Loading asset library"
                >
                  <LoaderCircle size={20} strokeWidth={1.8} className="animate-spin text-neutral-400" aria-hidden />
                </div>
              }
            >
              <AssetLibraryContent
                recentAssetIds={recentAssetIds}
                onSelectAsset={(asset) => {
                  onSelectAsset(asset)
                  onOpenChange(false)
                }}
              />
            </Suspense>
          </ErrorBoundary>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}
