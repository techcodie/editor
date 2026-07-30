import type { EditorApi } from '../../lib/editor-api'
import type { VoiceCommandId, VoiceCommandMatch } from '../types/productivity'

export const VOICE_COMMANDS: ReadonlyArray<VoiceCommandMatch & { phrases: readonly string[] }> = [
  { id: 'bold', label: 'Bold', phrases: ['bold', 'make that bold'] },
  { id: 'italic', label: 'Italic', phrases: ['italic', 'make that italic'] },
  { id: 'undo', label: 'Undo', phrases: ['undo', 'undo that'] },
  { id: 'redo', label: 'Redo', phrases: ['redo', 'redo that'] },
  { id: 'heading-1', label: 'Heading 1', phrases: ['heading one', 'heading 1'] },
  { id: 'heading-2', label: 'Heading 2', phrases: ['heading two', 'heading 2'] },
  { id: 'heading-3', label: 'Heading 3', phrases: ['heading three', 'heading 3'] },
  { id: 'bullet-list', label: 'Bullet list', phrases: ['bullet list', 'start bullet list'] },
  { id: 'numbered-list', label: 'Numbered list', phrases: ['numbered list', 'start numbered list'] },
  { id: 'insert-table', label: 'Insert table', phrases: ['insert table', 'add table'] },
  { id: 'new-paragraph', label: 'New paragraph', phrases: ['new paragraph', 'next paragraph'] },
]

export function matchVoiceCommand(transcript: string): VoiceCommandMatch | null {
  const normalized = transcript.trim().toLocaleLowerCase().replace(/[.!?]+$/g, '')
  const command = VOICE_COMMANDS.find((item) => item.phrases.includes(normalized))
  return command ? { id: command.id, label: command.label } : null
}

export function executeVoiceCommand(api: EditorApi, command: VoiceCommandId): boolean {
  switch (command) {
    case 'bold': api.toggleBold(); return true
    case 'italic': api.toggleItalic(); return true
    case 'undo': api.undo(); return true
    case 'redo': api.redo(); return true
    case 'heading-1': api.toggleHeading(1); return true
    case 'heading-2': api.toggleHeading(2); return true
    case 'heading-3': api.toggleHeading(3); return true
    case 'bullet-list': api.toggleBulletList(); return true
    case 'numbered-list': api.toggleOrderedList(); return true
    case 'insert-table': return api.insertTable(3, 3)
    case 'new-paragraph': return api.insertParagraph()
  }
}
