import { useCallback, useRef, useState } from 'react'
import { recognizeImage } from '../services/ocrEngine'
import type { OCROptions, OCRPageResult, OCRProgress } from '../types/ocr'

export function useOCR() {
  const controllerRef = useRef<AbortController | null>(null)
  const [result, setResult] = useState<OCRPageResult | null>(null)
  const [progress, setProgress] = useState<OCRProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRecognizing, setIsRecognizing] = useState(false)

  const cancel = useCallback(() => controllerRef.current?.abort(), [])
  const recognize = useCallback(async (
    image: File | Blob | HTMLCanvasElement,
    options: Omit<OCROptions, 'signal' | 'onProgress'> = {},
  ) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsRecognizing(true)
    setError(null)
    setProgress({ status: 'starting OCR', progress: 0 })
    try {
      const nextResult = await recognizeImage(image, {
        ...options,
        signal: controller.signal,
        onProgress: setProgress,
      })
      setResult(nextResult)
      return nextResult
    } catch (caught) {
      if (controller.signal.aborted) return null
      setError(caught instanceof Error ? caught.message : 'Text recognition failed.')
      return null
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null
        setIsRecognizing(false)
      }
    }
  }, [])

  return { result, progress, error, isRecognizing, recognize, cancel }
}
