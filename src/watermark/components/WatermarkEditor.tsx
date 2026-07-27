import { useState, type ChangeEvent } from 'react'
import { ImageUp, Lock, Unlock } from 'lucide-react'
import { cn } from '../../lib/cn'
import { TEXT_WATERMARK_PRESETS } from '../services/watermarkEngine'
import type {
  Watermark,
  WatermarkFont,
  WatermarkImageFit,
  WatermarkType,
} from '../types/watermark'
import { PageAssignment } from './PageAssignment'
import { WatermarkPositionEditor } from './WatermarkPositionEditor'

interface WatermarkEditorProps {
  watermark: Watermark
  pageCount: number
  currentPage: number
  onChange: (watermark: Watermark) => void
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export function WatermarkEditor({
  watermark,
  pageCount,
  currentPage,
  onChange,
}: WatermarkEditorProps) {
  const [imageError, setImageError] = useState('')

  const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const allowedTypes = watermark.type === 'svg'
      ? ['image/svg+xml']
      : ['image/png', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      setImageError(watermark.type === 'svg' ? 'Choose an SVG file' : 'Choose a PNG or SVG file')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Image must be smaller than 5 MB')
      return
    }
    const reader = new FileReader()
    reader.onerror = () => setImageError('Could not read this image')
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setImageError('Could not read this image')
        return
      }
      setImageError('')
      onChange({
        ...watermark,
        image: {
          name: file.name,
          source: reader.result,
          mimeType: file.type as 'image/png' | 'image/svg+xml',
          fit: watermark.image?.fit ?? 'fit',
        },
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-5 p-4">
      <fieldset>
        <legend className="text-[11px] font-semibold text-neutral-900">Watermark</legend>
        <label className="mt-2 block text-[10px] font-medium text-neutral-500">
          Type
          <select
            value={watermark.type}
            onChange={(event) => {
              const type = event.target.value as WatermarkType
              onChange({
                ...watermark,
                type,
                image: type === 'text' || (type === 'svg' && watermark.image?.mimeType !== 'image/svg+xml')
                  ? null
                  : watermark.image,
              })
            }}
            className="mt-1 h-9 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-xs text-neutral-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
          >
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="logo">Company logo</option>
            <option value="svg">SVG</option>
          </select>
        </label>
        {watermark.type === 'text' ? (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-1.5" aria-label="Text watermark presets">
              {TEXT_WATERMARK_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChange({ ...watermark, text: preset })}
                  aria-pressed={watermark.text === preset}
                  className={cn(
                    'rounded-md border px-2 py-1 text-[9px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35',
                    watermark.text === preset
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                      : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-neutral-900',
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
            <label className="block text-[10px] font-medium text-neutral-500">
              Custom text
              <input
                value={watermark.text}
                maxLength={60}
                onChange={(event) => onChange({ ...watermark, text: event.target.value })}
                className="mt-1 h-9 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-xs outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
              />
            </label>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <label className="text-[10px] font-medium text-neutral-500">
                Font
                <select
                  value={watermark.font}
                  onChange={(event) => onChange({
                    ...watermark,
                    font: event.target.value as WatermarkFont,
                  })}
                  className="mt-1 h-9 w-full rounded-md border border-neutral-200 bg-white px-2 text-xs outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
                >
                  <option value="sans">Sans serif</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Monospace</option>
                </select>
              </label>
              <label className="text-[10px] font-medium text-neutral-500">
                Color
                <input
                  type="color"
                  value={watermark.color}
                  onChange={(event) => onChange({ ...watermark, color: event.target.value })}
                  className="mt-1 block h-9 w-12 cursor-pointer rounded-md border border-neutral-200 bg-white p-1"
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <label className="relative flex h-20 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border border-dashed border-neutral-300 bg-neutral-50 text-center transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 focus-within:ring-2 focus-within:ring-indigo-500/25">
              <ImageUp size={18} className="text-neutral-400" aria-hidden />
              <span className="mt-1 text-[10px] font-semibold text-neutral-600">
                {watermark.image ? 'Replace image' : `Upload ${watermark.type === 'logo' ? 'logo' : watermark.type.toUpperCase()}`}
              </span>
              <span className="text-[9px] text-neutral-400">
                {watermark.type === 'svg' ? 'SVG' : 'PNG or SVG'}, up to 5 MB
              </span>
              <input
                type="file"
                accept={watermark.type === 'svg' ? 'image/svg+xml' : 'image/png,image/svg+xml'}
                onChange={handleImage}
                aria-label={watermark.image ? 'Replace watermark image' : 'Upload watermark image'}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
            {watermark.image && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="truncate text-[10px] text-neutral-500">{watermark.image.name}</span>
                <div className="flex rounded-md bg-neutral-100 p-0.5" aria-label="Image sizing">
                  {(['fit', 'fill'] as WatermarkImageFit[]).map((fit) => (
                    <button
                      key={fit}
                      type="button"
                      onClick={() => onChange({
                        ...watermark,
                        image: watermark.image ? { ...watermark.image, fit } : null,
                      })}
                      aria-pressed={watermark.image?.fit === fit}
                      className={cn(
                        'h-7 rounded px-2 text-[10px] font-medium capitalize text-neutral-500',
                        watermark.image?.fit === fit && 'bg-white text-neutral-950 shadow-sm',
                      )}
                    >
                      {fit}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-2 min-h-4 text-[10px] text-red-600" role="status">{imageError}</p>
          </div>
        )}
      </fieldset>

      <label className="block text-[11px] font-semibold text-neutral-900">
        Opacity <span className="font-medium text-neutral-500">{watermark.opacity}%</span>
        <input
          type="range"
          min="0"
          max="100"
          value={watermark.opacity}
          onChange={(event) => onChange({ ...watermark, opacity: Number(event.target.value) })}
          className="mt-2 w-full accent-indigo-600"
        />
      </label>

      <WatermarkPositionEditor
        watermark={watermark}
        disabled={watermark.locked}
        onChange={onChange}
      />
      <PageAssignment
        watermark={watermark}
        pageCount={pageCount}
        currentPage={currentPage}
        onChange={onChange}
      />

      <label className="flex cursor-pointer items-center justify-between rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5">
        <span className="flex items-center gap-2 text-[11px] font-semibold text-neutral-800">
          {watermark.locked ? <Lock size={14} aria-hidden /> : <Unlock size={14} aria-hidden />}
          Lock placement
        </span>
        <input
          type="checkbox"
          checked={watermark.locked}
          onChange={(event) => onChange({ ...watermark, locked: event.target.checked })}
          className="h-4 w-4 accent-indigo-600"
        />
      </label>
    </div>
  )
}
