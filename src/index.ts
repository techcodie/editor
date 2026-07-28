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
  ResolvedDocumentEditorAiConfig,
} from './sdk/types'
export {
  createBroadcastChannelTransport,
  createWebSocketTransport,
} from './collaboration/services/transportAdapter'
export type {
  CollaborationConfig,
  CollaborationConflict,
  CollaborationConnectionStatus,
  CollaborationMessage,
  CollaborationOperation,
  CollaborationSharedState,
  CollaborationSyncStatus,
  CollaborationTransport,
  CollaborationTransportHandlers,
  ResolvedCollaborationConfig,
} from './collaboration/types/collaboration'
export type { WebSocketTransportOptions } from './collaboration/services/transportAdapter'
export type {
  AwarenessState,
  Collaborator,
  CollaboratorStatus,
  CollaborationRange,
  CollaborationUser,
} from './collaboration/types/presence'
export { createLocalEmbeddingProvider } from './search/services/embeddingEngine'
export { createSearchEngine } from './search/services/searchEngine'
export type { SemanticSearchEngine } from './search/services/searchEngine'
export type {
  EmbeddingProvider,
  IndexedDocument,
  RecentSearch,
  SavedSearch,
  SearchDocumentKind,
  SearchDocumentMetadata,
  SearchEngineOptions,
  SearchFiltersState,
  SearchIndexInput,
  SearchMode,
  SearchProgress,
  SearchRequest,
  SearchResponse,
  SearchResult,
  SearchScoreBreakdown,
  SearchSection,
} from './search/types/search'
export type {
  KnowledgeEdgeType,
  KnowledgeGraph,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  KnowledgeNodeType,
  RelatedDocument,
} from './search/types/knowledgeGraph'
export { detectSensitiveData, clearDetectionCache } from './redaction/services/detectionEngine'
export { sanitizeTextForExport, excludeRedactedText } from './redaction/services/exportSanitizer'
export { createRedaction, replacementFor, summarizeRedactions } from './redaction/services/redactionEngine'
export { analyzeContract, clearContractAnalysisCache, fingerprintContract } from './contract/services/contractAnalysis'
export { compareContractAnalyses } from './contract/services/comparisonEngine'
export { validatePlaybook } from './contract/services/playbookEngine'
export type {
  AiDetectionProvider,
  CustomDetectionPattern,
  DetectionOptions,
  DetectionProgress,
  DetectionRange,
  DetectionSource,
  SensitiveDataDetection,
  SensitiveDataType,
} from './redaction/types/detection'
export type {
  ClassificationLevel,
  RedactionAuditEntry,
  RedactionComment,
  RedactionDecision,
  RedactionRecord,
  RedactionStyle,
  RedactionSummary,
} from './redaction/types/redaction'
export type {
  ClauseClassificationRule,
  ClauseType,
  ContractClause,
  ContractTextRange,
  StandardClauseType,
} from './contract/types/clause'
export type {
  ClauseChange,
  ContractAnalysis,
  ContractAnalysisComparison,
  ContractAnalysisHistoryEntry,
  ContractAnalysisOptions,
  ContractAnalysisProgress,
  ContractAnalysisStage,
  ContractComplianceFinding,
  ContractDate,
  ContractDateType,
  ContractEntity,
  ContractEntityType,
  ContractObligation,
  ContractParty,
  ContractPlaybook,
  ContractPlaybookRule,
  ContractRisk,
  ContractRiskCategory,
  ContractRiskLevel,
  ContractSummary,
  ObligationPriority,
  ObligationStatus,
  PlaybookDeviation,
  PlaybookDeviationType,
  RenewalTerm,
} from './contract/types/contract'
export type {
  EditorApi,
  EditorAssetInsertion,
  EditorCommentInteraction,
  EditorCommentInteractionType,
  EditorDocumentMark,
  EditorDocumentChange,
  EditorDocumentChangeOrigin,
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
  ReplaceDocumentSnapshotOptions,
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
export type {
  ApprovalDecision,
  ApprovalRequest,
  ApprovalReviewer,
  ReviewerStatus,
  WorkflowAction,
  WorkflowHistoryEntry,
} from './workflow/types/approval'
export type {
  Workflow,
  WorkflowMetadata,
  WorkflowStage,
  WorkflowStageStatus,
  WorkflowStatus,
  WorkflowStoragePayload,
  WorkflowValidation,
  WorkflowValidationIssue,
  WorkflowValidationSeverity,
} from './workflow/types/workflow'
export {
  SELECTION_AI_ACTIONS,
  isSelectionAiAction,
} from '../shared/ai'
export type { SelectionAiAction } from '../shared/ai'
