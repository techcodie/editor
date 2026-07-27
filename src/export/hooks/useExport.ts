import { useCallback, useState } from 'react'
import { downloadExport, runExport } from '../services/exportManager'
import type { ExportJob, ExportRequest } from '../types/export'

const HISTORY_LIMIT = 8

export function useExport() {
  const [jobs, setJobs] = useState<ExportJob[]>([])
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  const startExport = useCallback(async (request: ExportRequest) => {
    if (activeJobId) return null
    const id = crypto.randomUUID()
    const job: ExportJob = {
      id,
      format: request.format,
      status: 'queued',
      createdAt: Date.now(),
      options: structuredClone(request.options),
      progress: 5,
      result: null,
      error: null,
    }
    setActiveJobId(id)
    setJobs((current) => [job, ...current].slice(0, HISTORY_LIMIT))
    try {
      const result = await runExport(request, ({ status, progress }) => {
        setJobs((current) => current.map((item) =>
          item.id === id ? { ...item, status, progress } : item,
        ))
      })
      setJobs((current) => current.map((item) =>
        item.id === id ? { ...item, status: 'completed', progress: 100, result } : item,
      ))
      downloadExport(result)
      return result
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : 'The export could not be generated'
      setJobs((current) => current.map((item) =>
        item.id === id ? { ...item, status: 'failed', error: message } : item,
      ))
      return null
    } finally {
      setActiveJobId(null)
    }
  }, [activeJobId])

  const clearHistory = useCallback(() => setJobs((current) =>
    current.filter((job) => job.id === activeJobId),
  ), [activeJobId])

  return {
    jobs,
    activeJob: jobs.find((job) => job.id === activeJobId) ?? null,
    isExporting: Boolean(activeJobId),
    startExport,
    downloadExport,
    clearHistory,
  }
}
