import { useCallback, useState } from 'react'
import { clampWatermark, createWatermark } from '../services/watermarkEngine'
import type { Watermark, WatermarkType } from '../types/watermark'

export function useWatermark() {
  const [watermark, setWatermark] = useState<Watermark | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const addWatermark = useCallback((type: WatermarkType) => {
    setWatermark(createWatermark(type))
  }, [])

  const updateWatermark = useCallback((next: Watermark) => {
    setWatermark(clampWatermark(next))
  }, [])

  const removeWatermark = useCallback(() => setWatermark(null), [])

  return {
    watermark,
    isPanelOpen,
    addWatermark,
    updateWatermark,
    removeWatermark,
    setIsPanelOpen,
  }
}
