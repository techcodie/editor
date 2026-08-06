import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Command,
  FilePenLine,
  Image as ImageIcon,
  ListChecks,
  LoaderCircle,
  MessageSquareText,
  Minus,
  MousePointer2,
  Plus,
  ShieldCheck,
  Stamp,
  Table2,
  X,
} from 'lucide-react'
import { useAssetInsertion } from '../../assets/hooks/useAssetInsertion'
import type { Asset } from '../../assets/types/asset'
import { ComplianceToolbarControl } from '../../compliance/components/ComplianceToolbarControl'
import type {
  ComplianceFinding,
  ComplianceReport,
  ComplianceRecommendation,
} from '../../compliance/types/compliance'
import { ContractToolbarControl } from '../../contract/components/ContractToolbarControl'
import type { ContractAnalysis } from '../../contract/types/contract'
import { WritingAssistantToolbarControl } from '../../writing/components/WritingAssistantToolbarControl'
import type { WritingSuggestion } from '../../writing/types/suggestion'
import type { WritingAnalysis } from '../../writing/types/writing'
import { ProductivityToolbarControl } from '../../productivity/components/ProductivityToolbarControl'
import { createProductivityProviderRegistry } from '../../productivity/services/providerRegistry'
import { GoogleSearchButton } from '../../viewer/components/GoogleSearchButton'
import { MobileToolbar } from '../../viewer/components/MobileToolbar'
import { ReadingMode } from '../../viewer/components/ReadingMode'
import { ShareToolbarControl } from '../../viewer/components/ShareToolbarControl'
import { ViewSwitcher } from '../../viewer/components/ViewSwitcher'
import { useReadingMode } from '../../viewer/hooks/useReadingMode'
import { useViewMode } from '../../viewer/hooks/useViewMode'
import { createViewerPages } from '../../viewer/services/viewManager'
import {
  isFormSubmissionMessage,
  getFormSubmissionChannelName,
  normalizeSubmissionValues,
} from '../../viewer/services/shareEngine'
import type { DocumentViewMode } from '../../viewer/types/viewer'
import { ComparisonToolbarControl } from '../../comparison/components/ComparisonToolbar'
import { ExportToolbarControl } from '../../export/components/ExportToolbarControl'
import { HistoryToolbarControl } from '../../history/components/HistoryToolbarControl'
import { historyNamespace } from '../../history/services/historyStorage'
import { DocumentIntelligenceToolbarControl } from '../../intelligence/components/DocumentIntelligenceToolbarControl'
import type { KnowledgeSource, PreparedKnowledgeSource } from '../../knowledge/types/source'
import type { ComparisonDocument, DocumentComparison } from '../../comparison/types/comparison'
import { PageIndicator } from '../../layout/components/PageIndicator'
import {
  PageLayoutPanel,
  PageLayoutToolbarControl,
} from '../../layout/components/PageLayoutPanel'
import { usePageLayout } from '../../layout/hooks/usePageLayout'
import { usePagination } from '../../layout/hooks/usePagination'
import { CommentHighlightPreview } from '../../review/components/CommentHighlightPreview'
import { CommentToolbar } from '../../review/components/CommentToolbar'
import { ReviewToolbarControl } from '../../review/components/ReviewToolbarControl'
import { SelectionCommentComposer } from '../../review/components/SelectionCommentComposer'
import { useComments } from '../../review/hooks/useComments'
import { useSelectionComment } from '../../review/hooks/useSelectionComment'
import type { Comment } from '../../review/types/comment'
import type { CommentHighlightPreviewState } from '../../review/types/review'
import { SuggestionPreview } from '../../review/trackChanges/components/SuggestionPreview'
import { SuggestionToolbar } from '../../review/trackChanges/components/SuggestionToolbar'
import { useTrackChanges } from '../../review/trackChanges/hooks/useTrackChanges'
import { WatermarkLayer } from '../../watermark/components/WatermarkLayer'
import { WatermarkPanel } from '../../watermark/components/WatermarkPanel'
import { useWatermark } from '../../watermark/hooks/useWatermark'
import { WorkflowToolbarControl } from '../../workflow/components/WorkflowToolbarControl'
import { loadWorkflow, saveWorkflow } from '../../workflow/services/workflowSerializer'
import type { Workflow } from '../../workflow/types/workflow'
import { ConflictBanner } from '../../collaboration/components/ConflictBanner'
import { CursorLayer } from '../../collaboration/components/CursorLayer'
import { PresenceBar } from '../../collaboration/components/PresenceBar'
import { SelectionLayer } from '../../collaboration/components/SelectionLayer'
import { useCollaboration } from '../../collaboration/hooks/useCollaboration'
import { renderCollaboratorDecorations } from '../../collaboration/services/collaborationRenderer'
import type { CollaborationEntityState } from '../../collaboration/services/collaborationEngine'
import { SearchToolbarControl } from '../../search/components/SearchToolbarControl'
import type { IndexedDocument } from '../../search/types/search'
import { RedactionToolbarControl } from '../../redaction/components/RedactionToolbarControl'
import type { RedactionRecord } from '../../redaction/types/redaction'
import { useDocumentEditor } from '../../hooks/useDocumentEditor'
import { useEditorApi } from '../../hooks/useEditorApi'
import { useIdentity } from '../../identity/hooks/useIdentity'
import { usePermissions } from '../../identity/hooks/usePermissions'
import { AccessDenied } from '../../identity/components/AccessDenied'
import type {
  IdentityAuditInput,
  IdentityManagerApi,
} from '../../identity/types/identity'
import type { IdentityPermission } from '../../identity/types/permissions'
import { cn } from '../../lib/cn'
import type { EditorApi } from '../../lib/editor-api'
import type { InternalDocumentEditorEvents } from '../../sdk/events'
import type { ResolvedDocumentEditorConfig } from '../../sdk/types'
import {
  CommandPalette,
  type WorkspaceCommandId,
} from '../CommandPalette/CommandPalette'
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary'
import { Toolbar, ToolbarDropdown } from '../Toolbar'
import { DocumentEditor } from '../DocumentEditor'
import { SelectionAi } from '../SelectionAI'
import type { AskDocumentCommandRequest } from '../AskDocument/AskDocumentPanel'

const AskDocumentPanel = lazy(async () => {
  const module = await import('../AskDocument/AskDocumentPanel')
  return { default: module.AskDocumentPanel }
})

const AssetLibrary = lazy(async () => {
  const module = await import('../../assets/components/AssetLibrary')
  return { default: module.AssetLibrary }
})

const ReviewSidebar = lazy(async () => {
  const module = await import('../../review/components/ReviewSidebar')
  return { default: module.ReviewSidebar }
})

const SuggestionSidebar = lazy(async () => {
  const module = await import('../../review/trackChanges/components/SuggestionSidebar')
  return { default: module.SuggestionSidebar }
})

const ComparisonWorkspace = lazy(async () => {
  const module = await import('../../comparison/components/ComparisonWorkspace')
  return { default: module.ComparisonWorkspace }
})

const PrintPreview = lazy(async () => {
  const module = await import('../../layout/components/PrintPreview')
  return { default: module.PrintPreview }
})

const ExportDialog = lazy(async () => {
  const module = await import('../../export/components/ExportDialog')
  return { default: module.ExportDialog }
})

const DocumentImportPanel = lazy(async () => {
  const module = await import('../../intelligence/components/DocumentImportPanel')
  return { default: module.DocumentImportPanel }
})

const CompliancePanel = lazy(async () => {
  const module = await import('../../compliance/components/CompliancePanel')
  return { default: module.CompliancePanel }
})

const FormBuilderPanel = lazy(async () => {
  const module = await import('../../forms/components/FormBuilderPanel')
  return { default: module.FormBuilderPanel }
})

const HistoryPanel = lazy(async () => {
  const module = await import('../../history/components/HistoryPanel')
  return { default: module.HistoryPanel }
})

const WorkflowPanel = lazy(async () => {
  const module = await import('../../workflow/components/WorkflowPanel')
  return { default: module.WorkflowPanel }
})

const SearchPanel = lazy(async () => {
  const module = await import('../../search/components/SearchPanel')
  return { default: module.SearchPanel }
})

const RedactionPanel = lazy(async () => {
  const module = await import('../../redaction/components/RedactionPanel')
  return { default: module.RedactionPanel }
})

const ContractPanel = lazy(async () => {
  const module = await import('../../contract/components/ContractPanel')
  return { default: module.ContractPanel }
})

const WritingAssistantPanel = lazy(async () => {
  const module = await import('../../writing/components/WritingAssistantPanel')
  return { default: module.WritingAssistantPanel }
})

const ProductivitySidebar = lazy(async () => {
  const module = await import('../../productivity/components/ProductivitySidebar')
  return { default: module.ProductivitySidebar }
})

const IdentitySettings = lazy(async () => {
  const module = await import('../../identity/components/IdentitySettings')
  return { default: module.IdentitySettings }
})

const CarouselView = lazy(async () => {
  const module = await import('../../viewer/components/CarouselView')
  return { default: module.CarouselView }
})

const BookView = lazy(async () => {
  const module = await import('../../viewer/components/BookView')
  return { default: module.BookView }
})

const ShareDialog = lazy(async () => {
  const module = await import('../../viewer/components/ShareDialog')
  return { default: module.ShareDialog }
})

/**
 * Owns the editor instance and wires it to its UI: it creates the editor, binds
 * the public {@link EditorApi} for the toolbar, and renders the editing surface.
 * The editor instance is shared via props only — no store, no context.
 */
interface EditorWorkspaceProps {
  config: ResolvedDocumentEditorConfig
  events: InternalDocumentEditorEvents
  identityManager: IdentityManagerApi | null
  onApiChange: (api: EditorApi | null) => void
}

const WORKSPACE_PERMISSIONS: readonly IdentityPermission[] = [
  'document.read',
  'document.edit',
  'comment',
  'track-changes',
  'approve',
  'export',
  'redact',
  'ai.access',
  'form-builder',
  'workflow',
  'contract-intelligence',
  'search',
  'administration',
]

