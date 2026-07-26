import type { Asset } from './asset'

export type StampStyle =
  | 'rubber'
  | 'outline'
  | 'filled'
  | 'double-border'
  | 'rounded'
  | 'circular'
  | 'diagonal'
  | 'vintage'
  | 'modern'
  | 'badge'

export type StampIcon =
  | 'check'
  | 'x'
  | 'lock'
  | 'wallet'
  | 'truck'
  | 'shield'
  | 'eye'
  | 'calendar'
  | 'signature'
  | 'heart'
  | 'wrench'
  | 'users'

export interface StampMetadata extends Record<string, unknown> {
  text: string
  style: StampStyle
  icon?: StampIcon
  color: string
  background: string
  border: string
  width: number
  height: number
  rotation: number
}

export interface StampAsset extends Asset<StampMetadata> {
  type: 'stamp'
  renderer: 'stamp'
  text: string
  style: StampStyle
  icon?: StampIcon
  color: string
  background: string
  border: string
}

export interface StampRendererProps {
  text: string
  style: StampStyle
  icon?: StampIcon
  color: string
  background: string
  border: string
  width?: number
  height?: number
  rotation?: number
  className?: string
  title?: string
}
