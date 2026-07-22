import type { LucideIcon } from 'lucide-react'
import {
  Undo2,
  Redo2,
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
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

export type ToolbarGroupId =
  | 'history'
  | 'blockType'
  | 'formatting'
  | 'lists'
  | 'alignment'
  | 'blocks'

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
  { id: 'history', label: 'History' },
  { id: 'blockType', label: 'Text style' },
  { id: 'formatting', label: 'Formatting' },
  { id: 'lists', label: 'Lists' },
  { id: 'alignment', label: 'Alignment' },
  { id: 'blocks', label: 'Blocks' },
]

const TOOLBAR_ITEMS: ToolbarItemConfig[] = [
  {
    id: 'undo',
    icon: Undo2,
    label: 'Undo',
    group: 'history',
    shortcut: 'Mod+Z',
    execute: (api) => api.undo(),
    canExecute: (api) => api.canUndo(),
  },
  {
    id: 'redo',
    icon: Redo2,
    label: 'Redo',
    group: 'history',
    shortcut: 'Shift+Mod+Z',
    execute: (api) => api.redo(),
    canExecute: (api) => api.canRedo(),
  },

  {
    id: 'paragraph',
    icon: Pilcrow,
    label: 'Paragraph',
    group: 'blockType',
    shortcut: 'Mod+Alt+0',
    execute: (api) => api.setParagraph(),
    isActive: (api) => api.isParagraph(),
  },
  {
    id: 'heading1',
    icon: Heading1,
    label: 'Heading 1',
    group: 'blockType',
    shortcut: 'Mod+Alt+1',
    execute: (api) => api.toggleHeading(1),
    isActive: (api) => api.isHeading(1),
  },
  {
    id: 'heading2',
    icon: Heading2,
    label: 'Heading 2',
    group: 'blockType',
    shortcut: 'Mod+Alt+2',
    execute: (api) => api.toggleHeading(2),
    isActive: (api) => api.isHeading(2),
  },
  {
    id: 'heading3',
    icon: Heading3,
    label: 'Heading 3',
    group: 'blockType',
    shortcut: 'Mod+Alt+3',
    execute: (api) => api.toggleHeading(3),
    isActive: (api) => api.isHeading(3),
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
    id: 'alignLeft',
    icon: AlignLeft,
    label: 'Align left',
    group: 'alignment',
    shortcut: 'Mod+Shift+L',
    execute: (api) => api.setTextAlign('left'),
    isActive: (api) => api.isTextAlign('left'),
  },
  {
    id: 'alignCenter',
    icon: AlignCenter,
    label: 'Align center',
    group: 'alignment',
    shortcut: 'Mod+Shift+E',
    execute: (api) => api.setTextAlign('center'),
    isActive: (api) => api.isTextAlign('center'),
  },
  {
    id: 'alignRight',
    icon: AlignRight,
    label: 'Align right',
    group: 'alignment',
    shortcut: 'Mod+Shift+R',
    execute: (api) => api.setTextAlign('right'),
    isActive: (api) => api.isTextAlign('right'),
  },
  {
    id: 'alignJustify',
    icon: AlignJustify,
    label: 'Justify',
    group: 'alignment',
    shortcut: 'Mod+Shift+J',
    execute: (api) => api.setTextAlign('justify'),
    isActive: (api) => api.isTextAlign('justify'),
  },

  {
    id: 'blockquote',
    icon: TextQuote,
    label: 'Quote',
    group: 'blocks',
    shortcut: 'Mod+Shift+B',
    execute: (api) => api.toggleBlockquote(),
    isActive: (api) => api.isBlockquote(),
  },
  {
    id: 'codeBlock',
    icon: SquareCode,
    label: 'Code block',
    group: 'blocks',
    shortcut: 'Mod+Alt+C',
    execute: (api) => api.toggleCodeBlock(),
    isActive: (api) => api.isCodeBlock(),
  },
  {
    id: 'horizontalRule',
    icon: Minus,
    label: 'Horizontal rule',
    group: 'blocks',
    execute: (api) => api.insertHorizontalRule(),
  },
  {
    id: 'clearFormatting',
    icon: RemoveFormatting,
    label: 'Clear formatting',
    group: 'blocks',
    execute: (api) => api.clearFormatting(),
  },
]

/** Items grouped into ordered, labelled sections for rendering. */
export const TOOLBAR_SECTIONS: ToolbarSection[] = GROUPS.map((group) => ({
  ...group,
  items: TOOLBAR_ITEMS.filter((item) => item.group === group.id),
}))
