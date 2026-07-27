import type {
  MarginPreset,
  PageLayout,
  PageMargins,
  PaperSize,
} from '../types/layout'
import {
  DEFAULT_PAGE_LAYOUT,
  MARGIN_PRESETS,
  PAPER_DIMENSIONS,
} from './pageMetrics'

export function createPageLayout(): PageLayout {
  return structuredClone(DEFAULT_PAGE_LAYOUT)
}

export function setPaper(layout: PageLayout, paper: PaperSize): PageLayout {
  const dimensions = paper === 'custom'
    ? { width: layout.width, height: layout.height }
    : PAPER_DIMENSIONS[paper]
  return { ...layout, paper, ...dimensions }
}

export function setMarginPreset(
  layout: PageLayout,
  preset: MarginPreset,
): PageLayout {
  if (preset === 'custom') {
    return { ...layout, margins: { ...layout.margins, preset } }
  }
  return {
    ...layout,
    margins: { preset, ...MARGIN_PRESETS[preset] },
  }
}

export function setCustomMargins(
  layout: PageLayout,
  margins: Omit<PageMargins, 'preset'>,
): PageLayout {
  const pageWidth = layout.orientation === 'portrait' ? layout.width : layout.height
  const pageHeight = layout.orientation === 'portrait' ? layout.height : layout.width
  const fitPair = (first: number, second: number, maximum: number): [number, number] => {
    const safeFirst = Math.max(0, first)
    const safeSecond = Math.max(0, second)
    const total = safeFirst + safeSecond
    if (total <= maximum || total === 0) return [safeFirst, safeSecond]
    const scale = maximum / total
    return [safeFirst * scale, safeSecond * scale]
  }
  const [left, right] = fitPair(margins.left, margins.right, Math.max(0, pageWidth - 30))
  const [top, bottom] = fitPair(margins.top, margins.bottom, Math.max(0, pageHeight - 40))
  return {
    ...layout,
    margins: {
      preset: 'custom',
      top,
      right,
      bottom,
      left,
    },
  }
}
