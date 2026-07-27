export type WatermarkType = 'text' | 'image' | 'logo' | 'svg'
export type WatermarkPosition =
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'custom'
export type WatermarkApplyMode =
  | 'document'
  | 'current-page'
  | 'page-range'
  | 'even-pages'
  | 'odd-pages'
export type WatermarkRotation = -90 | -45 | 0 | 45 | 90
export type WatermarkFont = 'sans' | 'serif' | 'mono'
export type WatermarkImageFit = 'fit' | 'fill'

export interface WatermarkPageRange {
  start: number
  end: number
}

export interface WatermarkImage {
  name: string
  source: string
  mimeType: 'image/png' | 'image/svg+xml'
  fit: WatermarkImageFit
}

export interface Watermark {
  id: string
  type: WatermarkType
  text: string
  image: WatermarkImage | null
  opacity: number
  rotation: WatermarkRotation
  scale: number
  position: WatermarkPosition
  customPosition: { x: number; y: number }
  color: string
  font: WatermarkFont
  applyMode: WatermarkApplyMode
  pageRange: WatermarkPageRange
  locked: boolean
}

export interface WatermarkPageGeometry {
  number: number
  top: number
  width: number
  height: number
}
