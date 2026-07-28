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
  EditorAssetInsertion,
  EditorCommentInteraction,
  EditorCommentInteractionType,
  EditorDocumentMark,
  EditorDocumentNode,
  EditorInsertionProvenance,
  EditorInsertionTarget,
  EditorSelectionBounds,
  EditorStructuredInsertion,
  EditorTextSelection,
  EditorTrackChangeDecision,
  EditorTrackChangeDraft,
  EditorTrackChangeInteraction,
  EditorTrackChangeType,
  HeadingLevel,
  TextAlignment,
} from './lib/editor-api'
export type {
  FormField,
  FormFieldDocumentEntry,
  FormFieldOption,
  FormFieldPatch,
  FormFieldPosition,
  FormFieldType,
  FormFieldValidation,
  FormFieldValue,
  FormFieldVisibility,
} from './forms/types/field'
export type {
  CustomFormValidator,
  FormDefinition,
  FormPreviewState,
  FormValidationError,
} from './forms/types/form'
export type {
  CreateVersionInput,
  SnapshotCompression,
  SnapshotEncoding,
  Version,
  VersionAuthor,
  VersionMetadata,
  VersionSnapshot,
  VersionSnapshotContent,
  VersionSource,
} from './history/types/version'
export type {
  HistoryFilter,
  HistorySort,
  HistoryStorageAdapter,
  HistoryStoragePayload,
  HistoryState,
  VersionGroup,
} from './history/types/history'
export {
  SELECTION_AI_ACTIONS,
  isSelectionAiAction,
} from '../shared/ai'
export type { SelectionAiAction } from '../shared/ai'
