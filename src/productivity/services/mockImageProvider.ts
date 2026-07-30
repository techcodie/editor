import type { ImageProvider } from '../types/provider'
import type { GeneratedImage, ImageGenerationRequest } from '../types/productivity'
import { imagePromptSeed, normalizeImageRequest } from './imageProvider'

const PALETTES = [
  ['#171717', '#f5f5f4', '#4f46e5', '#d4d4d4'],
  ['#12372a', '#f0fdf4', '#16a34a', '#bbf7d0'],
  ['#3f1d2e', '#fff1f2', '#e11d48', '#fecdd3'],
  ['#172554', '#eff6ff', '#2563eb', '#bfdbfe'],
] as const

function wait(duration: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Image generation was cancelled.', 'AbortError'))
      return
    }
    const timeout = window.setTimeout(resolve, duration)
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timeout)
      reject(new DOMException('Image generation was cancelled.', 'AbortError'))
    }, { once: true })
  })
}

function renderMockImage(prompt: string, width: number, height: number, seed: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas rendering is unavailable in this browser.')

  const palette = PALETTES[seed % PALETTES.length]
  context.fillStyle = palette[1]
  context.fillRect(0, 0, width, height)
  context.strokeStyle = palette[3]
  context.lineWidth = Math.max(1, width / 640)
  const grid = Math.max(32, Math.round(width / 12))
  for (let x = 0; x < width; x += grid) {
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, height)
    context.stroke()
  }
  for (let y = 0; y < height; y += grid) {
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(width, y)
    context.stroke()
  }

  const unit = Math.min(width, height)
  context.fillStyle = palette[2]
  context.fillRect(width * 0.08, height * 0.15, width * 0.13, height * 0.62)
  context.beginPath()
  context.arc(width * 0.76, height * 0.33, unit * 0.16, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = palette[0]
  context.lineWidth = unit * 0.025
  context.strokeRect(width * 0.28, height * 0.48, width * 0.58, height * 0.28)

  context.fillStyle = palette[0]
  context.font = `600 ${Math.max(18, Math.round(width / 26))}px ui-sans-serif, system-ui`
  context.textBaseline = 'top'
  const words = prompt.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (context.measureText(candidate).width > width * 0.5 && line) {
      lines.push(line)
      line = word
    } else line = candidate
    if (lines.length === 2) break
  }
  if (line && lines.length < 3) lines.push(line)
  lines.slice(0, 3).forEach((value, index) => context.fillText(value, width * 0.28, height * 0.14 + index * width / 22))
  context.font = `500 ${Math.max(11, Math.round(width / 55))}px ui-sans-serif, system-ui`
  context.fillText('LOCAL MOCK PROVIDER', width * 0.29, height * 0.82)
  return canvas.toDataURL('image/png')
}

export class MockImageProvider implements ImageProvider {
  readonly id = 'mock-image'
  readonly name = 'Local Mock Images'
  readonly kind = 'image' as const
  readonly local = true
  readonly requiresApiKey = false
  private readonly cache = new Map<string, GeneratedImage[]>()

  isAvailable(): boolean {
    return typeof document !== 'undefined' && typeof HTMLCanvasElement !== 'undefined'
  }

  async generate(request: ImageGenerationRequest, signal?: AbortSignal): Promise<GeneratedImage[]> {
    const normalized = normalizeImageRequest(request)
    if (!normalized.prompt) throw new Error('Enter a prompt before generating images.')
    if (!this.isAvailable()) throw new Error('Local image generation requires a browser canvas.')
    const key = `${normalized.prompt}:${normalized.count}:${normalized.width}:${normalized.height}`
    const cached = this.cache.get(key)
    if (cached) return structuredClone(cached)

    await wait(520, signal)
    const images = Array.from({ length: normalized.count }, (_, index) => {
      const seed = imagePromptSeed(normalized.prompt, index)
      return {
        id: `mock-image-${seed}`,
        prompt: normalized.prompt,
        dataUrl: renderMockImage(normalized.prompt, normalized.width, normalized.height, seed),
        width: normalized.width,
        height: normalized.height,
        providerId: this.id,
        createdAt: Date.now() + index,
        seed,
      }
    })
    this.cache.set(key, structuredClone(images))
    if (this.cache.size > 24) this.cache.delete(this.cache.keys().next().value as string)
    return images
  }
}
