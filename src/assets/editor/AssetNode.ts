import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { AssetNodeView } from './AssetNodeView'

function parseRenderData(value: string | null): Record<string, unknown> {
  if (!value) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

export const AssetNode = Node.create({
  name: 'enterpriseAsset',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      instanceId: { default: null },
      assetId: { default: null },
      type: { default: null },
      category: { default: null },
      title: { default: 'Document asset' },
      renderer: { default: null },
      renderData: {
        default: {},
        parseHTML: (element) => parseRenderData(element.getAttribute('data-render-data')),
        renderHTML: (attributes) => ({
          'data-render-data': JSON.stringify(attributes.renderData ?? {}),
        }),
      },
      width: { default: 200 },
      height: { default: 88 },
      rotation: { default: 0 },
      align: { default: 'center' },
      caption: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'figure[data-enterprise-asset]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes(HTMLAttributes, {
        'data-enterprise-asset': '',
        'aria-label': `${String(HTMLAttributes.title || 'Document')} asset`,
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(AssetNodeView)
  },
})
