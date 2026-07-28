import { useCallback, useEffect, useRef, useState } from 'react'
import type { EditorApi } from '../../lib/editor-api'
import { detectSensitiveData } from '../services/detectionEngine'
import type { AiDetectionProvider, DetectionProgress, SensitiveDataDetection } from '../types/detection'

const IDLE: DetectionProgress = { stage: 'idle', progress: 0, message: 'Ready to scan' }

export function useDetection({ api, active, aiProvider }: { api: EditorApi | null; active: boolean; aiProvider?: AiDetectionProvider }) {
  const controllerRef = useRef<AbortController | null>(null)
  const initialScanRef = useRef(false)
  const [detections, setDetections] = useState<SensitiveDataDetection[]>([])
  const [progress, setProgress] = useState<DetectionProgress>(IDLE)
  const [isDetecting, setIsDetecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cancel = useCallback(() => controllerRef.current?.abort(), [])
  const scan = useCallback(async (fresh = false) => {
    if (!api) return []
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsDetecting(true)
    setError(null)
    if (fresh) setDetections([])
    try {
      const result = await detectSensitiveData(api.getDocumentText(), {
        aiProvider, signal: controller.signal, onProgress: setProgress,
      })
      setDetections(result)
      return result
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return []
      setError(reason instanceof Error ? reason.message : 'Sensitive data detection failed.')
      return []
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null
        setIsDetecting(false)
      }
    }
  }, [aiProvider, api])

  useEffect(() => {
    initialScanRef.current = false
  }, [api])
  useEffect(() => {
    if (active && api && !initialScanRef.current) {
      initialScanRef.current = true
      void scan()
    }
  }, [active, api, detections.length, isDetecting, scan])
  useEffect(() => {
    if (!active || !api) return
    let timeout: ReturnType<typeof globalThis.setTimeout> | undefined
    const unsubscribe = api.subscribeDocumentChanges(() => {
      globalThis.clearTimeout(timeout)
      timeout = globalThis.setTimeout(() => void scan(true), 500)
    })
    return () => {
      globalThis.clearTimeout(timeout)
      unsubscribe()
    }
  }, [active, api, scan])
  useEffect(() => cancel, [cancel])

  return { detections, setDetections, progress, isDetecting, error, scan, cancel }
}
