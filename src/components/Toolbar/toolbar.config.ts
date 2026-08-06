import type { LucideIcon } from 'lucide-react'
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Highlighter,
  List,
  ListOrdered,
  ListTodo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  TextQuote,
  SquareCode,
  Minus,
  RemoveFormatting,
} from 'lucide-react'
import type { EditorApi } from '../../lib/editor-api'

export type ToolbarGroupId = 'clipboard' | 'formatting' | 'paragraph' | 'lists'

export interface ToolbarItemConfig {
  id: string
  icon: LucideIcon
  label: string
  group: ToolbarGroupId
  /** Keyboard hint for future tooltips. StarterKit owns the real bindings; not wired here. */
  shortcut?: string
  execute: (api: EditorApi) => void
  /** Toggle items only. Omitted for pure actions (undo/redo/hr/clear). */
  isActive?: (api: EditorApi) => boolean
  /** Defaults to always-enabled when omitted. */
  canExecute?: (api: EditorApi) => boolean
}

export interface ToolbarSection {
  id: ToolbarGroupId
  label: string
  items: ToolbarItemConfig[]
}

const GROUPS: { id: ToolbarGroupId; label: string }[] = [
  { id: 'clipboard', label: 'Clipboard' },
  { id: 'formatting', label: 'Formatting' },
  { id: 'paragraph', label: 'Paragraph' },
  { id: 'lists', label: 'Lists' },
]

const TOOLBAR_ITEMS: ToolbarItemConfig[] = [
  {
    id: 'undo',
    icon: Undo2,
    label: 'Undo',
    group: 'clipboard',
    shortcut: 'Mod+Z',
    execute: (api) => api.undo(),
    canExecute: (api) => api.canUndo(),
  },
  {
    id: 'redo',
    icon: Redo2,
    label: 'Redo',
    group: 'clipboard',
    shortcut: 'Shift+Mod+Z',
    execute: (api) => api.redo(),
    canExecute: (api) => api.canRedo(),
  },
  {
    id: 'clearFormatting',
    icon: RemoveFormatting,
    label: 'Clear formatting',
    group: 'clipboard',
    execute: (api) => api.clearFormatting(),
  },

  {
    id: 'bold',
    icon: Bold,
    label: 'Bold',
    group: 'formatting',
    shortcut: 'Mod+B',
    execute: (api) => api.toggleBold(),
    isActive: (api) => api.isBold(),
  },
  {
    id: 'italic',
    icon: Italic,
    label: 'Italic',
    group: 'formatting',
    shortcut: 'Mod+I',
    execute: (api) => api.toggleItalic(),
    isActive: (api) => api.isItalic(),
  },
  {
    id: 'underline',
    icon: Underline,
    label: 'Underline',
    group: 'formatting',
    shortcut: 'Mod+U',
    execute: (api) => api.toggleUnderline(),
    isActive: (api) => api.isUnderline(),
  },
  {
    id: 'strike',
    icon: Strikethrough,
    label: 'Strikethrough',
    group: 'formatting',
    shortcut: 'Mod+Shift+S',
    execute: (api) => api.toggleStrike(),
    isActive: (api) => api.isStrike(),
  },
  {
    id: 'inlineCode',
    icon: Code,
    label: 'Inline code',
    group: 'formatting',
    shortcut: 'Mod+E',
    execute: (api) => api.toggleInlineCode(),
    isActive: (api) => api.isInlineCode(),
  },
  {
    id: 'highlight',
    icon: Highlighter,
    label: 'Highlight',
    group: 'formatting',
    shortcut: 'Mod+Shift+H',
    execute: (api) => api.toggleHighlight(),
    isActive: (api) => api.isHighlight(),
  },

  {
    id: 'alignLeft',
    icon: AlignLeft,
    label: 'Align left',
    group: 'paragraph',
    shortcut: 'Mod+Shift+L',
    execute: (api) => api.setTextAlign('left'),
    isActive: (api) => api.isTextAlign('left'),
  },
  {
    id: 'alignCenter',
    icon: AlignCenter,
    label: 'Align center',
    group: 'paragraph',
    shortcut: 'Mod+Shift+E',
    execute: (api) => api.setTextAlign('center'),
    isActive: (api) => api.isTextAlign('center'),
  },
  {
    id: 'alignRight',
    icon: AlignRight,
    label: 'Align right',
    group: 'paragraph',
    shortcut: 'Mod+Shift+R',
    execute: (api) => api.setTextAlign('right'),
    isActive: (api) => api.isTextAlign('right'),
  },
  {
    id: 'alignJustify',
    icon: AlignJustify,
    label: 'Justify',
    group: 'paragraph',
    shortcut: 'Mod+Shift+J',
    execute: (api) => api.setTextAlign('justify'),
    isActive: (api) => api.isTextAlign('justify'),
  },

  {
    id: 'bulletList',
    icon: List,
    label: 'Bullet list',
    group: 'lists',
    shortcut: 'Mod+Shift+8',
    execute: (api) => api.toggleBulletList(),
    isActive: (api) => api.isBulletList(),
  },
  {
    id: 'orderedList',
    icon: ListOrdered,
    label: 'Ordered list',
    group: 'lists',
    shortcut: 'Mod+Shift+7',
    execute: (api) => api.toggleOrderedList(),
    isActive: (api) => api.isOrderedList(),
  },
  {
    id: 'taskList',
    icon: ListTodo,
    label: 'Task list',
    group: 'lists',
    shortcut: 'Mod+Shift+9',
    execute: (api) => api.toggleTaskList(),
    isActive: (api) => api.isTaskList(),
  },
  {
    id: 'blockquote',
    icon: TextQuote,
    label: 'Quote',
    group: 'lists',
    shortcut: 'Mod+Shift+B',
    execute: (api) => api.toggleBlockquote(),
    isActive: (api) => api.isBlockquote(),
  },
  {
    id: 'codeBlock',
    icon: SquareCode,
    label: 'Code block',
    group: 'lists',
    shortcut: 'Mod+Alt+C',
    execute: (api) => api.toggleCodeBlock(),
    isActive: (api) => api.isCodeBlock(),
  },
  {
    id: 'horizontalRule',
    icon: Minus,
    label: 'Horizontal rule',
    group: 'lists',
    execute: (api) => api.insertHorizontalRule(),
  },
]

/** Items grouped into ordered, labelled sections for rendering. */
export const TOOLBAR_SECTIONS: ToolbarSection[] = GROUPS.map((group) => ({
  ...group,
  items: TOOLBAR_ITEMS.filter((item) => item.group === group.id),
}))
