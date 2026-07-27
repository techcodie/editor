import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { StampRenderer } from '../../assets/categories/stamps/StampRenderer'
import { isStampMetadata } from '../../assets/services/assetRenderer'
import type { EditorDocumentNode } from '../../lib/editor-api'
import type { RenderedAsset } from '../types/export'

function numberAttribute(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function serializeAsset(node: EditorDocumentNode): RenderedAsset | null {
  const attrs = node.attrs ?? {}
  const renderData = attrs.renderData
  if (
    attrs.renderer !== 'stamp' ||
    !renderData ||
    typeof renderData !== 'object' ||
    Array.isArray(renderData) ||
    !isStampMetadata(renderData as Record<string, unknown>)
  ) {
    return null
  }

  const metadata = renderData as Record<string, unknown>
  const width = numberAttribute(attrs.width, numberAttribute(metadata.width, 200))
  const height = numberAttribute(attrs.height, numberAttribute(metadata.height, 88))
  const rotation = numberAttribute(attrs.rotation, numberAttribute(metadata.rotation, 0))
  const title = typeof attrs.title === 'string' ? attrs.title : 'Document asset'
  const svg = renderToStaticMarkup(createElement(StampRenderer, {
    text: String(metadata.text),
    style: metadata.style as Parameters<typeof StampRenderer>[0]['style'],
    icon: metadata.icon as Parameters<typeof StampRenderer>[0]['icon'],
    color: String(metadata.color),
    background: String(metadata.background),
    border: String(metadata.border),
    width,
    height,
    rotation,
    title,
  }))

  return { title, width, height, rotation, svg, renderData: metadata }
}

export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export async function rasterizeSvg(
  svg: string,
  width: number,
  height: number,
): Promise<Uint8Array> {
  const image = new Image()
  image.decoding = 'async'
  image.src = svgDataUrl(svg)
  await image.decode()

  const scale = Math.min(3, Math.max(1, window.devicePixelRatio || 1))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Image rendering is unavailable in this browser')
  context.scale(scale, scale)
  context.drawImage(image, 0, 0, width, height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not prepare the document image')
  return new Uint8Array(await blob.arrayBuffer())
}

export async function rasterizeImageSource(
  source: string,
  width: number,
  height: number,
): Promise<Uint8Array> {
  const image = new Image()
  image.decoding = 'async'
  image.src = source
  await image.decode()
  const canvas = document.createElement('canvas')
  const scale = Math.min(3, Math.max(1, window.devicePixelRatio || 1))
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Image rendering is unavailable in this browser')
  context.scale(scale, scale)
  context.drawImage(image, 0, 0, width, height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not prepare the embedded image')
  return new Uint8Array(await blob.arrayBuffer())
}

export async function dataUrlBytes(source: string): Promise<Uint8Array> {
  const response = await fetch(source)
  if (!response.ok) throw new Error('Could not read the embedded document image')
  return new Uint8Array(await response.arrayBuffer())
}
