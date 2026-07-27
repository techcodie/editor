import type { Watermark } from '../types/watermark'
import { WatermarkLayer } from './WatermarkLayer'

interface WatermarkPreviewProps {
  watermark: Watermark
}

export function WatermarkPreview({ watermark }: WatermarkPreviewProps) {
  return (
    <div className="border-b border-neutral-200 bg-neutral-100/70 p-4">
      <div className="mx-auto aspect-[210/297] w-36 overflow-hidden bg-white shadow-sm ring-1 ring-neutral-200">
        <div className="relative h-full w-full">
          <div className="space-y-2 px-5 py-7 opacity-35" aria-hidden="true">
            <span className="block h-2 w-2/3 rounded bg-neutral-300" />
            <span className="block h-1.5 w-full rounded bg-neutral-200" />
            <span className="block h-1.5 w-5/6 rounded bg-neutral-200" />
            <span className="mt-5 block h-1.5 w-full rounded bg-neutral-200" />
            <span className="block h-1.5 w-4/5 rounded bg-neutral-200" />
          </div>
          <WatermarkLayer
            watermark={watermark}
            pages={[{ number: 1, top: 0, width: 144, height: 204 }]}
            currentPage={1}
            forceVisible
          />
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] font-medium text-neutral-500">Live preview</p>
    </div>
  )
}
