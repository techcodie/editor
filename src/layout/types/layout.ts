export type PaperSize = 'a4' | 'a5' | 'a3' | 'letter' | 'legal' | 'executive' | 'custom'
export type PageOrientation = 'portrait' | 'landscape'
export type MarginPreset = 'normal' | 'narrow' | 'wide' | 'custom'
export type PageAlignment = 'left' | 'center' | 'right'
export type PageNumberPosition = 'top' | 'bottom'

export interface PageMargins {
  preset: MarginPreset
  top: number
  right: number
  bottom: number
  left: number
}

export interface HeaderFooterContent {
  enabled: boolean
  text: string
  alignment: PageAlignment
}

export interface PageNumberSettings {
  enabled: boolean
  position: PageNumberPosition
  alignment: PageAlignment
  hideFirstPage: boolean
}

export interface PageLayout {
  paper: PaperSize
  orientation: PageOrientation
  margins: PageMargins
  header: HeaderFooterContent
  footer: HeaderFooterContent
  pageNumber: PageNumberSettings
  width: number
  height: number
}

export type PrintZoom = 50 | 75 | 100 | 125 | 150 | 'fit-width'
