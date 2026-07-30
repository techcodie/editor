import type { EditorApi, EditorInsertionTarget } from '../../lib/editor-api'
import type { GeneratedImage } from '../types/productivity'

export function insertGeneratedImage(
  api: EditorApi,
  image: GeneratedImage,
  target: EditorInsertionTarget = 'cursor',
): boolean {
  return api.insertAsset({
    assetId: image.id,
    type: 'generated-image',
    category: 'productivity',
    title: image.prompt.slice(0, 100),
    renderer: 'generated-image',
    renderData: {
      src: image.dataUrl,
      alt: image.prompt,
      providerId: image.providerId,
      seed: image.seed,
    },
    width: 520,
    height: Math.round(520 * image.height / image.width),
    rotation: 0,
  }, target)
}
