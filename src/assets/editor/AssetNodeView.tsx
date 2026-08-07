import { useCallback, useRef } from 'react'
import { AlignCenter, AlignLeft, AlignRight, ImageUp, RotateCw, Trash2 } from 'lucide-react'
import { NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react'
import { StampRenderer } from '../categories/stamps/StampRenderer'
import { isStampMetadata } from '../services/assetRenderer'

const MIN_WIDTH = 96
const MAX_WIDTH = 560
const MIN_HEIGHT = 48
const MAX_HEIGHT = 320
const MAX_REPLACE_IMAGE_BYTES = 5 * 1024 * 1024

const ALIGN_CLASS: Record<string, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('The image could not be read.'))
    reader.readAsDataURL(file)
  })
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function normalizeRotation(value: number): number {
  const normalized = ((value % 360) + 360) % 360
  return Math.round(normalized > 180 ? normalized - 360 : normalized)
}

export function AssetNodeView({ node, selected, updateAttributes, deleteNode }: ReactNodeViewProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const width = Number(node.attrs.width) || 200
  const height = Number(node.attrs.height) || 88
  const rotation = Number(node.attrs.rotation) || 0
  const align = typeof node.attrs.align === 'string' ? node.attrs.align : 'center'
  const caption = typeof node.attrs.caption === 'string' ? node.attrs.caption : ''
  const title = String(node.attrs.title || 'Document asset')
  const renderer = String(node.attrs.renderer || '')
  const renderData = node.attrs.renderData as Record<string, unknown>
  const imageSource = renderer === 'generated-image' && typeof renderData.src === 'string'
    ? renderData.src
    : null

  const replaceImage = useCallback(async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > MAX_REPLACE_IMAGE_BYTES) return
    const src = await readFileAsDataUrl(file)
    updateAttributes({ renderData: { ...renderData, src, alt: file.name } })
  }, [renderData, updateAttributes])

  const beginResize = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const startX = event.clientX
      const startWidth = width
      const aspectRatio = width / height

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const nextWidth = clamp(startWidth + moveEvent.clientX - startX, MIN_WIDTH, MAX_WIDTH)
        const nextHeight = clamp(nextWidth / aspectRatio, MIN_HEIGHT, MAX_HEIGHT)
        updateAttributes({ width: Math.round(nextWidth), height: Math.round(nextHeight) })
      }
      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp, { once: true })
    },
    [height, updateAttributes, width],
  )

  const beginRotation = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const bounds = previewRef.current?.getBoundingClientRect()
      if (!bounds) return
      const centerX = bounds.left + bounds.width / 2
      const centerY = bounds.top + bounds.height / 2

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX)
        updateAttributes({ rotation: normalizeRotation((angle * 180) / Math.PI + 90) })
      }
      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp, { once: true })
    },
    [updateAttributes],
  )

  return (
    <NodeViewWrapper
      as="figure"
      className={`enterprise-asset-node my-5 flex w-full flex-col ${ALIGN_CLASS[align] ?? ALIGN_CLASS.center}`}
      data-asset-id={String(node.attrs.assetId || '')}
      data-asset-type={String(node.attrs.type || '')}
      contentEditable={false}
      aria-label={`${title} asset`}
    >
      <div
        ref={previewRef}
        data-drag-handle
        draggable="true"
        className={`group relative max-w-full touch-none select-none self-center rounded-md transition-[box-shadow,background-color] duration-150 ${
          selected
            ? 'bg-indigo-50/50 shadow-[0_0_0_2px_rgba(99,102,241,0.7)]'
            : 'hover:bg-neutral-50 hover:shadow-[0_0_0_1px_rgba(163,163,163,0.35)]'
        }`}
        style={{ width, aspectRatio: `${width} / ${height}` }}
      >
        {selected && (
          <div
            role="toolbar"
            aria-label={`${title} options`}
            className="absolute -top-20 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-1 shadow-md"
          >
            {(['left', 'center', 'right'] as const).map((option) => {
              const Icon = option === 'left' ? AlignLeft : option === 'right' ? AlignRight : AlignCenter
              return (
                <button
                  key={option}
                  type="button"
                  aria-label={`Align ${option}`}
                  aria-pressed={align === option}
                  title={`Align ${option}`}
                  onClick={() => updateAttributes({ align: option })}
                  className={`flex h-7 w-7 items-center justify-center rounded ${align === option ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-100'}`}
                >
                  <Icon size={13} strokeWidth={2} aria-hidden />
                </button>
              )
            })}
            {imageSource && (
              <>
                <span className="mx-0.5 h-5 w-px bg-neutral-200" />
                <button
                  type="button"
                  aria-label={`Replace ${title}`}
                  title="Replace image"
                  onClick={() => replaceInputRef.current?.click()}
                  className="flex h-7 w-7 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100"
                >
                  <ImageUp size={13} strokeWidth={2} aria-hidden />
                </button>
              </>
            )}
            <span className="mx-0.5 h-5 w-px bg-neutral-200" />
            <button
              type="button"
              aria-label={`Delete ${title}`}
              title="Delete"
              onClick={() => deleteNode()}
              className="flex h-7 w-7 items-center justify-center rounded text-neutral-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={13} strokeWidth={2} aria-hidden />
            </button>
          </div>
        )}
        {imageSource && (
          <input
            ref={replaceInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              void replaceImage(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        )}
        {renderer === 'stamp' && isStampMetadata(renderData) ? (
          <StampRenderer
            text={renderData.text}
            style={renderData.style}
            icon={renderData.icon}
            color={renderData.color}
            background={renderData.background}
            border={renderData.border}
            width={width}
            height={height}
            rotation={rotation}
            title={title}
            className="block h-full w-full overflow-visible"
          />
        ) : imageSource ? (
          <img
            src={imageSource}
            alt={typeof renderData.alt === 'string' ? renderData.alt : title}
            draggable={false}
            className="block h-full w-full rounded-md object-cover"
          />
        ) : (
          <div className="flex h-full min-h-16 items-center justify-center rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-4 text-sm text-neutral-500">
            {title}
          </div>
        )}

        <button
          type="button"
          aria-label={`Rotate ${title}`}
          title="Rotate asset"
          onPointerDown={beginRotation}
          className={`absolute -top-9 left-1/2 z-10 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-600 shadow-md transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            selected ? 'opacity-100' : 'pointer-events-none opacity-0 group-hover:opacity-100'
          }`}
        >
          <RotateCw size={13} strokeWidth={2} aria-hidden />
        </button>
        <button
          type="button"
          aria-label={`Resize ${title}`}
          title="Resize asset"
          onPointerDown={beginResize}
          className={`absolute -bottom-1.5 -right-1.5 z-10 h-4 w-4 rounded-sm border-2 border-white bg-indigo-600 shadow-sm transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            selected ? 'opacity-100' : 'pointer-events-none opacity-0 group-hover:opacity-100'
          }`}
        />
      </div>
      {(selected || caption) && (
        <input
          type="text"
          defaultValue={caption}
          onBlur={(event) => {
            if (event.target.value !== caption) updateAttributes({ caption: event.target.value })
          }}
          placeholder="Add a caption"
          aria-label={`Caption for ${title}`}
          style={{ width }}
          className="mx-auto mt-1.5 max-w-full border-none bg-transparent text-center text-xs text-neutral-500 outline-none placeholder:text-neutral-300 focus-visible:ring-1 focus-visible:ring-indigo-500/40 rounded"
        />
      )}
    </NodeViewWrapper>
  )
}
