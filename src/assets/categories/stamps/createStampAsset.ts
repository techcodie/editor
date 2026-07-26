import type { AssetCategory } from '../../types/asset'
import type {
  StampAsset,
  StampIcon,
  StampMetadata,
  StampStyle,
} from '../../types/stamp'

interface StampPresetInput {
  id: string
  title: string
  text?: string
  category: AssetCategory
  description: string
  tags: readonly string[]
  style: StampStyle
  icon?: StampIcon
  color: string
  background?: string
  border?: string
  width?: number
  height?: number
  rotation?: number
}

export function createStampAsset(input: StampPresetInput): StampAsset {
  const text = input.text ?? input.title.toLocaleUpperCase()
  const background = input.background ?? 'transparent'
  const border = input.border ?? input.color
  const metadata: StampMetadata = {
    text,
    style: input.style,
    ...(input.icon ? { icon: input.icon } : {}),
    color: input.color,
    background,
    border,
    width: input.width ?? 200,
    height: input.height ?? 88,
    rotation: input.rotation ?? 0,
  }

  return {
    id: input.id,
    category: input.category,
    type: 'stamp',
    title: input.title,
    description: input.description,
    tags: input.tags,
    renderer: 'stamp',
    metadata,
    text,
    style: input.style,
    ...(input.icon ? { icon: input.icon } : {}),
    color: input.color,
    background,
    border,
  }
}
