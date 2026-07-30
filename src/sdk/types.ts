import type { ComponentType, CSSProperties, SVGProps } from 'react'
import type { SelectionAiAction } from '../../shared/ai'
import type {
  CollaborationConfig,
  CollaborationConnectionStatus,
  CollaborationSyncStatus,
  ResolvedCollaborationConfig,
} from '../collaboration/types/collaboration'
import type { Collaborator } from '../collaboration/types/presence'
import type { SearchMode } from '../search/types/search'
import type { AiDetectionProvider } from '../redaction/types/detection'
import type { ContractPlaybook } from '../contract/types/contract'
import type { FormSubmission } from '../viewer/types/viewer'
import type { ProductivityProviderConfig } from '../productivity/types/provider'
import type {
  EditorApi,
  EditorInsertionTarget,
  EditorTextSelection,
} from '../lib/editor-api'

export type DocumentEditorContent = string | Record<string, unknown>
export type DocumentEditorIcon = ComponentType<SVGProps<SVGSVGElement>>
export type AiWorkflow = 'ask-document' | 'selection' | 'compliance' | 'contract' | 'writing'
export type DocumentEditorProductivityConfig = ProductivityProviderConfig

export interface DocumentEditorAiConfig {
  /** Endpoint used by Ask Document. */
  askDocumentEndpoint?: string
  /** Endpoint used by Selection AI. */
  selectionEndpoint?: string
  /** Endpoint used to enrich local compliance findings. */
  complianceEndpoint?: string
  /** Endpoint used to refine deterministic contract summaries. */
  contractEndpoint?: string
  /** Endpoint used for explicit writing rewrite previews. */
  writingEndpoint?: string
  /** Optional host-provided detector used after local redaction rules. */
  redactionDetector?: AiDetectionProvider
}

export interface ResolvedDocumentEditorAiConfig {
  askDocumentEndpoint: string
  selectionEndpoint: string
  complianceEndpoint: string
  contractEndpoint: string
  writingEndpoint: string
  redactionDetector?: AiDetectionProvider
}

export interface DocumentEditorIconSlots {
  askDocument: DocumentEditorIcon
  commandPalette: DocumentEditorIcon
}

export interface DocumentEditorTheme {
  colors: {
    background: string
    surface: string
    text: string
    mutedText: string
    border: string
    accent: string
    selection: string
  }
  typography: {
    fontFamily: string
    editorFontSize: string
  }
  spacing: {
    workspace: string
    panelGap: string
  }
  radius: {
    small: string
    medium: string
    large: string
  }
  icons: Partial<DocumentEditorIconSlots>
  animationDuration: string
  shadows: {
    surface: string
    overlay: string
  }
}

export type DocumentEditorThemeOverrides = {
  [Key in keyof DocumentEditorTheme]?: DocumentEditorTheme[Key] extends Record<string, unknown>
    ? Partial<DocumentEditorTheme[Key]>
    : DocumentEditorTheme[Key]
}

export interface KnowledgeSourceEventData {
  id: string
  name: string
  type: 'document' | 'pdf' | 'docx' | 'txt' | 'markdown' | 'image'
  status: 'current' | 'uploaded'
  parseStatus: 'idle' | 'parsing' | 'ready' | 'error'
  size: number
  isActive: boolean
  pageCount?: number
  errorMessage?: string
}

export interface DocumentEditorEventMap {
  ready: { api: EditorApi }
  editorChange: { text: string }
  selectionChange: { selection: EditorTextSelection | null }
  aiRequest: {
    workflow: AiWorkflow
    requestId: string
    prompt?: string
    action?: SelectionAiAction
  }
  aiResponse: {
    workflow: AiWorkflow
    responseId: string
    content: string
    responseTime: number
  }
  insert: {
    responseId: string
    sourceIds: string[]
    target: EditorInsertionTarget
  }
  knowledgeSourceAdded: { source: KnowledgeSourceEventData }
  knowledgeSourceRemoved: { source: KnowledgeSourceEventData }
  knowledgeSourceActivated: {
    source: KnowledgeSourceEventData
    isActive: boolean
  }
  previewOpen: { source: KnowledgeSourceEventData }
  previewClose: { source: KnowledgeSourceEventData }
  collaborationStatus: {
    roomId: string
    connectionStatus: CollaborationConnectionStatus
    syncStatus: CollaborationSyncStatus
  }
  collaboratorsChange: { collaborators: Collaborator[] }
  searchIndexChange: {
    documentCount: number
    nodeCount: number
    relationshipCount: number
  }
  search: {
    query: string
    mode: SearchMode
    total: number
    durationMs: number
  }
  formSubmit: FormSubmission
  error: {
    scope: 'configuration' | 'plugin' | 'editor' | 'ai' | 'knowledge' | 'preview' | 'compliance' | 'collaboration' | 'search' | 'productivity'
    message: string
    cause?: unknown
  }
}

