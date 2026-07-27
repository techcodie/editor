import type { CSSProperties } from 'react'
import type { Watermark } from '../types/watermark'

const POSITION_COORDINATES: Record<
  Exclude<Watermark['position'], 'custom'>,
  { x: number; y: number }
> = {
  center: { x: 50, y: 50 },
  'top-left': { x: 20, y: 18 },
  'top-right': { x: 80, y: 18 },
  'bottom-left': { x: 20, y: 82 },
  'bottom-right': { x: 80, y: 82 },
}

export interface WatermarkRenderStyle {
  anchor: CSSProperties
  text: CSSProperties
  image: CSSProperties
}

export function resolveWatermarkStyle(watermark: Watermark): WatermarkRenderStyle {
  const coordinates = watermark.position === 'custom'
    ? watermark.customPosition
    : POSITION_COORDINATES[watermark.position]
  const fontFamily = watermark.font === 'serif'
    ? 'Georgia, Cambria, "Times New Roman", serif'
    : watermark.font === 'mono'
      ? 'ui-monospace, SFMono-Regular, Menlo, monospace'
      : 'Inter, ui-sans-serif, system-ui, sans-serif'

  return {
    anchor: {
      left: `${coordinates.x}%`,
      top: `${coordinates.y}%`,
      opacity: watermark.opacity / 100,
      transform: `translate(-50%, -50%) rotate(${watermark.rotation}deg) scale(${watermark.scale / 100})`,
      transformOrigin: 'center',
    },
    text: {
      color: watermark.color,
      fontFamily,
      fontSize: 'clamp(28px, 7cqw, 76px)',
      fontWeight: 700,
      letterSpacing: 0,
      whiteSpace: 'nowrap',
    },
    image: {
      width: watermark.image?.fit === 'fill' ? '70cqw' : '44cqw',
      height: watermark.image?.fit === 'fill' ? '50cqh' : 'auto',
      maxHeight: '55cqh',
      objectFit: watermark.image?.fit === 'fill' ? 'cover' : 'contain',
    },
  }
}
