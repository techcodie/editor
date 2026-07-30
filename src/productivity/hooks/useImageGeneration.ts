import { useCallback, useEffect, useRef, useState } from 'react'
import type { ImageProvider } from '../types/provider'
import type { GeneratedImage } from '../types/productivity'

export function useImageGeneration(provider: ImageProvider) {
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [status, setStatus] = useState<'idle' | 'generating' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setStatus('idle')
  }, [])

  useEffect(() => cancel, [cancel])

  const generate = useCallback(async (prompt: string) => {
    if (controllerRef.current || status === 'generating') return
    const controller = new AbortController()
    controllerRef.current = controller
    setStatus('generating')
    setError(null)
    try {
      const generated = await provider.generate({ prompt, count: 2 }, controller.signal)
      setImages((current) => [...generated, ...current.filter((item) => !generated.some((next) => next.id === item.id))].slice(0, 20))
      setStatus('idle')
      return generated
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') {
        setStatus('idle')
        return
      }
      setError(cause instanceof Error ? cause.message : 'Images could not be generated.')
      setStatus('error')
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }, [provider, status])

  return { images, status, error, generate, cancel, clearHistory: () => setImages([]) }
}