export type DocumentEditorEventName = keyof DocumentEditorEventMap
export type DocumentEditorEventHandler<Event extends DocumentEditorEventName> = (
  payload: DocumentEditorEventMap[Event],
) => void

export interface DocumentEditorEvents {
  on<Event extends DocumentEditorEventName>(
    event: Event,
    handler: DocumentEditorEventHandler<Event>,
  ): () => void
  off<Event extends DocumentEditorEventName>(
    event: Event,
    handler: DocumentEditorEventHandler<Event>,
  ): void
}

export interface DocumentEditorCallbacks {
  onReady?: DocumentEditorEventHandler<'ready'>
  onEditorChange?: DocumentEditorEventHandler<'editorChange'>
  onSelectionChange?: DocumentEditorEventHandler<'selectionChange'>
  onAIRequest?: DocumentEditorEventHandler<'aiRequest'>
  onAIResponse?: DocumentEditorEventHandler<'aiResponse'>
  onInsert?: DocumentEditorEventHandler<'insert'>
  onKnowledgeSourceAdded?: DocumentEditorEventHandler<'knowledgeSourceAdded'>
  onKnowledgeSourceRemoved?: DocumentEditorEventHandler<'knowledgeSourceRemoved'>
  onKnowledgeSourceActivated?: DocumentEditorEventHandler<'knowledgeSourceActivated'>
  onPreviewOpen?: DocumentEditorEventHandler<'previewOpen'>
  onPreviewClose?: DocumentEditorEventHandler<'previewClose'>
  onCollaborationStatus?: DocumentEditorEventHandler<'collaborationStatus'>
  onCollaboratorsChange?: DocumentEditorEventHandler<'collaboratorsChange'>
  onSearchIndexChange?: DocumentEditorEventHandler<'searchIndexChange'>
  onSearch?: DocumentEditorEventHandler<'search'>
  onFormSubmit?: DocumentEditorEventHandler<'formSubmit'>
  onError?: DocumentEditorEventHandler<'error'>
}

export interface DocumentEditorPluginContext {
  readonly config: ResolvedDocumentEditorConfig
  readonly events: DocumentEditorEvents
  getEditorApi(): EditorApi | null
  warn(message: string): void
}

export interface DocumentEditorPlugin {
  /** Stable plugin identifier used in diagnostics. */
  name: string
  version?: string
  setup(context: DocumentEditorPluginContext): void | (() => void)
}

export interface DocumentEditorConfig {
  initialContent?: DocumentEditorContent
  placeholder?: string
  theme?: DocumentEditorThemeOverrides
  readonly?: boolean
  toolbar?: boolean
  voice?: boolean
  ai?: boolean | DocumentEditorAiConfig
  knowledgeSources?: boolean
  preview?: boolean
  streaming?: boolean
  animations?: boolean
  keyboardShortcuts?: boolean
  commandPalette?: boolean
  collaboration?: boolean | CollaborationConfig
  /** Local-first productivity tools with optional host-provided providers. */
  productivity?: boolean | DocumentEditorProductivityConfig
  /** Optional host-owned clause requirements and language rules. */
  contractPlaybook?: ContractPlaybook
  callbacks?: DocumentEditorCallbacks
  plugins?: DocumentEditorPlugin[]
}

export interface ResolvedDocumentEditorConfig {
  initialContent: DocumentEditorContent
  placeholder: string
  theme: DocumentEditorTheme
  readonly: boolean
  toolbar: boolean
  voice: boolean
  ai: false | ResolvedDocumentEditorAiConfig
  knowledgeSources: boolean
  preview: boolean
  streaming: boolean
  animations: boolean
  keyboardShortcuts: boolean
  commandPalette: boolean
  collaboration: false | ResolvedCollaborationConfig
  productivity: false | DocumentEditorProductivityConfig
  contractPlaybook: ContractPlaybook | null
  callbacks: DocumentEditorCallbacks
  plugins: readonly DocumentEditorPlugin[]
}

export interface DocumentEditorController {
  readonly config: ResolvedDocumentEditorConfig
  readonly events: DocumentEditorEvents
  getEditorApi(): EditorApi | null
}

export interface DocumentEditorHandle extends DocumentEditorController {
  focus(): void
}

export interface DocumentEditorProps {
  /** Validated once when this component instance is initialized. */
  config?: DocumentEditorConfig
  /** Optional controller created with `createEditor`. */
  controller?: DocumentEditorController
  className?: string
  style?: CSSProperties
}
