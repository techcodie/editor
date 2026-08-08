import { StarterKit } from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextAlign } from '@tiptap/extension-text-align'
import { Highlight } from '@tiptap/extension-highlight'
import { TaskList, TaskItem } from '@tiptap/extension-list'
import { TableKit } from '@tiptap/extension-table'
import { TextStyle, Color, FontFamily, FontSize } from '@tiptap/extension-text-style'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import type { Extensions } from '@tiptap/core'
import type { DocumentEditorOptions } from '../types/editor'
import { AssetNode } from '../assets/editor/AssetNode'
import { CommentMark } from '../review/editor/CommentMark'
import { TrackChangeMark } from '../review/trackChanges/editor/TrackChangeMark'
import { FormFieldNode } from '../forms/editor/FormFieldNode'
import { PageBreakNode } from '../layout/editor/PageBreakNode'

/** Node types that support text alignment. */
const ALIGNABLE_NODES = ['heading', 'paragraph'] as const
/** Text alignments exposed by the editor. */
const TEXT_ALIGNMENTS = ['left', 'center', 'right', 'justify'] as const

/**
 * Extension set for the document editor.
 *
 * StarterKit (v3) already bundles history, headings, lists, links and the inline
 * marks — including underline and strike — plus code, code block, blockquote and
 * horizontal rule, so those are intentionally NOT re-registered here.
 */
export function createEditorExtensions({ placeholder }: DocumentEditorOptions): Extensions {
  return [
    StarterKit.configure({
      // StarterKit already registers Link (unconfigured) with `openOnClick:
      // true`, which opens a new browser tab on every click while editing —
      // harmless when there was no in-editor way to edit a link, but it would
      // make the new Edit Link control below unusable (clicking a link to
      // place the cursor inside it would navigate away before the toolbar
      // could react). `enableClickSelection` keeps clicking a link useful by
      // selecting its range instead.
      link: { openOnClick: false, enableClickSelection: true },
    }),
    Placeholder.configure({ placeholder }),
    TextAlign.configure({
      types: [...ALIGNABLE_NODES],
      alignments: [...TEXT_ALIGNMENTS],
      defaultAlignment: 'left',
    }),
    // multicolor lets the highlight mark carry a `color` attribute, so a
    // highlight color picker is possible without a second highlight mark.
    Highlight.configure({ multicolor: true }),
    TextStyle,
    Color,
    FontFamily,
    FontSize,
    Subscript,
    Superscript,
    TaskList,
    TaskItem.configure({ nested: true }),
    TableKit.configure({ table: { resizable: true } }),
    AssetNode,
    FormFieldNode,
    PageBreakNode,
    CommentMark,
    TrackChangeMark,
  ]
}
