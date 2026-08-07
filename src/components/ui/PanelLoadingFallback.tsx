import { LoaderCircle } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface PanelLoadingFallbackProps {
  label: string
  widthClassName?: string
}

/**
 * Suspense fallback for a lazy-loaded right-dock panel. Mirrors PanelShell's
 * exact backdrop/positioning/z-index so there's no visual jump between the
 * loading placeholder and the real panel once its chunk resolves.
 */
export function PanelLoadingFallback({
  label,
  widthClassName = 'sm:max-w-[25rem] lg:w-[24rem]',
}: PanelLoadingFallbackProps) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] lg:hidden" aria-hidden />
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full items-center justify-center border-l border-neutral-200 bg-white',
          'lg:sticky lg:top-6 lg:z-30 lg:h-[calc(100vh-3rem)] lg:rounded-lg lg:border',
          widthClassName,
        )}
        role="status"
        aria-label={label}
      >
        <LoaderCircle size={20} strokeWidth={1.8} className="animate-spin text-neutral-400" aria-hidden />
      </div>
    </>
  )
}
