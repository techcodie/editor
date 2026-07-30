import type { ImageGenerationRequest } from '../types/productivity'

export const IMAGE_GENERATION_LIMIT = 4
export const DEFAULT_IMAGE_WIDTH = 640
export const DEFAULT_IMAGE_HEIGHT = 400

export function normalizeImageRequest(request: ImageGenerationRequest): Required<ImageGenerationRequest> {
  return {
    prompt: request.prompt.trim().replace(/\s+/g, ' ').slice(0, 500),
    count: Math.min(IMAGE_GENERATION_LIMIT, Math.max(1, Math.round(request.count ?? 2))),
    width: Math.min(1200, Math.max(320, Math.round(request.width ?? DEFAULT_IMAGE_WIDTH))),
    height: Math.min(900, Math.max(240, Math.round(request.height ?? DEFAULT_IMAGE_HEIGHT))),
  }
}

export function imagePromptSeed(prompt: string, variant = 0): number {
  let hash = 2166136261 ^ variant
  for (let index = 0; index < prompt.length; index += 1) {
    hash ^= prompt.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}
