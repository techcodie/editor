import type { BoundingBox } from './layout'

export interface OCRTextRegion {
  id: string
  pageNumber: number
  text: string
  confidence: number
  boundingBox: BoundingBox
}

export interface OCRPageResult {
  pageNumber: number
  text: string
  confidence: number
  width: number
  height: number
  regions: OCRTextRegion[]
}

export interface OCRResult {
  text: string
  language: string
  confidence: number
  pages: OCRPageResult[]
}

export interface OCRProgress {
  status: string
  progress: number
}

export interface OCROptions {
  language?: string
  pageNumber?: number
  width?: number
  height?: number
  signal?: AbortSignal
  onProgress?: (progress: OCRProgress) => void
}
