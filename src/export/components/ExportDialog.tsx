import { useState } from 'react'
import { Download, FileDown } from 'lucide-react'
import type { EditorApi } from '../../lib/editor-api'
import type { PageLayout } from '../../layout/types/layout'
import type { PaginationSnapshot } from '../../layout/types/page'
import type { Comment } from '../../review/types/comment'
import type { TrackChange } from '../../review/trackChanges/types/trackChange'
import type { Watermark } from '../../watermark/types/watermark'
import type { Workflow } from '../../workflow/types/workflow'
import type { RedactionRecord } from '../../redaction/types/redaction'
import type { IdentityAuditInput } from '../../identity/types/identity'
import { Dialog } from '../../components/ui/Dialog'
import { Button } from '../../components/ui/Button'
import { useExport } from '../hooks/useExport'
import { formatBytes } from '../services/exportManager'
import {
  DEFAULT_EXPORT_OPTIONS,
  EXPORT_FORMAT_LABELS,
  type ExportFormat,
  type ExportOptions as ExportOptionsModel,
  type ExportRequest,
} from '../types/export'
import { ExportHistory } from './ExportHistory'
import { ExportOptions } from './ExportOptions'
import { ExportProgress } from './ExportProgress'
import { FormatSelector } from './FormatSelector'

interface ExportDialogProps {
  isOpen: boolean
  api: EditorApi | null
  layout: PageLayout
  pagination: PaginationSnapshot
  watermark: Watermark | null
  comments: Comment[]
  trackChanges: TrackChange[]
  workflow: Workflow | null
  redactions: RedactionRecord[]
  onClose: () => void
  onAudit?: (input: IdentityAuditInput) => void
}

function documentTitle(text: string): string {
  const firstLine = text.split('\n').map((line) => line.replace(/^#+\s*/, '').trim()).find(Boolean)
  return firstLine?.slice(0, 72) || 'Untitled document'
}

export function ExportDialog({
  isOpen,
  api,
  layout,
  pagination,
  watermark,
  comments,
  trackChanges,
  workflow,
  redactions,
  onClose,
  onAudit,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [options, setOptions] = useState<ExportOptionsModel>(DEFAULT_EXPORT_OPTIONS)
  const {
    jobs,
    activeJob,
    isExporting,
    startExport,
    downloadExport,
    clearHistory,
  } = useExport({ onAudit })
  const createRequest = (): ExportRequest | null => {
    if (!api) return null
    const text = api.getDocumentText()
    return {
      format,
      options,
      source: {
        title: documentTitle(text),
        document: api.getDocumentSnapshot(),
        text,
        layout,
        pagination,
        watermark,
        comments,
        trackChanges,
        workflow,
        redactions,
      },
    }
  }
  const estimatedSize = Math.max(
    4_096,
    Math.round((api?.getDocumentText().length ?? 0) * (format === 'html' ? 1.25 : 0.7)),
  )
  const visibleJob = activeJob ?? jobs[0] ?? null

  return (
    <Dialog
      id="export-dialog"
      isOpen={isOpen}
      onClose={onClose}
      disableClose={isExporting}
      title="Export document"
      subtitle="Create a portable file from the current document"
      icon={FileDown}
      iconTone="accent"
      labelledById="export-dialog-title"
      describedById="export-dialog-description"
      maxWidthClassName="max-w-[34rem]"
      footer={
        <>
          <span className="text-[10px] text-neutral-500">Estimated {formatBytes(estimatedSize)}</span>
          <Button
            variant="primary"
            className="ml-auto min-w-28"
            icon={Download}
            disabled={!api}
            isLoading={isExporting}
            onClick={() => {
              const request = createRequest()
              if (request) void startExport(request)
            }}
          >
            {isExporting ? 'Exporting...' : `Export ${EXPORT_FORMAT_LABELS[format]}`}
          </Button>
        </>
      }
    >
      <FormatSelector value={format} onChange={setFormat} />
      <ExportOptions
        value={options}
        commentCount={comments.length}
        trackChangeCount={trackChanges.length}
        hasWatermark={Boolean(watermark)}
        hasWorkflow={Boolean(workflow)}
        onChange={setOptions}
      />
      {visibleJob && <ExportProgress job={visibleJob} />}
      <ExportHistory jobs={jobs} onDownload={downloadExport} onClear={clearHistory} />
    </Dialog>
  )
}
