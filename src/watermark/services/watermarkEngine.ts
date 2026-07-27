import type {
  Watermark,
  WatermarkApplyMode,
  WatermarkPageRange,
  WatermarkType,
} from '../types/watermark'

export const TEXT_WATERMARK_PRESETS = [
  'CONFIDENTIAL',
  'DRAFT',
  'SAMPLE',
  'COPY',
  'INTERNAL',
] as const

export function createWatermark(type: WatermarkType = 'text'): Watermark {
  return {
    id: crypto.randomUUID(),
    type,
    text: type === 'text' ? 'CONFIDENTIAL' : '',
    image: null,
    opacity: 18,
    rotation: -45,
    scale: 100,
    position: 'center',
    customPosition: { x: 50, y: 50 },
    color: '#64748b',
    font: 'sans',
    applyMode: 'document',
    pageRange: { start: 1, end: 1 },
    locked: false,
  }
}
export function normalizePageRange(
  pageRange: WatermarkPageRange,
  pageCount: number,
): WatermarkPageRange {
  const maximum = Math.max(1, pageCount)
  const start = Math.min(maximum, Math.max(1, Math.round(pageRange.start)))
  const end = Math.min(maximum, Math.max(start, Math.round(pageRange.end)))
  return { start, end }
}

export function appliesToPage(
  watermark: Watermark,
  pageNumber: number,
  currentPage: number,
): boolean {
  const modes: Record<WatermarkApplyMode, boolean> = {
    document: true,
    'current-page': pageNumber === currentPage,
    'page-range': pageNumber >= watermark.pageRange.start && pageNumber <= watermark.pageRange.end,
    'even-pages': pageNumber % 2 === 0,
    'odd-pages': pageNumber % 2 === 1,
  }
  return modes[watermark.applyMode]
}

export function clampWatermark(watermark: Watermark): Watermark {
  return {
    ...watermark,
    opacity: Math.min(100, Math.max(0, watermark.opacity)),
    scale: Math.min(200, Math.max(25, watermark.scale)),
    customPosition: {
      x: Math.min(100, Math.max(0, watermark.customPosition.x)),
      y: Math.min(100, Math.max(0, watermark.customPosition.y)),
    },
  }
}
