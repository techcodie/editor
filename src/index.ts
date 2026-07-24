export { DocumentEditor } from './sdk/DocumentEditor'
export { createEditor } from './sdk/controller'
export {
  getDefaultDocumentEditorTheme,
  resolveDocumentEditorConfig,
  validateDocumentEditorConfig,
} from './sdk/config'
export type {
  AiWorkflow,
  DocumentEditorAiConfig,
  DocumentEditorCallbacks,
  DocumentEditorConfig,
  DocumentEditorContent,
  DocumentEditorController,
  DocumentEditorEventHandler,
  DocumentEditorEventMap,
  DocumentEditorEventName,
  DocumentEditorEvents,
  DocumentEditorHandle,
  DocumentEditorIcon,
  DocumentEditorIconSlots,
  DocumentEditorPlugin,
  DocumentEditorPluginContext,
  DocumentEditorProps,
  DocumentEditorTheme,
  DocumentEditorThemeOverrides,
  KnowledgeSourceEventData,
  ResolvedDocumentEditorConfig,
} from './sdk/types'
export type {
  EditorApi,
  EditorInsertionProvenance,
  EditorInsertionTarget,
  EditorSelectionBounds,
  EditorStructuredInsertion,
  EditorTextSelection,
  HeadingLevel,
  TextAlignment,
} from './lib/editor-api'
export {
  SELECTION_AI_ACTIONS,
  isSelectionAiAction,
} from '../shared/ai'
export type { SelectionAiAction } from '../shared/ai'
