import type {
  MarginPreset,
  PageLayout,
  PageMargins,
  PaperSize,
} from '../types/layout'

const MILLIMETERS_PER_INCH = 25.4
const CSS_PIXELS_PER_INCH = 96

export const PAPER_DIMENSIONS: Record<PaperSize, { width: number; height: number }> = {
  a4: { width: 210, height: 297 },
  a5: { width: 148, height: 210 },
  a3: { width: 297, height: 420 },
  letter: { width: 215.9, height: 279.4 },
  legal: { width: 215.9, height: 355.6 },
  executive: { width: 184.15, height: 266.7 },
  custom: { width: 210, height: 297 },
}

export const MARGIN_PRESETS: Record<Exclude<MarginPreset, 'custom'>, Omit<PageMargins, 'preset'>> = {
  normal: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
  narrow: { top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 },
  wide: { top: 25.4, right: 50.8, bottom: 25.4, left: 50.8 },
}

export const DEFAULT_PAGE_LAYOUT: PageLayout = {
  paper: 'a4',
  orientation: 'portrait',
  margins: { preset: 'normal', ...MARGIN_PRESETS.normal },
  header: { enabled: false, text: '', alignment: 'left' },
  footer: { enabled: false, text: '', alignment: 'left' },
  pageNumber: {
    enabled: true,
    position: 'bottom',
    alignment: 'center',
    hideFirstPage: false,
  },
  width: PAPER_DIMENSIONS.a4.width,
  height: PAPER_DIMENSIONS.a4.height,
}

export interface ResolvedPageMetrics {
  width: number
  height: number
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
  contentWidth: number
  contentHeight: number
}

export function millimetersToPixels(value: number): number {
  return (value / MILLIMETERS_PER_INCH) * CSS_PIXELS_PER_INCH
}

export function resolvePageMetrics(layout: PageLayout): ResolvedPageMetrics {
  const portraitWidth = millimetersToPixels(layout.width)
  const portraitHeight = millimetersToPixels(layout.height)
  const width = layout.orientation === 'portrait' ? portraitWidth : portraitHeight
  const height = layout.orientation === 'portrait' ? portraitHeight : portraitWidth
  const marginTop = millimetersToPixels(layout.margins.top)
  const marginRight = millimetersToPixels(layout.margins.right)
  const marginBottom = millimetersToPixels(layout.margins.bottom)
  const marginLeft = millimetersToPixels(layout.margins.left)
  return {
    width,
    height,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    contentWidth: Math.max(120, width - marginLeft - marginRight),
    contentHeight: Math.max(160, height - marginTop - marginBottom),
  }
}

export function paperLabel(paper: PaperSize): string {
  if (paper === 'a4') return 'A4'
  if (paper === 'a5') return 'A5'
  if (paper === 'a3') return 'A3'
  return paper.charAt(0).toUpperCase() + paper.slice(1)
}
