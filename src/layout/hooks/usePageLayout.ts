import { useCallback, useState } from 'react'
import type { PageLayout, PrintZoom } from '../types/layout'
import { createPageLayout } from '../services/layoutEngine'

export function usePageLayout() {
  const [layout, setLayout] = useState<PageLayout>(createPageLayout)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false)
  const [printZoom, setPrintZoom] = useState<PrintZoom>('fit-width')

  const updateLayout = useCallback((update: (current: PageLayout) => PageLayout) => {
    setLayout((current) => update(current))
  }, [])

  return {
    layout,
    isPanelOpen,
    isPrintPreviewOpen,
    printZoom,
    setLayout,
    updateLayout,
    setIsPanelOpen,
    setIsPrintPreviewOpen,
    setPrintZoom,
  }
}
