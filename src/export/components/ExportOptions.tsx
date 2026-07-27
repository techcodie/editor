import type { ExportOptions as ExportOptionsModel } from '../types/export'

interface ExportOptionsProps {
  value: ExportOptionsModel
  commentCount: number
  trackChangeCount: number
  hasWatermark: boolean
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
  onChange,
}: ExportOptionsProps) {
  const options: OptionDefinition[] = [
    { key: 'includeWatermarks', label: 'Include watermark', description: 'Use the active page watermark', disabled: !hasWatermark },
    { key: 'includeAssets', label: 'Include assets', description: 'Render images and document stamps' },
    { key: 'includeComments', label: 'Include comments', description: `${commentCount} review threads`, disabled: commentCount === 0 },
    { key: 'includeTrackChanges', label: 'Include tracked changes', description: `${trackChangeCount} suggestions`, disabled: trackChangeCount === 0 },
    { key: 'flattenSuggestions', label: 'Flatten suggestions', description: 'Use the proposed final wording', disabled: trackChangeCount === 0 },
    { key: 'exportMetadata', label: 'Export metadata', description: 'Title, creation time, and generator' },
  ]

  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100">
        Content
      </legend>
      <div className="mt-2 divide-y divide-neutral-100 rounded-md border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-700 dark:bg-neutral-900">
        {options.map((option) => (
          <label
            key={option.key}
            className="flex min-h-12 items-center gap-3 px-3 py-2 disabled:opacity-50"
          >
            <input
              type="checkbox"
              checked={option.disabled ? false : value[option.key]}
              disabled={option.disabled}
              onChange={(event) => onChange({ ...value, [option.key]: event.target.checked })}
              className="h-4 w-4 shrink-0 accent-indigo-600"
            />
            <span className="min-w-0">
              <span className="block text-[11px] font-medium text-neutral-800 dark:text-neutral-200">
                {option.label}
              </span>
              <span className="block text-[9px] text-neutral-500 dark:text-neutral-400">
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
