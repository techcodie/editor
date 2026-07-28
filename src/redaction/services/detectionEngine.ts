import type { DetectionOptions, SensitiveDataDetection } from '../types/detection'
import { detectEntities } from './entityDetector'
import { detectPatterns } from './patternDetector'

const cache = new Map<string, SensitiveDataDetection[]>()

function cacheKey(text: string, options: DetectionOptions): string {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619)
  const policies = options.customPatterns?.map((item) =>
    `${item.id}:${item.label}:${item.pattern.source}:${item.pattern.flags}`,
  ).join('|') ?? ''
  return `${hash >>> 0}:${text.length}:${policies}:${Boolean(options.aiProvider)}`
}

function checkAbort(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Detection cancelled', 'AbortError')
}

function removeOverlaps(detections: SensitiveDataDetection[]): SensitiveDataDetection[] {
  const sorted = detections.toSorted((left, right) =>
    left.range.from - right.range.from || right.confidence - left.confidence || right.value.length - left.value.length,
  )
  return sorted.filter((item, index) => !sorted.slice(0, index).some((kept) =>
    kept.range.from < item.range.to && kept.range.to > item.range.from && kept.confidence >= item.confidence,
  ))
}

export async function detectSensitiveData(text: string, options: DetectionOptions = {}): Promise<SensitiveDataDetection[]> {
  if (!text.trim()) return []
  const key = cacheKey(text, options)
  const cached = cache.get(key)
  if (cached) return structuredClone(cached)
  checkAbort(options.signal)
  options.onProgress?.({ stage: 'patterns', progress: 18, message: 'Scanning policy patterns' })
  await new Promise<void>((resolve) => globalThis.setTimeout(resolve, 0))
  const patternFindings = detectPatterns(text, options.customPatterns)
  checkAbort(options.signal)
  options.onProgress?.({ stage: 'entities', progress: 52, message: 'Classifying sensitive entities' })
  await new Promise<void>((resolve) => globalThis.setTimeout(resolve, 0))
  const entityFindings = detectEntities(text)
  checkAbort(options.signal)
  let aiFindings: SensitiveDataDetection[] = []
  if (options.aiProvider) {
    options.onProgress?.({ stage: 'ai', progress: 76, message: 'Running AI-assisted detection' })
    const response = await options.aiProvider.detect({ text, signal: options.signal ?? new AbortController().signal })
    if (!Array.isArray(response)) throw new Error('The AI detector returned an invalid response.')
    aiFindings = response.filter((item) =>
      Boolean(
        item?.id && item?.label && item?.value &&
        Number.isFinite(item?.confidence) &&
        Number.isInteger(item?.range?.from) && Number.isInteger(item?.range?.to) &&
        item.range.from >= 0 && item.range.to <= text.length && item.range.to > item.range.from,
      ),
    )
  }
  checkAbort(options.signal)
  const result = removeOverlaps([...patternFindings, ...entityFindings, ...aiFindings])
  cache.set(key, structuredClone(result))
  options.onProgress?.({ stage: 'complete', progress: 100, message: `${result.length} findings ready for review` })
  return result
}

export function clearDetectionCache(): void {
  cache.clear()
}
