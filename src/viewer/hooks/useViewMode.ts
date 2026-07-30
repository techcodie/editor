import { useCallback, useState } from 'react'
import type { DocumentViewMode, ViewerZoom } from '../types/viewer'
import { nextViewerZoom } from '../services/viewManager'

export function useViewMode() {
  const [mode, setMode] = useState<DocumentViewMode>('editor')
  const [zoom, setZoom] = useState<ViewerZoom>(100)

  const selectMode = useCallback((nextMode: DocumentViewMode) => {
    setMode(nextMode)
  }, [])
  const closeViewer = useCallback(() => setMode('editor'), [])
  const zoomIn = useCallback(() => setZoom((current) => nextViewerZoom(current, 1)), [])
  const zoomOut = useCallback(() => setZoom((current) => nextViewerZoom(current, -1)), [])

  return { mode, zoom, setZoom, selectMode, closeViewer, zoomIn, zoomOut }
}
