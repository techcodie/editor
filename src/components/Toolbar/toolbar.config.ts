import type { LucideIcon } from 'lucide-react'
import {
  Undo2,
  Redo2,
  Scissors,
  Copy,
  ClipboardPaste,
  Replace,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Superscript,
  Subscript,
  RemoveFormatting,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListTodo,
  TextQuote,
  IndentIncrease,
  IndentDecrease,
  MoveVertical,
} from 'lucide-react'
import type { EditorApi } from '../../lib/editor-api'

export type ToolbarGroupId = 'edit' | 'format' | 'paragraph'

export interface ToolbarItemConfig {
  id: string
  icon: LucideIcon
  label: string
  group: ToolbarGroupId
  /** Keyboard hint for future tooltips. StarterKit owns the real bindings; not wired here. */
  shortcut?: string
  /** Tooltip text override — used for permanently-disabled items to explain why, since the
   * label alone ("Paste") wouldn't. Falls back to `label` when omitted. */
  tooltip?: string
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
  { id: 'edit', label: 'Edit' },
  { id: 'format', label: 'Format' },
  { id: 'paragraph', label: 'Paragraph' },
]

const TOOLBAR_ITEMS: ToolbarItemConfig[] = [
  {
    id: 'undo',
    icon: Undo2,
    label: 'Undo',
    group: 'edit',
    shortcut: 'Mod+Z',
    execute: (api) => api.undo(),
    canExecute: (api) => api.canUndo(),
  },
  {
    id: 'redo',
    icon: Redo2,
    label: 'Redo',
    group: 'edit',
    shortcut: 'Shift+Mod+Z',
    execute: (api) => api.redo(),
    canExecute: (api) => api.canRedo(),
  },
  {
    id: 'cut',
    icon: Scissors,
    label: 'Cut',
    group: 'edit',
    shortcut: 'Mod+X',
    // Same document.execCommand approach as the right-click menu — EditorApi's
    // replaceTextSelection() rejects empty replacements, so it can't delete a
    // selection; the browser's native cut command is the one that actually works.
    execute: () => {
      document.execCommand('cut')
    },
    canExecute: (api) => Boolean(api.getTextSelection()),
  },
  {
    id: 'copy',
    icon: Copy,
    label: 'Copy',
    group: 'edit',
    shortcut: 'Mod+C',
    execute: () => {
      document.execCommand('copy')
    },
    canExecute: (api) => Boolean(api.getTextSelection()),
  },
  {
    id: 'paste',
    icon: ClipboardPaste,
    label: 'Paste',
    tooltip: 'Paste — browsers block programmatic paste. Use Cmd/Ctrl+V.',
    group: 'edit',
    execute: () => {},
    canExecute: () => false,
  },
  {
    id: 'findReplace',
    icon: Replace,
    label: 'Find & replace',
    tooltip: 'Find & replace — not available in this release.',
    group: 'edit',
    execute: () => {},
    canExecute: () => false,
  },

  {
    id: 'bold',
    icon: Bold,
    label: 'Bold',
    group: 'format',
    shortcut: 'Mod+B',
    execute: (api) => api.toggleBold(),
    isActive: (api) => api.isBold(),
  },
  {
    id: 'italic',
    icon: Italic,
    label: 'Italic',
    group: 'format',
    shortcut: 'Mod+I',
    execute: (api) => api.toggleItalic(),
    isActive: (api) => api.isItalic(),
  },
  {
    id: 'underline',
    icon: Underline,
    label: 'Underline',
    group: 'format',
    shortcut: 'Mod+U',
    execute: (api) => api.toggleUnderline(),
    isActive: (api) => api.isUnderline(),
  },
  {
    id: 'strike',
    icon: Strikethrough,
    label: 'Strikethrough',
    group: 'format',
    shortcut: 'Mod+Shift+S',
    execute: (api) => api.toggleStrike(),
    isActive: (api) => api.isStrike(),
  },
  {
    id: 'superscript',
    icon: Superscript,
    label: 'Superscript',
    group: 'format',
    shortcut: 'Mod+.',
    execute: (api) => api.toggleSuperscript(),
    isActive: (api) => api.isSuperscript(),
  },
  {
    id: 'subscript',
    icon: Subscript,
    label: 'Subscript',
    group: 'format',
    shortcut: 'Mod+,',
    execute: (api) => api.toggleSubscript(),
    isActive: (api) => api.isSubscript(),
  },
  {
    id: 'clearFormatting',
    icon: RemoveFormatting,
    label: 'Clear formatting',
    group: 'format',
    execute: (api) => api.clearFormatting(),
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
    group: 'paragraph',
    shortcut: 'Mod+Shift+8',
    execute: (api) => api.toggleBulletList(),
    isActive: (api) => api.isBulletList(),
  },
  {
    id: 'orderedList',
    icon: ListOrdered,
    label: 'Numbered list',
    group: 'paragraph',
    shortcut: 'Mod+Shift+7',
    execute: (api) => api.toggleOrderedList(),
    isActive: (api) => api.isOrderedList(),
  },
  {
    id: 'taskList',
    icon: ListTodo,
    label: 'Checklist',
    group: 'paragraph',
    shortcut: 'Mod+Shift+9',
    execute: (api) => api.toggleTaskList(),
    isActive: (api) => api.isTaskList(),
  },
  {
    id: 'blockquote',
    icon: TextQuote,
    label: 'Quote',
    group: 'paragraph',
    shortcut: 'Mod+Shift+B',
    execute: (api) => api.toggleBlockquote(),
    isActive: (api) => api.isBlockquote(),
  },
  {
    id: 'indent',
    icon: IndentIncrease,
    label: 'Indent',
    tooltip: 'Indent — not available in this release.',
    group: 'paragraph',
    execute: () => {},
    canExecute: () => false,
  },
  {
    id: 'outdent',
    icon: IndentDecrease,
    label: 'Outdent',
    tooltip: 'Outdent — not available in this release.',
    group: 'paragraph',
    execute: () => {},
    canExecute: () => false,
  },
  {
    id: 'lineHeight',
    icon: MoveVertical,
    label: 'Line height',
    tooltip: 'Line height — not available in this release.',
    group: 'paragraph',
    execute: () => {},
    canExecute: () => false,
  },
]

/** Items grouped into ordered, labelled sections for rendering. */
export const TOOLBAR_SECTIONS: ToolbarSection[] = GROUPS.map((group) => ({
  ...group,
  items: TOOLBAR_ITEMS.filter((item) => item.group === group.id),
}))
