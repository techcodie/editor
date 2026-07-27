import { memo } from 'react'
import { appliesToPage } from '../services/watermarkEngine'
import { resolveWatermarkStyle } from '../services/watermarkRenderer'
import type { Watermark, WatermarkPageGeometry } from '../types/watermark'

interface WatermarkLayerProps {
  watermark: Watermark | null
  pages: WatermarkPageGeometry[]
  currentPage: number
  forceVisible?: boolean
}

function WatermarkLayerComponent({
  watermark,
  pages,
  currentPage,
  forceVisible = false,
}: WatermarkLayerProps) {
  if (!watermark) return null
  const styles = resolveWatermarkStyle(watermark)

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden" aria-hidden="true">
      {pages.map((page) => {
        if (!forceVisible && !appliesToPage(watermark, page.number, currentPage)) return null
        return (
          <div
            key={`${watermark.id}-page-${page.number}`}
            data-watermark-page={page.number}
            className="absolute left-0 overflow-hidden"
            style={{
              top: page.top,
              width: page.width,
              height: page.height,
              contentVisibility: 'auto',
              contain: 'layout paint style',
              containerType: 'size',
            }}
          >
            <div className="absolute select-none" style={styles.anchor}>
              {watermark.type === 'text' ? (
                <span className="block" style={styles.text}>{watermark.text}</span>
              ) : watermark.image ? (
                <img
                  src={watermark.image.source}
                  alt=""
                  draggable="false"
                  style={styles.image}
                />
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export const WatermarkLayer = memo(WatermarkLayerComponent)
