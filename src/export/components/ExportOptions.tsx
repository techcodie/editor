import type { ExportOptions as ExportOptionsModel } from '../types/export'
import { Checkbox } from '../../components/ui/Checkbox'
import { cn } from '../../lib/cn'

interface ExportOptionsProps {
  value: ExportOptionsModel
  commentCount: number
  trackChangeCount: number
  hasWatermark: boolean
  hasWorkflow: boolean
  onChange: (options: ExportOptionsModel) => void
}

interface OptionDefinition {
  key: keyof ExportOptionsModel
  label: string
  description: string
  disabled?: boolean
}

export function ExportOptions({
  value,
  commentCount,
  trackChangeCount,
  hasWatermark,
  hasWorkflow,
  onChange,
}: ExportOptionsProps) {
  const options: OptionDefinition[] = [
    { key: 'includeWatermarks', label: 'Include watermark', description: 'Use the active page watermark', disabled: !hasWatermark },
    { key: 'includeAssets', label: 'Include assets', description: 'Render images and document stamps' },
    { key: 'includeComments', label: 'Include comments', description: `${commentCount} review threads`, disabled: commentCount === 0 },
    { key: 'includeTrackChanges', label: 'Include tracked changes', description: `${trackChangeCount} suggestions`, disabled: trackChangeCount === 0 },
    { key: 'includeWorkflowSummary', label: 'Include approval workflow', description: 'Status, stages, reviewers, and audit events', disabled: !hasWorkflow },
    { key: 'flattenSuggestions', label: 'Flatten suggestions', description: 'Use the proposed final wording', disabled: trackChangeCount === 0 },
    { key: 'exportMetadata', label: 'Export metadata', description: 'Title, creation time, and generator' },
  ]

  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="text-[11px] font-semibold text-neutral-900">Content</legend>
      <div className="mt-2 divide-y divide-neutral-100 rounded-md border border-neutral-200 bg-white">
        {options.map((option) => (
          <div key={option.key} className="flex min-h-12 items-center px-3 py-2">
            <Checkbox
              checked={option.disabled ? false : value[option.key]}
              disabled={option.disabled}
              onChange={(event) => onChange({ ...value, [option.key]: event.target.checked })}
              className={cn('w-full', option.disabled && 'opacity-50')}
              label={
                <span className="min-w-0">
                  <span className="block text-[11px] font-medium text-neutral-800">{option.label}</span>
                  <span className="block text-[9px] text-neutral-500">{option.description}</span>
                </span>
              }
            />
          </div>
        ))}
      </div>
    </fieldset>
  )
}