/**
 * The right-hand dock shows at most one feature panel at a time. `activePanel`
 * is the single source of truth for that exclusivity — replacing the ~20
 * independent booleans and hand-written "close every other panel" lists this
 * workspace previously kept in sync manually.
 */
type RightDockPanelId =
  | 'askDocument'
  | 'assetLibrary'
  | 'review'
  | 'suggestion'
  | 'comparison'
  | 'pageLayout'
  | 'watermark'
  | 'export'
  | 'intelligence'
  | 'compliance'
  | 'formBuilder'
  | 'history'
  | 'workflow'
  | 'search'
  | 'redaction'
  | 'contract'
  | 'writingAssistant'
  | 'productivity'
  | 'identity'

export function EditorWorkspace({
  config,
  events,
  identityManager,
  onApiChange,
}: EditorWorkspaceProps) {
  const identity = useIdentity(identityManager)
  const permissionState = usePermissions(identityManager, WORKSPACE_PERMISSIONS)
  const canRead = permissionState.can('document.read')
  const canEdit = canRead && permissionState.can('document.edit')
  const canComment = canRead && permissionState.can('comment')
  const canTrackChanges = canRead && permissionState.can('track-changes')
  const canApprove = canRead && permissionState.can('approve')
  const canExport = canRead && permissionState.can('export')
  const canRedact = canRead && permissionState.can('redact')
  const canUseAi = canRead && permissionState.can('ai.access')
  const canBuildForms = canRead && permissionState.can('form-builder')
  const canUseWorkflow = canRead && permissionState.can('workflow')
  const canUseContractIntelligence = canRead && permissionState.can('contract-intelligence')
  const canSearch = canRead && permissionState.can('search')
  const recordIdentityAudit = useCallback(
    (input: IdentityAuditInput) => {
      identityManager?.audit(input)
    },
    [identityManager],
  )
  const editor = useDocumentEditor({
    placeholder: config.placeholder,
    content: config.initialContent,
    editable: !config.readonly && canEdit,
  })
  const api = useEditorApi(editor)
  const [activePanel, setActivePanel] = useState<RightDockPanelId | null>(null)
  const isAskDocumentOpen = activePanel === 'askDocument'
  const [isAskDocumentLoaded, setIsAskDocumentLoaded] = useState(false)
  const isAssetLibraryOpen = activePanel === 'assetLibrary'
  const [isAssetLibraryLoaded, setIsAssetLibraryLoaded] = useState(false)
  const [recentAssetIds, setRecentAssetIds] = useState<string[]>([])
  const isReviewMode = activePanel === 'review'
  const [isReviewLoaded, setIsReviewLoaded] = useState(false)
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null)
  const [commentHighlightPreview, setCommentHighlightPreview] =
    useState<CommentHighlightPreviewState | null>(null)
  // Suggestion Mode and its sidebar stay independent state (not derived from
  // activePanel): per CODEX_CONTEXT.md the sidebar may be explicitly hidden
  // on mobile while Suggestion Mode remains active — see hideSuggestionSidebar.
  const [isSuggestionMode, setIsSuggestionMode] = useState(false)
  const [isSuggestionSidebarOpen, setIsSuggestionSidebarOpen] = useState(false)
  const [isSuggestionLoaded, setIsSuggestionLoaded] = useState(false)
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null)
  const [suggestionPreview, setSuggestionPreview] =
    useState<{ changeId: string; bounds: CommentHighlightPreviewState['bounds'] } | null>(null)
  const isComparisonOpen = activePanel === 'comparison'
  const isExportOpen = activePanel === 'export'
  const [isExportLoaded, setIsExportLoaded] = useState(false)
  const isIntelligenceOpen = activePanel === 'intelligence'
  const [isIntelligenceLoaded, setIsIntelligenceLoaded] = useState(false)
  const isComplianceOpen = activePanel === 'compliance'
  const [isComplianceLoaded, setIsComplianceLoaded] = useState(false)
  const isFormBuilderOpen = activePanel === 'formBuilder'
  const [isFormBuilderLoaded, setIsFormBuilderLoaded] = useState(false)
  const [formFieldCount, setFormFieldCount] = useState(0)
  const isHistoryOpen = activePanel === 'history'
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false)
  const [historyVersionCount, setHistoryVersionCount] = useState(0)
  const isWorkflowOpen = activePanel === 'workflow'
  const [isWorkflowLoaded, setIsWorkflowLoaded] = useState(false)
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null)
  const isSearchOpen = activePanel === 'search'
  const [isSearchLoaded, setIsSearchLoaded] = useState(false)
  const isRedactionOpen = activePanel === 'redaction'
  const [isRedactionLoaded, setIsRedactionLoaded] = useState(false)
  const [redactionRecords, setRedactionRecords] = useState<RedactionRecord[]>([])
  const isContractOpen = activePanel === 'contract'
  const [isContractLoaded, setIsContractLoaded] = useState(false)
  const [contractAnalysis, setContractAnalysis] = useState<ContractAnalysis | null>(null)
  const isWritingAssistantOpen = activePanel === 'writingAssistant'
  const [isWritingAssistantLoaded, setIsWritingAssistantLoaded] = useState(false)
  const [writingAnalysis, setWritingAnalysis] = useState<WritingAnalysis | null>(null)
  const isProductivityOpen = activePanel === 'productivity'
  const [isProductivityLoaded, setIsProductivityLoaded] = useState(false)
  const isIdentityOpen = activePanel === 'identity'
  const [isIdentityLoaded, setIsIdentityLoaded] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isShareLoaded, setIsShareLoaded] = useState(false)
  const [searchKnowledgeSources, setSearchKnowledgeSources] = useState<KnowledgeSource[]>([])
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null)
  const [collaborationLayoutTick, setCollaborationLayoutTick] = useState(0)
  const [comparisonInitialDocument, setComparisonInitialDocument] = useState('')
  const [comparisonInitialLeft, setComparisonInitialLeft] = useState<ComparisonDocument>()
  const [comparisonInitialRight, setComparisonInitialRight] = useState<ComparisonDocument>()
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [askDocumentCommand, setAskDocumentCommand] =
    useState<AskDocumentCommandRequest | null>(null)
  const askDocumentButtonRef = useRef<HTMLButtonElement>(null)
  const identityButtonRef = useRef<HTMLButtonElement>(null)
  const validShareIdsRef = useRef<string[]>([])
  const shareChannelsRef = useRef(new Map<string, BroadcastChannel>())
  const lastDocumentTextRef = useRef<string | null>(null)
  const lastSelectionRef = useRef<string | null>(null)
  const AskDocumentIcon = config.theme.icons.askDocument ?? MessageSquareText
  const CommandPaletteIcon = config.theme.icons.commandPalette ?? Command
  const availableCommands: WorkspaceCommandId[] = [
    ...(config.ai && canUseAi ? (['ask-ai', 'toggle-sidebar'] as const) : []),
    ...(config.ai && canUseAi && canEdit && !config.readonly ? (['insert-last-response'] as const) : []),
    ...(config.ai && canUseAi && config.knowledgeSources ? (['upload-source'] as const) : []),
    ...(config.ai && canUseAi && config.knowledgeSources && config.preview
      ? (['open-preview'] as const)
      : []),
    ...(canRead ? (['focus-editor'] as const) : []),
  ]
  const documentHistoryNamespace = useMemo(
    () => historyNamespace(JSON.stringify(config.initialContent ?? 'document')),
    [config.initialContent],
  )
  const productivityRegistry = useMemo(
    () => config.productivity ? createProductivityProviderRegistry(config.productivity) : null,
    [config.productivity],
  )

  useEffect(() => {
    let active = true
    void loadWorkflow(documentHistoryNamespace).then((workflow) => {
      if (active) setCurrentWorkflow(workflow)
    })
    return () => { active = false }
  }, [documentHistoryNamespace])

  const recordRecentAsset = useCallback((asset: Asset) => {
    setRecentAssetIds((current) => [
      asset.id,
      ...current.filter((id) => id !== asset.id),
    ].slice(0, 8))
  }, [])
  const {
    pendingAsset,
    beginPlacement,
    cancelPlacement,
    insertPendingAsset,
  } = useAssetInsertion({ api, onInserted: recordRecentAsset })
  const identityAuthor = useMemo(() => identity.principal ? {
    id: identity.principal.id,
    name: identity.principal.displayName,
    avatarUrl: identity.principal.avatarUrl,
  } : undefined, [identity.principal])
  const {
    comments,
    removedComments,
    commentsById,
    currentAuthor,
    addComment,
    addReply,
    editComment,
    setResolved,
    deleteComment,
    jumpToComment,
    applyRemoteComments,
  } = useComments(
    api,
    config.collaboration ? config.collaboration.user : identityAuthor,
  )
  const {
    changes,
    changesById,
    decide: decideTrackChange,
    decideAll: decideAllTrackChanges,
    jumpToChange,
    applyRemoteTrackChanges,
  } = useTrackChanges(api, currentAuthor)

  const handleCollaborativeState = useCallback((state: CollaborationEntityState) => {
    applyRemoteComments(state.comments, state.removedComments)
    applyRemoteTrackChanges(state.trackChanges)
    setCurrentWorkflow(state.workflow)
    if (config.collaboration) {
      void saveWorkflow(documentHistoryNamespace, state.workflow).catch((cause) => {
        events.emit('error', {
          scope: 'collaboration',
          message: 'A remote workflow update could not be stored locally.',
          cause,
        })
      })
    }
  }, [applyRemoteComments, applyRemoteTrackChanges, config.collaboration, documentHistoryNamespace, events])
  const collaborationSharedState = useMemo(() => ({
    comments,
    removedComments,
    trackChanges: changes,
    workflow: currentWorkflow,
  }), [changes, comments, currentWorkflow, removedComments])
  const collaboration = useCollaboration({
    api,
    config: config.collaboration,
    sharedState: collaborationSharedState,
    historyNamespace: documentHistoryNamespace,
    events,
    onSharedState: handleCollaborativeState,
  })
  const collaboratorDecorations = renderCollaboratorDecorations(
    api,
    collaboration.collaborators.filter((collaborator) =>
      !config.collaboration || collaborator.id !== config.collaboration.user.id,
    ),
  )
  void collaborationLayoutTick

  useEffect(() => {
    if (!config.collaboration) return
    const update = () => setCollaborationLayoutTick((value) => value + 1)
    window.addEventListener('scroll', update, { capture: true, passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [config.collaboration])

  const handleCommentCreated = useCallback((comment: Comment) => {
    setSelectedCommentId(comment.id)
    setCommentHighlightPreview(null)
  }, [])
  const {
    selection: reviewSelection,
    pendingComment,
    openComposer,
    closeComposer,
    saveComment,
  } = useSelectionComment({
    api,
    enabled: isReviewMode,
    keyboardShortcuts: config.keyboardShortcuts,
    onCreate: addComment,
    onCreated: handleCommentCreated,
  })
  const previewedComment = commentHighlightPreview
    ? commentsById.get(commentHighlightPreview.commentId) ?? null
    : null
  const previewedChange = suggestionPreview
    ? changesById.get(suggestionPreview.changeId) ?? null
    : null
  const pendingTrackChangeCount = changes.filter(
    (change) => change.status === 'pending',
  ).length
  const {
    layout: pageLayout,
    isPanelOpen: isPageLayoutOpen,
    isPrintPreviewOpen,
    printZoom,
    setLayout: setPageLayout,
    setIsPanelOpen: setIsPageLayoutOpen,
    setIsPrintPreviewOpen,
    setPrintZoom,
  } = usePageLayout()
  const {
    mode: viewMode,
    zoom: viewerZoom,
    selectMode: selectViewMode,
    closeViewer,
    zoomIn: zoomViewerIn,
    zoomOut: zoomViewerOut,
  } = useViewMode()
  const {
    snapshot: pagination,
    insertPageBreak,
    removePageBreak,
  } = usePagination(api, pageLayout)
  const viewerPages = useMemo(
    () => createViewerPages(api?.getDocumentText() ?? '', pageLayout, pagination),
    [api, pageLayout, pagination],
  )
  const {
    watermark,
    isPanelOpen: isWatermarkOpen,
    addWatermark,
    updateWatermark,
    removeWatermark,
    setIsPanelOpen: setIsWatermarkOpen,
  } = useWatermark()
  const watermarkPages = useMemo(
    () => pagination.pages.map((page) => ({
      number: page.number,
      top: page.top,
      width: pagination.pageWidth,
      height: page.height,
    })),
    [pagination.pageWidth, pagination.pages],
  )
  const acceptTrackChange = useCallback(
    (changeId: string) => decideTrackChange(changeId, 'accept'),
    [decideTrackChange],
  )
  const rejectTrackChange = useCallback(
    (changeId: string) => decideTrackChange(changeId, 'reject'),
    [decideTrackChange],
  )
  const acceptAllTrackChanges = useCallback(
    () => decideAllTrackChanges('accept'),
    [decideAllTrackChanges],
  )
  const rejectAllTrackChanges = useCallback(
    () => decideAllTrackChanges('reject'),
    [decideAllTrackChanges],
  )

  useEffect(() => {
    onApiChange(api)
    return () => onApiChange(null)
  }, [api, onApiChange])

  useEffect(() => {
    if (!api) {
      setFormFieldCount(0)
      return
    }
    const sync = () => setFormFieldCount(api.getFormFields().length)
    sync()
    return api.subscribe(sync)
  }, [api])

  useEffect(() => {
    if (!api) return

    const notifyChanges = () => {
      const text = api.getDocumentText()
      if (lastDocumentTextRef.current !== text) {
        lastDocumentTextRef.current = text
        events.emit('editorChange', { text })
      }

      const selection = api.getTextSelection()
      const selectionKey = selection
        ? `${selection.from}:${selection.to}:${selection.text}`
        : ''
      if (lastSelectionRef.current !== selectionKey) {
        lastSelectionRef.current = selectionKey
        events.emit('selectionChange', { selection })
      }
    }

    notifyChanges()
    return api.subscribe(notifyChanges)
  }, [api, events])

  useEffect(() => {
    if (!identityManager) return
    return events.on('aiRequest', ({ workflow, requestId, action }) => {
      identityManager.audit({
        category: 'ai',
        action: `ai.${workflow}.requested`,
        outcome: 'success',
        resourceId: requestId,
        details: { workflow, action: action ?? null },
      })
    })
  }, [events, identityManager])

  useEffect(() => {
    if (!api) return
    api.setReviewMode(isReviewMode)
    return () => api.setReviewMode(false)
  }, [api, isReviewMode])

  useEffect(() => {
    if (!api) return
    api.setSuggestionMode(isSuggestionMode)
    return () => api.setSuggestionMode(false)
  }, [api, isSuggestionMode])

  useEffect(() => {
    if (!api || !isReviewMode) return
    return api.subscribeCommentInteractions((interaction) => {
      if (interaction.type === 'leave') {
        setCommentHighlightPreview((current) =>
          current?.commentId === interaction.commentId ? null : current,
        )
        return
      }
      if (interaction.type === 'preview') {
        setCommentHighlightPreview({
          commentId: interaction.commentId,
          bounds: interaction.bounds,
        })
        return
      }

      setCommentHighlightPreview(null)
      setSelectedCommentId(interaction.commentId)
      setIsReviewLoaded(true)
      setActivePanel('review')
    })
  }, [api, isReviewMode])

  useEffect(() => {
    if (!api || !isSuggestionMode) return
    return api.subscribeTrackChangeInteractions((interaction) => {
      if (interaction.type === 'leave') {
        setSuggestionPreview((current) =>
          current?.changeId === interaction.changeId ? null : current,
        )
        return
      }
      if (interaction.type === 'preview') {
        setSuggestionPreview({
          changeId: interaction.changeId,
          bounds: interaction.bounds,
        })
        return
      }

      setSuggestionPreview(null)
      setSelectedChangeId(interaction.changeId)
      setIsSuggestionLoaded(true)
      setActivePanel('suggestion')
      setIsSuggestionMode(true)
      setIsSuggestionSidebarOpen(true)
    })
  }, [api, isSuggestionMode])

  // Sync the two right-dock panels whose visibility booleans are owned by
  // their own hooks (usePageLayout/useWatermark) with the single activePanel
  // source of truth, instead of setting them from every open*/close* callback.
  useEffect(() => {
    setIsPageLayoutOpen(activePanel === 'pageLayout')
  }, [activePanel, setIsPageLayoutOpen])

  useEffect(() => {
    setIsWatermarkOpen(activePanel === 'watermark')
  }, [activePanel, setIsWatermarkOpen])

  // Suggestion Mode/sidebar are independent state (see declaration above) but
  // must still close when a different dock panel becomes active.
  useEffect(() => {
    if (activePanel !== 'suggestion') {
      setIsSuggestionMode(false)
      setIsSuggestionSidebarOpen(false)
    }
  }, [activePanel])

  const openAskDocument = useCallback(() => {
    setActivePanel('askDocument')
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    setIsAskDocumentLoaded(true)
  }, [])

  const closeAskDocument = useCallback(() => {
    setActivePanel(null)
    window.requestAnimationFrame(() => askDocumentButtonRef.current?.focus())
  }, [])

  const openAssetLibrary = useCallback(() => {
    setActivePanel('assetLibrary')
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    setIsAssetLibraryLoaded(true)
  }, [])

  const openReviewMode = useCallback(() => {
    setActivePanel('review')
    setSuggestionPreview(null)
    cancelPlacement()
    setIsReviewLoaded(true)
  }, [cancelPlacement])

  const closeReviewMode = useCallback(() => {
    setActivePanel(null)
    setCommentHighlightPreview(null)
    closeComposer()
    window.requestAnimationFrame(() => {
      document.getElementById('review-mode-trigger')?.focus()
    })
  }, [closeComposer])

  const openSuggestionMode = useCallback(() => {
    setActivePanel('suggestion')
    setCommentHighlightPreview(null)
    closeComposer()
    cancelPlacement()
    setIsSuggestionLoaded(true)
    setIsSuggestionMode(true)
    setIsSuggestionSidebarOpen(true)
  }, [cancelPlacement, closeComposer])

  const closeSuggestionMode = useCallback(() => {
    setActivePanel(null)
    setIsSuggestionMode(false)
    setIsSuggestionSidebarOpen(false)
    setSuggestionPreview(null)
    window.requestAnimationFrame(() => {
      document.getElementById('suggestion-mode-trigger')?.focus()
    })
  }, [])

  const openComparison = useCallback((seed?: DocumentComparison) => {
    setActivePanel('comparison')
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    closeComposer()
    cancelPlacement()
    setComparisonInitialDocument(api?.getDocumentText() ?? '')
    setComparisonInitialLeft(seed?.leftDocument)
    setComparisonInitialRight(seed?.rightDocument)
  }, [api, cancelPlacement, closeComposer])

  const closeComparison = useCallback(() => {
    setActivePanel(null)
    window.requestAnimationFrame(() => {
      document.getElementById('comparison-trigger')?.focus()
    })
  }, [])

  const openPageLayout = useCallback(() => {
    setActivePanel('pageLayout')
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
  }, [cancelPlacement, closeComposer])

  const closePageLayout = useCallback(() => {
    setActivePanel(null)
    window.requestAnimationFrame(() => {
      document.getElementById('page-layout-trigger')?.focus()
    })
  }, [])

  const openWatermark = useCallback(() => {
    setActivePanel('watermark')
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
  }, [cancelPlacement, closeComposer])

  const closeWatermark = useCallback(() => {
    setActivePanel(null)
    window.requestAnimationFrame(() => {
      document.getElementById('watermark-trigger')?.focus()
    })
  }, [])

  const openExport = useCallback(() => {
    setActivePanel('export')
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
    setIsExportLoaded(true)
  }, [cancelPlacement, closeComposer])

  const closeExport = useCallback(() => {
    setActivePanel(null)
    window.requestAnimationFrame(() => {
      document.getElementById('export-trigger')?.focus()
    })
  }, [])

  const openIntelligence = useCallback(() => {
    setActivePanel('intelligence')
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
    setIsIntelligenceLoaded(true)
  }, [cancelPlacement, closeComposer])

  const closeIntelligence = useCallback(() => {
    setActivePanel(null)
    window.requestAnimationFrame(() => {
      document.getElementById('document-intelligence-trigger')?.focus()
    })
  }, [])

  const openCompliance = useCallback(() => {
    setActivePanel('compliance')
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
    setIsComplianceLoaded(true)
  }, [cancelPlacement, closeComposer])

  const closeCompliance = useCallback(() => {
    setActivePanel(null)
    window.requestAnimationFrame(() => {
      document.getElementById('compliance-trigger')?.focus()
    })
  }, [])

  const openFormBuilder = useCallback(() => {
    setActivePanel('formBuilder')
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
    setIsFormBuilderLoaded(true)
  }, [cancelPlacement, closeComposer])

  const closeFormBuilder = useCallback(() => {
    setActivePanel(null)
    window.requestAnimationFrame(() => {
      document.getElementById('form-builder-trigger')?.focus()
    })
  }, [])

  const openHistory = useCallback(() => {
    setActivePanel('history')
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
    setIsHistoryLoaded(true)
  }, [cancelPlacement, closeComposer])

  const closeHistory = useCallback(() => {
    setActivePanel(null)
    window.requestAnimationFrame(() => {
      document.getElementById('history-trigger')?.focus()
    })
  }, [])

  const openWorkflow = useCallback(() => {
    setActivePanel('workflow')
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
    setIsWorkflowLoaded(true)
  }, [cancelPlacement, closeComposer])

  const closeWorkflow = useCallback(() => {
    setActivePanel(null)
    window.requestAnimationFrame(() => document.getElementById('workflow-trigger')?.focus())
  }, [])

  const openSearch = useCallback(() => {
    setActivePanel('search')
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
    setIsSearchLoaded(true)
  }, [cancelPlacement, closeComposer])

  const closeSearch = useCallback(() => {
    setActivePanel(null)
    window.requestAnimationFrame(() => document.getElementById('semantic-search-trigger')?.focus())
  }, [])

  const openRedaction = useCallback(() => {
    setActivePanel('redaction')
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
    setIsRedactionLoaded(true)
  }, [cancelPlacement, closeComposer])

  const closeRedaction = useCallback(() => {
    setActivePanel(null)
    window.requestAnimationFrame(() => document.getElementById('redaction-trigger')?.focus())
  }, [])

  const openContract = useCallback(() => {
    setActivePanel('contract')
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
    setIsContractLoaded(true)
  }, [cancelPlacement, closeComposer])

  const closeContract = useCallback(() => {
    setActivePanel(null)
    window.requestAnimationFrame(() => document.getElementById('contract-trigger')?.focus())
  }, [])

  const openWritingAssistant = useCallback(() => {
    setActivePanel('writingAssistant')
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    if (pendingComment) closeComposer()
    setIsWritingAssistantLoaded(true)
  }, [cancelPlacement, closeComposer, pendingComment])

  const closeWritingAssistant = useCallback(() => {
    setActivePanel(null)
    window.requestAnimationFrame(() => document.getElementById('writing-assistant-trigger')?.focus())
  }, [])

  const openProductivity = useCallback(() => {
    setActivePanel('productivity')
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    if (pendingComment) closeComposer()
    setIsProductivityLoaded(true)
  }, [cancelPlacement, closeComposer, pendingComment])

  const closeProductivity = useCallback(() => {
    setActivePanel(null)
    window.requestAnimationFrame(() => document.getElementById('productivity-trigger')?.focus())
  }, [])

  const openIdentity = useCallback(() => {
    setActivePanel('identity')
    setIsShareOpen(false)
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    if (pendingComment) closeComposer()
    setIsIdentityLoaded(true)
  }, [cancelPlacement, closeComposer, pendingComment])

  const closeIdentity = useCallback(() => {
    setActivePanel(null)
    window.requestAnimationFrame(() => identityButtonRef.current?.focus())
  }, [])

  useEffect(() => {
    if (!canComment) {
      if (activePanel === 'review') setActivePanel(null)
      closeComposer()
    }
    if (!canTrackChanges) {
      setIsSuggestionMode(false)
      setIsSuggestionSidebarOpen(false)
    }
    if (!canExport && activePanel === 'export') setActivePanel(null)
    if (!canRedact && activePanel === 'redaction') setActivePanel(null)
    if (!canBuildForms) {
      if (activePanel === 'formBuilder') setActivePanel(null)
      setIsShareOpen(false)
    }
    if (!canUseWorkflow && activePanel === 'workflow') setActivePanel(null)
    if (!canUseContractIntelligence && activePanel === 'contract') setActivePanel(null)
    if (!canSearch && activePanel === 'search') setActivePanel(null)
    if (
      !canUseAi &&
      (activePanel === 'askDocument' || activePanel === 'writingAssistant' || activePanel === 'productivity')
    ) {
      setActivePanel(null)
    }
    if (!canEdit) cancelPlacement()
  }, [
    activePanel,
    canBuildForms,
    canComment,
    canEdit,
    canExport,
    canRedact,
    canSearch,
    canTrackChanges,
    canUseAi,
    canUseContractIntelligence,
    canUseWorkflow,
    cancelPlacement,
    closeComposer,
  ])

  const hideSuggestionSidebar = useCallback(() => {
    setIsSuggestionSidebarOpen(false)
    setSuggestionPreview(null)
    window.requestAnimationFrame(() => api?.focus())
  }, [api])

  const closeAssetLibrary = useCallback(() => {
    setActivePanel(null)
    window.requestAnimationFrame(() => {
      document.getElementById('asset-library-trigger')?.focus()
    })
  }, [])

  const selectAsset = useCallback(
    (asset: Asset) => {
      beginPlacement(asset)
      setActivePanel(null)
    },
    [beginPlacement],
  )

  const placePendingAsset = useCallback(() => {
    if (!pendingAsset) return
    window.requestAnimationFrame(insertPendingAsset)
  }, [insertPendingAsset, pendingAsset])

  useEffect(() => {
    if (!pendingAsset) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancelPlacement()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cancelPlacement, pendingAsset])

  const getDocumentText = useCallback(() => api?.getDocumentText() ?? '', [api])

  const jumpToComplianceFinding = useCallback((finding: ComplianceFinding) => {
    if (!api || !finding.location.quote) return false
    const selection = api.findTextSelection(finding.location.quote)
    return selection ? api.focusTextSelection(selection) : false
  }, [api])

  const createComplianceComment = useCallback((finding: ComplianceFinding) => {
    if (!api || !finding.location.quote) return false
    const selection = api.findTextSelection(finding.location.quote)
    if (!selection) return false
    const comment = addComment(selection, `${finding.title}: ${finding.recommendation}`)
    if (!comment) return false
    setSelectedCommentId(comment.id)
    setActivePanel('review')
    setIsReviewLoaded(true)
    return true
  }, [addComment, api])

  const createComplianceSuggestion = useCallback((
    finding: ComplianceFinding,
    recommendation?: ComplianceRecommendation,
  ) => {
    if (!api) return false
    const suggestedText = recommendation?.suggestedText ?? finding.suggestedText
    if (!suggestedText?.trim()) return false
    const selection = finding.location.quote
      ? api.findTextSelection(finding.location.quote)
      : null
    if (selection) api.setSuggestionMode(true)
    const didInsert = selection
      ? api.replaceTextSelection(selection, suggestedText)
      : api.insertTrackedSuggestion(suggestedText)
    if (!didInsert) {
      if (selection) api.setSuggestionMode(false)
      return false
    }
    setActivePanel('suggestion')
    setIsSuggestionLoaded(true)
    setIsSuggestionMode(true)
    setIsSuggestionSidebarOpen(true)
    return true
  }, [api])

  const createWritingSuggestion = useCallback((
    originalText: string,
    suggestedText: string,
    _reason: string,
  ) => {
    if (!api || !originalText.trim() || !suggestedText.trim()) return false
    const selection = api.findTextSelection(originalText)
    if (!selection) return false
    api.setSuggestionMode(true)
    if (!api.replaceTextSelection(selection, suggestedText)) {
      api.setSuggestionMode(false)
      return false
    }
    setActivePanel('suggestion')
    setIsSuggestionLoaded(true)
    setIsSuggestionMode(true)
    setIsSuggestionSidebarOpen(true)
    return true
  }, [api])

  const createWritingComment = useCallback((suggestion: WritingSuggestion) => {
    if (!api) return false
    const selection = api.findTextSelection(suggestion.originalText)
    if (!selection) return false
    const comment = addComment(selection, `Writing suggestion: ${suggestion.reason}`)
    if (!comment) return false
    setSelectedCommentId(comment.id)
    setActivePanel('review')
    setIsReviewLoaded(true)
    return true
  }, [addComment, api])

  const askAboutComplianceFinding = useCallback((finding: ComplianceFinding) => {
    if (!config.ai) return
    openAskDocument()
    setAskDocumentCommand({
      id: crypto.randomUUID(),
      command: 'ask-question',
      question: `Explain this compliance finding using the current document and recommend a next step: ${finding.title}. ${finding.description}`,
    })
  }, [config.ai, openAskDocument])

  const requestAskDocumentCommand = useCallback(
    (command: AskDocumentCommandRequest['command']) => {
      openAskDocument()
      setAskDocumentCommand({ id: crypto.randomUUID(), command })
    },
    [openAskDocument],
  )

  const saveIntelligenceSource = useCallback((source: PreparedKnowledgeSource) => {
    openAskDocument()
    setAskDocumentCommand({
      id: crypto.randomUUID(),
      command: 'add-prepared-source',
      preparedSource: source,
    })
  }, [openAskDocument])

  const openSearchDocument = useCallback((document: IndexedDocument) => {
    if (document.metadata.kind === 'current-document' || document.metadata.kind === 'compliance-finding' || document.metadata.kind === 'writing-suggestion' || document.metadata.kind.startsWith('contract-')) {
      const quote = document.metadata.locationQuote ?? document.content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line && line !== document.title)
        ?.split(/(?<=[.!?])\s+/)[0]
        ?.slice(0, 180)
      const selection = quote ? api?.findTextSelection(quote) : null
      setActivePanel(null)
      if (selection) api?.focusTextSelection(selection)
      else api?.focus()
      return
    }
    if (document.metadata.kind === 'knowledge-source' && document.metadata.sourceId) {
      openAskDocument()
      setAskDocumentCommand({
        id: crypto.randomUUID(),
        command: 'open-source',
        sourceId: document.metadata.sourceId,
      })
      return
    }
    if (document.metadata.kind === 'version') openHistory()
  }, [api, openAskDocument, openHistory])

  const addSearchKnowledgeSource = useCallback((source: PreparedKnowledgeSource) => {
    openAskDocument()
    setAskDocumentCommand({
      id: crypto.randomUUID(),
      command: 'add-prepared-source',
      preparedSource: source,
    })
  }, [openAskDocument])

  const askAIAboutSearchResults = useCallback((documents: IndexedDocument[], query: string) => {
    if (!config.ai || documents.length === 0) return
    const evidence = documents.map((document, index) =>
      `${index + 1}. ${document.title}: ${document.content.replace(/\s+/g, ' ').slice(0, 600)}`,
    ).join('\n')
    openAskDocument()
    setAskDocumentCommand({
      id: crypto.randomUUID(),
      command: 'ask-question',
      question: query.trim()
        ? `Using the current document and these retrieved results, answer this query: ${query}\n\nRetrieved results:\n${evidence}`
        : `Summarize the most relevant themes, relationships, and differences in these retrieved results:\n\n${evidence}`,
    })
  }, [config.ai, openAskDocument])

  const closeShare = useCallback(() => {
    setIsShareOpen(false)
  }, [])

  const openShare = useCallback(() => {
    setIsShareLoaded(true)
    setIsShareOpen(true)
  }, [])

  const emitFormSubmission = useCallback((message: unknown) => {
    if (!isFormSubmissionMessage(message)) return
    if (!validShareIdsRef.current.includes(message.payload.shareId)) return
    events.emit('formSubmit', {
      ...message.payload,
      values: normalizeSubmissionValues(message.payload.values),
    })
  }, [events])

  const registerShareArtifact = useCallback((shareId: string) => {
    validShareIdsRef.current = [
      shareId,
      ...validShareIdsRef.current.filter((id) => id !== shareId),
    ].slice(0, 32)
    if (typeof BroadcastChannel !== 'function' || shareChannelsRef.current.has(shareId)) return

    const channel = new BroadcastChannel(getFormSubmissionChannelName(shareId))
    channel.onmessage = (event) => emitFormSubmission(event.data)
    shareChannelsRef.current.set(shareId, channel)
    while (shareChannelsRef.current.size > 32) {
      const oldest = shareChannelsRef.current.entries().next().value
      if (!oldest) break
      oldest[1].close()
      shareChannelsRef.current.delete(oldest[0])
    }
  }, [emitFormSubmission])

  useEffect(() => {
    const channels = shareChannelsRef.current
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      emitFormSubmission(event.data)
    }
    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
      for (const channel of channels.values()) channel.close()
      channels.clear()
    }
  }, [emitFormSubmission])

  const handleViewModeChange = useCallback((nextMode: DocumentViewMode) => {
    setIsPrintPreviewOpen(nextMode === 'pdf-preview')
    selectViewMode(nextMode)
    if (nextMode === 'editor') return

    setActivePanel(null)
    setIsSuggestionMode(false)
    setIsSuggestionSidebarOpen(false)
    setIsShareOpen(false)
    cancelPlacement()
    if (pendingComment) closeComposer()
  }, [
    cancelPlacement,
    closeComposer,
    pendingComment,
    selectViewMode,
    setIsPrintPreviewOpen,
  ])

  const closeDocumentViewer = useCallback(() => {
    setIsPrintPreviewOpen(false)
    closeViewer()
  }, [closeViewer, setIsPrintPreviewOpen])

  const toggleReadingMode = useCallback(() => {
    handleViewModeChange(viewMode === 'reading' ? 'editor' : 'reading')
  }, [handleViewModeChange, viewMode])

  useReadingMode({
    api,
    active: viewMode === 'reading',
    keyboardShortcuts: config.keyboardShortcuts,
    onToggle: toggleReadingMode,
  })

  useEffect(() => {
    if (viewMode !== 'reading') return
    if (
      isAskDocumentOpen || isAssetLibraryOpen || isReviewMode ||
      isSuggestionMode || isComparisonOpen || isPageLayoutOpen ||
      isWatermarkOpen || isExportOpen || isIntelligenceOpen ||
      isComplianceOpen || isFormBuilderOpen || isHistoryOpen ||
      isWorkflowOpen || isSearchOpen || isRedactionOpen ||
      isContractOpen || isWritingAssistantOpen || isProductivityOpen
    ) selectViewMode('editor')
  }, [
    isAskDocumentOpen,
    isAssetLibraryOpen,
    isComparisonOpen,
    isComplianceOpen,
    isContractOpen,
    isExportOpen,
    isFormBuilderOpen,
    isHistoryOpen,
    isIntelligenceOpen,
    isPageLayoutOpen,
    isRedactionOpen,
    isReviewMode,
    isSearchOpen,
    isSuggestionMode,
    isWatermarkOpen,
    isWorkflowOpen,
    isWritingAssistantOpen,
    isProductivityOpen,
    selectViewMode,
    viewMode,
  ])

  const runWorkspaceCommand = useCallback(
    (command: WorkspaceCommandId) => {
      switch (command) {
        case 'ask-ai':
          requestAskDocumentCommand('focus-input')
          break
        case 'upload-source':
          requestAskDocumentCommand('upload-source')
          break
        case 'open-preview':
          requestAskDocumentCommand('open-preview')
          break
        case 'insert-last-response':
          requestAskDocumentCommand('insert-last-response')
          break
        case 'toggle-sidebar':
          if (isAskDocumentOpen) closeAskDocument()
          else openAskDocument()
          break
        case 'focus-editor':
          api?.focus()
          break
      }
    },
    [
      api,
      closeAskDocument,
      isAskDocumentOpen,
      openAskDocument,
      requestAskDocumentCommand,
    ],
  )

  useEffect(() => {
    if (!config.keyboardShortcuts || !config.commandPalette || !canRead) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLocaleLowerCase() === 'k' &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey
      ) {
        const isPaletteOpen = document.getElementById('command-palette-title') !== null
        if (
          !isPaletteOpen &&
          document.querySelector('[role="dialog"][aria-modal="true"]')
        ) {
          return
        }
        event.preventDefault()
        setIsCommandPaletteOpen((isOpen) => !isOpen)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canRead, config.commandPalette, config.keyboardShortcuts])

  useEffect(() => {
    if (!config.keyboardShortcuts || config.readonly || !canTrackChanges) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLocaleLowerCase() !== 's' ||
        !(event.metaKey || event.ctrlKey) ||
        !event.shiftKey ||
        !event.altKey
      ) {
        return
      }
      event.preventDefault()
      if (isSuggestionMode) closeSuggestionMode()
      else openSuggestionMode()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    closeSuggestionMode,
    canTrackChanges,
    config.keyboardShortcuts,
    config.readonly,
    isSuggestionMode,
    openSuggestionMode,
  ])

  useEffect(() => {
    if (!config.keyboardShortcuts || !canSearch) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLocaleLowerCase() === 'f' &&
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault()
        if (isSearchOpen) closeSearch()
        else openSearch()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canSearch, closeSearch, config.keyboardShortcuts, isSearchOpen, openSearch])

  const isMobileSurfaceOpen =
    isAskDocumentOpen || isAssetLibraryOpen || isReviewMode || isSuggestionMode ||
    isComparisonOpen || isPageLayoutOpen || isWatermarkOpen || isExportOpen ||
    isIntelligenceOpen || isComplianceOpen || isFormBuilderOpen || isHistoryOpen ||
    isWorkflowOpen || isSearchOpen || isRedactionOpen || isContractOpen ||
    isWritingAssistantOpen || isProductivityOpen || isIdentityOpen || isShareOpen ||
    isCommandPaletteOpen || isPrintPreviewOpen

  return (
    <div className="document-editor-workspace mx-auto flex w-full max-w-[96rem] items-start justify-center px-2 pb-20 pt-3 sm:px-5 sm:py-6 lg:px-7">
      <div className={cn('min-w-0 w-full max-w-[84rem]', viewMode === 'reading' && 'reader-workspace max-w-[54rem]')}>
        {viewMode === 'reading' ? (
          <ReadingMode mode={viewMode} onModeChange={handleViewModeChange} onExit={closeDocumentViewer} />
        ) : (
        <div className="sticky top-2 z-30 sm:top-3">
          {config.toolbar && !config.readonly && canEdit && (
            <Toolbar
              api={api}
              className="min-w-0"
              trailingSections={[
                {
                  id: 'insert',
                  label: 'Insert',
                  content: (
                    <ToolbarDropdown
                      icon={Plus}
                      label="Insert"
                      triggerLabel="Insert"
                      disabled={!api}
                      items={[
                        { id: 'table', icon: Table2, label: 'Table', onSelect: () => { api?.insertTable() } },
                        { id: 'horizontal-rule', icon: Minus, label: 'Horizontal rule', onSelect: () => { api?.insertHorizontalRule() } },
                        { id: 'assets', icon: ImageIcon, label: 'Image or asset', onSelect: () => {
                          if (isAssetLibraryOpen) closeAssetLibrary()
                          else openAssetLibrary()
                        } },
                        { id: 'watermark', icon: Stamp, label: 'Watermark', onSelect: () => {
                          if (isWatermarkOpen) closeWatermark()
                          else openWatermark()
                        } },
                        ...(canBuildForms ? [{
                          id: 'form',
                          icon: ListChecks,
                          label: formFieldCount > 0 ? `Form fields (${formFieldCount})` : 'Form field',
                          onSelect: () => {
                            if (isFormBuilderOpen) closeFormBuilder()
                            else openFormBuilder()
                          },
                        }] : []),
                      ]}
                    />
                  ),
                },
                {
                  id: 'review',
                  label: 'Review',
                  content: <>
                  {canComment && <ReviewToolbarControl
                    isActive={isReviewMode}
                    onToggle={() => {
                      if (isReviewMode) closeReviewMode()
                      else openReviewMode()
                    }}
                  />}
                  {canTrackChanges && <SuggestionToolbar
                    isActive={isSuggestionMode}
                    onToggle={() => {
                      if (isSuggestionMode) closeSuggestionMode()
                      else openSuggestionMode()
                    }}
                  />}
                  {canRead && <ComparisonToolbarControl
                    isActive={isComparisonOpen}
                    onToggle={() => {
                      if (isComparisonOpen) closeComparison()
                      else openComparison()
                    }}
                  />}
                  {canRead && <HistoryToolbarControl
                    isOpen={isHistoryOpen}
                    versionCount={historyVersionCount}
                    onToggle={() => {
                      if (isHistoryOpen) closeHistory()
                      else openHistory()
                    }}
                  />}
                  </>,
                },
                {
                  id: 'ai',
                  label: 'AI',
                  content: <>
                  {config.ai && canUseAi && (
                    <button
                      ref={askDocumentButtonRef}
                      type="button"
                      aria-label={isAskDocumentOpen ? 'Close Ask Document' : 'Open Ask Document'}
                      aria-expanded={isAskDocumentOpen}
                      aria-controls="ask-document-panel"
                      title={isAskDocumentOpen ? 'Close Ask Document' : 'Ask Document'}
                      onClick={() => {
                        if (isAskDocumentOpen) closeAskDocument()
                        else openAskDocument()
                      }}
                      className={cn(
                        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-[background-color,color,box-shadow,transform] duration-150 hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35',
                        isAskDocumentOpen ? 'bg-neutral-900 text-white shadow-sm hover:bg-neutral-800 hover:text-white' : 'text-neutral-500',
                      )}
                    >
                      <AskDocumentIcon width={16} height={16} strokeWidth={1.9} aria-hidden />
                    </button>
                  )}
                  {canUseAi && <WritingAssistantToolbarControl
                    isOpen={isWritingAssistantOpen}
                    score={writingAnalysis?.score}
                    onToggle={() => {
                      if (isWritingAssistantOpen) closeWritingAssistant()
                      else openWritingAssistant()
                    }}
                  />}
                  {productivityRegistry && canUseAi && (
                    <ProductivityToolbarControl
                      isOpen={isProductivityOpen}
                      onToggle={() => {
                        if (isProductivityOpen) closeProductivity()
                        else openProductivity()
                      }}
                    />
                  )}
                  {canSearch && <SearchToolbarControl
                    isOpen={isSearchOpen}
                    onToggle={() => {
                      if (isSearchOpen) closeSearch()
                      else openSearch()
                    }}
                  />}
                  {canRead && <ComplianceToolbarControl
                    isOpen={isComplianceOpen}
                    onToggle={() => {
                      if (isComplianceOpen) closeCompliance()
                      else openCompliance()
                    }}
                  />}
                  {canRead && <DocumentIntelligenceToolbarControl
                    isOpen={isIntelligenceOpen}
                    onToggle={() => {
                      if (isIntelligenceOpen) closeIntelligence()
                      else openIntelligence()
                    }}
                  />}
                  {canUseContractIntelligence && <ContractToolbarControl
                    isOpen={isContractOpen}
                    riskScore={contractAnalysis?.overallRiskScore}
                    onToggle={() => {
                      if (isContractOpen) closeContract()
                      else openContract()
                    }}
                  />}
                  </>,
                },
                {
                  id: 'document',
                  label: 'Document',
                  content: <>
                  <PageLayoutToolbarControl
                    isOpen={isPageLayoutOpen}
                    onToggle={() => {
                      if (isPageLayoutOpen) closePageLayout()
                      else openPageLayout()
                    }}
                  />
                  {canExport && <ExportToolbarControl
                    isOpen={isExportOpen}
                    onToggle={() => {
                      if (isExportOpen) closeExport()
                      else openExport()
                    }}
                  />}
                  {canUseWorkflow && <WorkflowToolbarControl
                    isOpen={isWorkflowOpen}
                    status={currentWorkflow?.status}
                    onToggle={() => {
                      if (isWorkflowOpen) closeWorkflow()
                      else openWorkflow()
                    }}
                  />}
                  {canRedact && <RedactionToolbarControl
                    isOpen={isRedactionOpen}
                    count={redactionRecords.filter((record) => record.decision === 'pending').length}
                    onToggle={() => {
                      if (isRedactionOpen) closeRedaction()
                      else openRedaction()
                    }}
                  />}
                  {canRead && <ViewSwitcher mode={viewMode} onChange={handleViewModeChange} compact />}
                  {canBuildForms && <ShareToolbarControl
                    isOpen={isShareOpen}
                    onToggle={() => {
                      if (isShareOpen) closeShare()
                      else openShare()
                    }}
                  />}
                  {config.commandPalette && canRead && (
                    <button
                      type="button"
                      aria-label="Open command palette"
                      aria-keyshortcuts={config.keyboardShortcuts ? 'Meta+K Control+K' : undefined}
                      title={config.keyboardShortcuts ? 'Command palette (Cmd/Ctrl + K)' : 'Command palette'}
                      onClick={() => setIsCommandPaletteOpen(true)}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-[background-color,color,transform] hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
                    >
                      <CommandPaletteIcon width={16} height={16} strokeWidth={1.9} aria-hidden />
                    </button>
                  )}
                  {identityManager && (
                    <button
                      ref={identityButtonRef}
                      type="button"
                      aria-label={isIdentityOpen ? 'Close identity settings' : 'Open identity settings'}
                      aria-expanded={isIdentityOpen}
                      aria-controls="identity-settings"
                      title="Identity & access"
                      onClick={() => {
                        if (isIdentityOpen) closeIdentity()
                        else openIdentity()
                      }}
                      className={cn(
                        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-[background-color,color,transform] hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35',
                        isIdentityOpen ? 'bg-indigo-50 text-indigo-700' : 'text-neutral-500',
                      )}
                    >
                      <ShieldCheck size={16} strokeWidth={1.9} aria-hidden />
                    </button>
                  )}
                  {config.collaboration && canRead && (
                    <PresenceBar
                      collaborators={collaboration.onlineCollaborators}
                      currentUser={config.collaboration.user}
                      connectionStatus={collaboration.connectionStatus}
                      syncStatus={collaboration.syncStatus}
                      activeEditor={collaboration.activeEditor}
                      workflow={currentWorkflow}
                      onReconnect={collaboration.reconnect}
                    />
                  )}
                  </>,
                },
              ]}
            />
          )}
        </div>
        )}
        <div className="relative mx-auto max-w-[52rem] pt-4 sm:pt-5">
          {pendingAsset && (
            <div className="absolute left-1/2 top-6 z-20 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-[var(--document-editor-shadow-overlay)]" role="status">
              <MousePointer2 size={14} strokeWidth={1.9} className="shrink-0" aria-hidden />
              <span className="truncate">Placing {pendingAsset.title}</span>
              <button
                type="button"
                onClick={cancelPlacement}
                aria-label="Cancel asset placement"
                className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-neutral-300 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <X size={12} strokeWidth={2.2} aria-hidden />
              </button>
            </div>
          )}
          {canRead ? <DocumentEditor
            editor={editor}
            className={viewMode === 'reading' ? 'reader-document-surface' : undefined}
            placementActive={viewMode === 'editor' && Boolean(pendingAsset)}
            onSurfaceClick={placePendingAsset}
            pageOverlay={
              <>
                <WatermarkLayer
                  watermark={watermark}
                  pages={watermarkPages}
                  currentPage={pagination.currentPage}
                />
                {viewMode !== 'reading' && (
                  <PageIndicator
                    layout={pageLayout}
                    pagination={pagination}
                    onRemoveBreak={removePageBreak}
                  />
                )}
              </>
            }
          /> : (
            <AccessDenied
              permission="document.read"
              reason="Your identity does not have access to this document."
            />
          )}
        </div>
      </div>
      <div className={cn('shrink-0 lg:sticky lg:top-6 lg:self-start', !isMobileSurfaceOpen && 'hidden')}>
        {isIdentityLoaded && identityManager && (
          <ErrorBoundary compact title="Identity settings need a retry">
            <Suspense fallback={<div className="fixed inset-y-0 right-0 z-50 flex w-full items-center justify-center border-l border-neutral-200 bg-white sm:max-w-[32rem] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[31rem] lg:rounded-lg lg:border" role="status" aria-label="Loading identity settings"><LoaderCircle size={20} strokeWidth={1.8} className="animate-spin text-neutral-400" aria-hidden /></div>}>
              <IdentitySettings
                isOpen={isIdentityOpen}
                manager={identityManager}
                onClose={closeIdentity}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        {isProductivityLoaded && productivityRegistry && (
          <ErrorBoundary compact title="AI productivity needs a retry">
            <Suspense fallback={<div className="fixed inset-y-0 right-0 z-50 flex w-full items-center justify-center border-l border-neutral-200 bg-white sm:max-w-[31rem] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[30rem] lg:rounded-lg lg:border" role="status" aria-label="Loading AI productivity"><LoaderCircle size={20} strokeWidth={1.8} className="animate-spin text-neutral-400" aria-hidden /></div>}>
              <ProductivitySidebar
                isOpen={isProductivityOpen}
                api={api}
                registry={productivityRegistry}
                onClose={closeProductivity}
                onApplyWriting={createWritingSuggestion}
                onCommentWriting={createWritingComment}
                onAudit={recordIdentityAudit}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        {isWritingAssistantLoaded && (
          <ErrorBoundary compact title="Writing assistant needs a retry">
            <Suspense fallback={<div className="fixed inset-y-0 right-0 z-40 flex w-full items-center justify-center border-l border-neutral-200 bg-white sm:max-w-[30rem] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[29rem] lg:rounded-lg lg:border" role="status" aria-label="Loading writing assistant"><LoaderCircle size={20} strokeWidth={1.8} className="animate-spin text-neutral-400" aria-hidden /></div>}>
              <WritingAssistantPanel
                isOpen={isWritingAssistantOpen}
                api={api}
                namespace={documentHistoryNamespace}
                author={currentAuthor}
                aiEndpoint={config.ai ? config.ai.writingEndpoint : undefined}
                events={events}
                onClose={closeWritingAssistant}
                onAnalysisChange={setWritingAnalysis}
                onApply={createWritingSuggestion}
                onComment={createWritingComment}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        {isContractLoaded && (
          <ErrorBoundary compact title="Contract intelligence needs a retry">
            <Suspense fallback={<div className="fixed inset-y-0 right-0 z-40 flex w-full items-center justify-center border-l border-neutral-200 bg-white sm:max-w-[32rem] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[31rem] lg:rounded-lg lg:border" role="status" aria-label="Loading contract intelligence"><LoaderCircle size={20} strokeWidth={1.8} className="animate-spin text-neutral-400" aria-hidden /></div>}>
              <ContractPanel
                isOpen={isContractOpen}
                api={api}
                namespace={documentHistoryNamespace}
                author={currentAuthor}
                playbook={config.contractPlaybook}
                complianceFindings={complianceReport?.findings ?? []}
                aiEndpoint={config.ai ? config.ai.contractEndpoint : undefined}
                onClose={closeContract}
                onAnalysisChange={setContractAnalysis}
                onAudit={recordIdentityAudit}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        {isRedactionLoaded && (
          <ErrorBoundary compact title="Redaction review needs a retry">
            <Suspense fallback={<div className="fixed inset-y-0 right-0 z-40 flex w-full items-center justify-center border-l border-neutral-200 bg-white sm:max-w-[30rem] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[29rem] lg:rounded-lg lg:border" role="status" aria-label="Loading redaction review"><LoaderCircle size={20} strokeWidth={1.8} className="animate-spin text-neutral-400" aria-hidden /></div>}>
              <RedactionPanel
                isOpen={isRedactionOpen}
                api={api}
                namespace={documentHistoryNamespace}
                author={currentAuthor}
                aiProvider={config.ai ? config.ai.redactionDetector : undefined}
                onClose={closeRedaction}
                onRecordsChange={setRedactionRecords}
                onAudit={recordIdentityAudit}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        {isSearchLoaded && (
          <ErrorBoundary compact title="Semantic search needs a retry">
            <Suspense fallback={<div className="fixed inset-y-0 right-0 z-40 flex w-full items-center justify-center border-l border-neutral-200 bg-white sm:max-w-[31rem] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[30rem] lg:rounded-lg lg:border" role="status" aria-label="Loading semantic search"><LoaderCircle size={20} strokeWidth={1.8} className="animate-spin text-neutral-400" aria-hidden /></div>}>
              <SearchPanel
                isOpen={isSearchOpen}
                api={api}
                namespace={documentHistoryNamespace}
                knowledgeSources={searchKnowledgeSources}
                workflow={currentWorkflow}
                complianceFindings={complianceReport?.findings ?? []}
                aiEnabled={Boolean(config.ai)}
                events={events}
                onClose={closeSearch}
                onOpenDocument={openSearchDocument}
                onAddKnowledgeSource={addSearchKnowledgeSource}
                onAskAI={askAIAboutSearchResults}
                redactions={redactionRecords}
                contractAnalysis={contractAnalysis}
                writingAnalysis={writingAnalysis}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        {isWorkflowLoaded && (
          <ErrorBoundary compact title="Approval workflow needs a retry">
            <Suspense fallback={<div className="fixed inset-y-0 right-0 z-40 flex w-full items-center justify-center border-l border-neutral-200 bg-white sm:max-w-[30rem] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[29rem] lg:rounded-lg lg:border" role="status" aria-label="Loading approval workflow"><LoaderCircle size={20} strokeWidth={1.8} className="animate-spin text-neutral-400" aria-hidden /></div>}>
              <WorkflowPanel
                isOpen={isWorkflowOpen}
                api={api}
                author={currentAuthor}
                namespace={documentHistoryNamespace}
                unresolvedSuggestions={changes.filter((change) => change.status === 'pending').length}
                comments={comments}
                onClose={closeWorkflow}
                onChange={setCurrentWorkflow}
                contractAnalysis={contractAnalysis}
                canApprove={canApprove}
                onAudit={recordIdentityAudit}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        {isHistoryLoaded && (
          <ErrorBoundary compact title="Version history needs a retry">
            <Suspense fallback={<div className="fixed inset-y-0 right-0 z-40 flex w-full items-center justify-center border-l border-neutral-200 bg-white sm:max-w-[29rem] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[28rem] lg:rounded-lg lg:border" role="status" aria-label="Loading version history"><LoaderCircle size={20} strokeWidth={1.8} className="animate-spin text-neutral-400" aria-hidden /></div>}>
              <HistoryPanel
                isOpen={isHistoryOpen}
                api={api}
                author={currentAuthor}
                storageNamespace={documentHistoryNamespace}
                onClose={closeHistory}
                onCountChange={setHistoryVersionCount}
                onOpenComparison={(result) => {
                  openComparison(result)
                }}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        {isFormBuilderLoaded && (
          <ErrorBoundary compact title="Form builder needs a retry">
            <Suspense fallback={<div className="fixed inset-y-0 right-0 z-40 flex w-full items-center justify-center border-l border-neutral-200 bg-white sm:max-w-[28rem] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[27rem] lg:rounded-lg lg:border" role="status" aria-label="Loading form builder"><LoaderCircle size={20} strokeWidth={1.8} className="animate-spin text-neutral-400" aria-hidden /></div>}>
              <FormBuilderPanel
                isOpen={isFormBuilderOpen}
                api={api}
                currentPage={pagination.currentPage}
                onClose={closeFormBuilder}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        {isComplianceLoaded && (
          <ErrorBoundary compact title="Compliance analysis needs a retry">
            <Suspense
              fallback={
                <div className="fixed inset-y-0 right-0 z-40 flex w-full items-center justify-center border-l border-neutral-200 bg-white sm:max-w-[27rem] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[26rem] lg:rounded-lg lg:border" role="status" aria-label="Loading compliance analysis">
                  <LoaderCircle size={20} strokeWidth={1.8} className="animate-spin text-neutral-400" aria-hidden />
                </div>
              }
            >
              <CompliancePanel
                isOpen={isComplianceOpen}
                api={api}
                aiEndpoint={config.ai ? config.ai.complianceEndpoint : undefined}
                events={events}
                onClose={closeCompliance}
                onJump={jumpToComplianceFinding}
                onCreateComment={createComplianceComment}
                onCreateSuggestion={createComplianceSuggestion}
                onAskAI={askAboutComplianceFinding}
                onReportChange={setComplianceReport}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        <PageLayoutPanel
          isOpen={isPageLayoutOpen}
          layout={pageLayout}
          pagination={pagination}
          onLayoutChange={setPageLayout}
          onInsertBreak={insertPageBreak}
          onOpenPreview={() => handleViewModeChange('pdf-preview')}
          onClose={closePageLayout}
        />
        <WatermarkPanel
          isOpen={isWatermarkOpen}
          watermark={watermark}
          pageCount={pagination.pages.length}
          currentPage={pagination.currentPage}
          onAdd={addWatermark}
          onChange={updateWatermark}
          onRemove={removeWatermark}
          onClose={closeWatermark}
        />
        {isSuggestionLoaded && (
          <ErrorBoundary compact title="Suggestions need a retry">
            <Suspense
              fallback={
                <div
                  className="fixed inset-y-0 right-0 z-40 flex w-full items-center justify-center border-l border-neutral-200 bg-white sm:max-w-[26rem] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[25rem] lg:rounded-lg lg:border"
                  role="status"
                  aria-label="Loading suggestion sidebar"
                >
                  <LoaderCircle size={20} strokeWidth={1.8} className="animate-spin text-neutral-400" aria-hidden />
                </div>
              }
            >
              <SuggestionSidebar
                isOpen={isSuggestionSidebarOpen}
                changes={changes}
                selectedChangeId={selectedChangeId}
                currentAuthorId={currentAuthor.id}
                onClose={hideSuggestionSidebar}
                onSelectChange={setSelectedChangeId}
                onAccept={acceptTrackChange}
                onReject={rejectTrackChange}
                onAcceptAll={acceptAllTrackChanges}
                onRejectAll={rejectAllTrackChanges}
                onJump={jumpToChange}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        {isReviewLoaded && (
          <ErrorBoundary compact title="Review needs a retry">
            <Suspense
              fallback={
                <div
                  className="fixed inset-y-0 right-0 z-40 flex w-full items-center justify-center border-l border-neutral-200 bg-white sm:max-w-[25rem] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[24rem] lg:rounded-lg lg:border"
                  role="status"
                  aria-label="Loading review sidebar"
                >
                  <LoaderCircle size={20} strokeWidth={1.8} className="animate-spin text-neutral-400" aria-hidden />
                </div>
              }
            >
              <ReviewSidebar
                isOpen={isReviewMode}
                comments={comments}
                selectedCommentId={selectedCommentId}
                currentAuthorId={currentAuthor.id}
                onClose={closeReviewMode}
                onSelectComment={setSelectedCommentId}
                onReply={addReply}
                onResolve={setResolved}
                onEdit={editComment}
                onDelete={deleteComment}
                onJump={jumpToComment}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        {isAssetLibraryLoaded && (
          <ErrorBoundary compact title="Asset library needs a retry">
            <Suspense
              fallback={
                <div
                  className="fixed inset-y-0 right-0 z-40 flex w-full items-center justify-center border-l border-neutral-200 bg-white sm:max-w-[38rem] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[27rem] lg:rounded-lg lg:border xl:w-[30rem]"
                  role="status"
                  aria-label="Loading asset library"
                >
                  <LoaderCircle size={20} strokeWidth={1.8} className="animate-spin text-neutral-400" aria-hidden />
                </div>
              }
            >
              <AssetLibrary
                isOpen={isAssetLibraryOpen}
                recentAssetIds={recentAssetIds}
                onClose={closeAssetLibrary}
                onSelectAsset={selectAsset}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        {isAskDocumentLoaded && (
          <ErrorBoundary
            compact
            title="Ask Document needs a retry"
            description="The editor is still available while this panel recovers."
          >
            <Suspense
              fallback={
                <div
                  className="fixed inset-y-0 right-0 z-40 flex w-full items-center justify-center border-l border-neutral-200 bg-white sm:max-w-[24rem] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[23.5rem] lg:rounded-lg lg:border"
                  role="status"
                  aria-label="Loading Ask Document"
                >
                  <LoaderCircle
                    size={20}
                    strokeWidth={1.8}
                    className="animate-spin text-neutral-400"
                    aria-hidden
                  />
                </div>
              }
            >
              <AskDocumentPanel
                isOpen={isAskDocumentOpen}
                editorApi={api}
                getDocumentText={getDocumentText}
                commandRequest={askDocumentCommand}
                config={config}
                events={events}
                onSourcesChange={setSearchKnowledgeSources}
                onClose={closeAskDocument}
              />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>
      {viewMode === 'reading' && !isMobileSurfaceOpen && (
        <MobileToolbar
          mode={viewMode}
          aiEnabled={Boolean(config.ai && canUseAi)}
          productivityEnabled={Boolean(productivityRegistry && canUseAi)}
          identityEnabled={Boolean(identityManager)}
          shareEnabled={canBuildForms}
          onModeChange={handleViewModeChange}
          onAskAi={openAskDocument}
          onProductivity={openProductivity}
          onIdentity={openIdentity}
          onShare={openShare}
        />
      )}
      <GoogleSearchButton
        api={api}
        enabled={
          (viewMode === 'editor' || viewMode === 'reading') &&
          canRead &&
          !isShareOpen &&
          !isComparisonOpen &&
          !isExportOpen &&
          !isIntelligenceOpen &&
          !isProductivityOpen &&
          !isIdentityOpen
        }
      />
      {config.ai && canUseAi && canEdit && viewMode === 'editor' && !config.readonly && !isReviewMode && !isSuggestionMode && !isComplianceOpen && !isFormBuilderOpen && !isHistoryOpen && !isWorkflowOpen && !isSearchOpen && !isRedactionOpen && !isContractOpen && !isWritingAssistantOpen && !isProductivityOpen && !isIdentityOpen && !isShareOpen && (
        <ErrorBoundary compact title="Selection AI needs a retry">
          <SelectionAi
            api={api}
            endpoint={config.ai.selectionEndpoint}
            streaming={config.streaming}
            events={events}
          />
        </ErrorBoundary>
      )}
      {canComment && isReviewMode && !config.readonly && reviewSelection && !pendingComment && (
        <CommentToolbar
          bounds={reviewSelection.bounds}
          onComment={openComposer}
        />
      )}
      {canComment && isReviewMode && pendingComment && (
        <SelectionCommentComposer
          bounds={pendingComment.selection.bounds}
          quote={pendingComment.selection.text}
          onSubmit={saveComment}
          onCancel={closeComposer}
        />
      )}
      {isReviewMode && previewedComment && commentHighlightPreview && (
        <CommentHighlightPreview
          comment={previewedComment}
          bounds={commentHighlightPreview.bounds}
        />
      )}
      {canTrackChanges && isSuggestionMode && previewedChange && suggestionPreview && (
        <SuggestionPreview
          change={previewedChange}
          bounds={suggestionPreview.bounds}
        />
      )}
      {canTrackChanges && isSuggestionMode && !isSuggestionSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSuggestionSidebarOpen(true)}
          aria-label={`Open suggestions, ${pendingTrackChangeCount} pending`}
          className="fixed bottom-4 right-4 z-40 inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-xs font-semibold text-emerald-800 shadow-[var(--document-editor-shadow-overlay)] transition-[background-color,box-shadow,transform] hover:-translate-y-px hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35 focus-visible:ring-offset-2"
        >
          <FilePenLine size={16} strokeWidth={1.9} aria-hidden />
          Suggestions
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] tabular-nums">
            {pendingTrackChangeCount}
          </span>
        </button>
      )}
      {isComparisonOpen && (
        <ErrorBoundary compact title="Comparison needs a retry">
          <Suspense
            fallback={
              <div
                className="fixed inset-0 z-[80] flex items-center justify-center bg-[#f6f6f4]"
                role="status"
                aria-label="Loading document comparison"
              >
                <LoaderCircle size={22} strokeWidth={1.8} className="animate-spin text-neutral-400" aria-hidden />
              </div>
            }
          >
            <ComparisonWorkspace
              initialDocument={comparisonInitialDocument}
              initialLeftDocument={comparisonInitialLeft}
              initialRightDocument={comparisonInitialRight}
              onClose={closeComparison}
            />
          </Suspense>
        </ErrorBoundary>
      )}
      {isExportLoaded && (
        <ErrorBoundary compact title="Export needs a retry">
          <Suspense
            fallback={
              isExportOpen ? (
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/35 backdrop-blur-[2px]"
                  role="status"
                  aria-label="Loading export tools"
                >
                  <LoaderCircle size={22} strokeWidth={1.8} className="animate-spin text-white" aria-hidden />
                </div>
              ) : null
            }
          >
            <ExportDialog
              isOpen={isExportOpen}
              api={api}
              layout={pageLayout}
              pagination={pagination}
              watermark={watermark}
              comments={comments}
              trackChanges={changes}
              workflow={currentWorkflow}
              redactions={redactionRecords}
              onClose={closeExport}
              onAudit={recordIdentityAudit}
            />
          </Suspense>
        </ErrorBoundary>
      )}
      {isIntelligenceLoaded && (
        <ErrorBoundary compact title="Document Intelligence needs a retry">
          <Suspense
            fallback={
              isIntelligenceOpen ? (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/35 backdrop-blur-[2px]" role="status" aria-label="Loading Document Intelligence">
                  <LoaderCircle size={22} strokeWidth={1.8} className="animate-spin text-white" aria-hidden />
                </div>
              ) : null
            }
          >
            <DocumentImportPanel
              isOpen={isIntelligenceOpen}
              api={api}
              canSaveSource={Boolean(config.ai && config.knowledgeSources)}
              onSaveSource={saveIntelligenceSource}
              onClose={closeIntelligence}
            />
          </Suspense>
        </ErrorBoundary>
      )}
      {viewMode === 'carousel' && (
        <ErrorBoundary compact title="Carousel view needs a retry">
          <Suspense fallback={<div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#e8e8e5]" role="status" aria-label="Loading carousel view"><LoaderCircle size={22} strokeWidth={1.8} className="animate-spin text-neutral-400" aria-hidden /></div>}>
            <CarouselView
              pages={viewerPages}
              layout={pageLayout}
              zoom={viewerZoom}
              onZoomIn={zoomViewerIn}
              onZoomOut={zoomViewerOut}
              onModeChange={handleViewModeChange}
              onClose={closeDocumentViewer}
            />
          </Suspense>
        </ErrorBoundary>
      )}
      {viewMode === 'book' && (
        <ErrorBoundary compact title="Book view needs a retry">
          <Suspense fallback={<div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#e8e8e5]" role="status" aria-label="Loading book view"><LoaderCircle size={22} strokeWidth={1.8} className="animate-spin text-neutral-400" aria-hidden /></div>}>
            <BookView
              pages={viewerPages}
              layout={pageLayout}
              zoom={viewerZoom}
              onZoomIn={zoomViewerIn}
              onZoomOut={zoomViewerOut}
              onModeChange={handleViewModeChange}
              onClose={closeDocumentViewer}
            />
          </Suspense>
        </ErrorBoundary>
      )}
      {isShareLoaded && (
        <ErrorBoundary compact title="Form sharing needs a retry">
          <Suspense fallback={isShareOpen ? <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/35" role="status" aria-label="Loading form sharing"><LoaderCircle size={22} strokeWidth={1.8} className="animate-spin text-white" aria-hidden /></div> : null}>
            <ShareDialog
              isOpen={isShareOpen}
              api={api}
              onArtifactCreated={registerShareArtifact}
              onClose={closeShare}
            />
          </Suspense>
        </ErrorBoundary>
      )}
      {isPrintPreviewOpen && api && (
        <ErrorBoundary compact title="Print preview needs a retry">
          <Suspense
            fallback={
              <div
                className="fixed inset-0 z-[90] flex items-center justify-center bg-[#e9e9e7]"
                role="status"
                aria-label="Loading print preview"
              >
                <LoaderCircle size={22} strokeWidth={1.8} className="animate-spin text-neutral-400" aria-hidden />
              </div>
            }
          >
            <PrintPreview
              api={api}
              documentText={api.getDocumentText()}
              layout={pageLayout}
              pagination={pagination}
              zoom={printZoom}
              watermark={watermark}
              onZoomChange={setPrintZoom}
              onClose={closeDocumentViewer}
            />
          </Suspense>
        </ErrorBoundary>
      )}
      {config.commandPalette && (
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          commands={availableCommands}
          onClose={() => setIsCommandPaletteOpen(false)}
          onSelect={runWorkspaceCommand}
        />
      )}
      {config.collaboration && canRead && (
        <>
          <SelectionLayer decorations={collaboratorDecorations} />
          <CursorLayer decorations={collaboratorDecorations} />
          <ConflictBanner conflict={collaboration.conflict} onDismiss={collaboration.dismissConflict} />
        </>
      )}
    </div>
  )
}
