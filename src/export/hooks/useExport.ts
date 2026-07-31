import { useCallback, useState } from 'react'
import { downloadExport, runExport } from '../services/exportManager'
import type { ExportJob, ExportRequest } from '../types/export'
import type { IdentityAuditInput } from '../../identity/types/identity'

const HISTORY_LIMIT = 8

export function useExport({
  onAudit,
}: {
  onAudit?: (input: IdentityAuditInput) => void
} = {}) {
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
    onAudit?.({
      category: 'export',
      action: 'export.started',
      outcome: 'success',
      resourceId: id,
      details: { format: request.format },
    })
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
      onAudit?.({
        category: 'export',
        action: 'export.completed',
        outcome: 'success',
        resourceId: id,
        details: { format: request.format, size: result.size },
      })
      return result
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : 'The export could not be generated'
      setJobs((current) => current.map((item) =>
        item.id === id ? { ...item, status: 'failed', error: message } : item,
      ))
      onAudit?.({
        category: 'export',
        action: 'export.failed',
        outcome: 'failure',
        resourceId: id,
        details: { format: request.format },
      })
      return null
    } finally {
      setActiveJobId(null)
    }
  }, [activeJobId, onAudit])

  const download = useCallback((result: Parameters<typeof downloadExport>[0]) => {
    downloadExport(result)
    onAudit?.({
      category: 'export',
      action: 'export.downloaded',
      outcome: 'success',
      details: { fileName: result.fileName, size: result.size },
    })
  }, [onAudit])

  const clearHistory = useCallback(() => setJobs((current) =>
    current.filter((job) => job.id === activeJobId),
  ), [activeJobId])

  return {
    jobs,
    activeJob: jobs.find((job) => job.id === activeJobId) ?? null,
    isExporting: Boolean(activeJobId),
    startExport,
    downloadExport: download,
    clearHistory,
  }
}
