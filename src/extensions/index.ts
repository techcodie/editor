import { StarterKit } from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextAlign } from '@tiptap/extension-text-align'
import { Highlight } from '@tiptap/extension-highlight'
import { TaskList, TaskItem } from '@tiptap/extension-list'
import type { Extensions } from '@tiptap/core'
import type { DocumentEditorOptions } from '../types/editor'
import { AssetNode } from '../assets/editor/AssetNode'
import { CommentMark } from '../review/editor/CommentMark'
import { TrackChangeMark } from '../review/trackChanges/editor/TrackChangeMark'
import { FormFieldNode } from '../forms/editor/FormFieldNode'

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
    StarterKit,
    Placeholder.configure({ placeholder }),
    TextAlign.configure({
      types: [...ALIGNABLE_NODES],
      alignments: [...TEXT_ALIGNMENTS],
      defaultAlignment: 'left',
    }),
    Highlight,
    TaskList,
    TaskItem.configure({ nested: true }),
    AssetNode,
    FormFieldNode,
    CommentMark,
    TrackChangeMark,
  ]
}
