import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Command, FilePenLine, LoaderCircle, MessageSquareText, MousePointer2, X } from 'lucide-react'
import { AssetToolbarControl } from '../../assets/components/AssetToolbarControl'
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
  normalizeSubmissionValues,
} from '../../viewer/services/shareEngine'
import type { DocumentViewMode } from '../../viewer/types/viewer'
import { ComparisonToolbarControl } from '../../comparison/components/ComparisonToolbar'
import { ExportToolbarControl } from '../../export/components/ExportToolbarControl'
import { FormBuilderToolbarControl } from '../../forms/components/FormBuilderToolbarControl'
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
import {
  WatermarkPanel,
  WatermarkToolbarControl,
} from '../../watermark/components/WatermarkPanel'
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
import { cn } from '../../lib/cn'
import type { EditorApi } from '../../lib/editor-api'
import type { InternalDocumentEditorEvents } from '../../sdk/events'
import type { ResolvedDocumentEditorConfig } from '../../sdk/types'
import {
  CommandPalette,
  type WorkspaceCommandId,
} from '../CommandPalette/CommandPalette'
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary'
import { Toolbar } from '../Toolbar'
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
  onApiChange: (api: EditorApi | null) => void
}

export function EditorWorkspace({
  config,
  events,
  onApiChange,
}: EditorWorkspaceProps) {
  const editor = useDocumentEditor({
    placeholder: config.placeholder,
    content: config.initialContent,
    editable: !config.readonly,
  })
  const api = useEditorApi(editor)
  const [isAskDocumentOpen, setIsAskDocumentOpen] = useState(false)
  const [isAskDocumentLoaded, setIsAskDocumentLoaded] = useState(false)
  const [isAssetLibraryOpen, setIsAssetLibraryOpen] = useState(false)
  const [isAssetLibraryLoaded, setIsAssetLibraryLoaded] = useState(false)
  const [recentAssetIds, setRecentAssetIds] = useState<string[]>([])
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [isReviewLoaded, setIsReviewLoaded] = useState(false)
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null)
  const [commentHighlightPreview, setCommentHighlightPreview] =
    useState<CommentHighlightPreviewState | null>(null)
  const [isSuggestionMode, setIsSuggestionMode] = useState(false)
  const [isSuggestionSidebarOpen, setIsSuggestionSidebarOpen] = useState(false)
  const [isSuggestionLoaded, setIsSuggestionLoaded] = useState(false)
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null)
  const [suggestionPreview, setSuggestionPreview] =
    useState<{ changeId: string; bounds: CommentHighlightPreviewState['bounds'] } | null>(null)
  const [isComparisonOpen, setIsComparisonOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isExportLoaded, setIsExportLoaded] = useState(false)
  const [isIntelligenceOpen, setIsIntelligenceOpen] = useState(false)
  const [isIntelligenceLoaded, setIsIntelligenceLoaded] = useState(false)
  const [isComplianceOpen, setIsComplianceOpen] = useState(false)
  const [isComplianceLoaded, setIsComplianceLoaded] = useState(false)
  const [isFormBuilderOpen, setIsFormBuilderOpen] = useState(false)
  const [isFormBuilderLoaded, setIsFormBuilderLoaded] = useState(false)
  const [formFieldCount, setFormFieldCount] = useState(0)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false)
  const [historyVersionCount, setHistoryVersionCount] = useState(0)
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false)
  const [isWorkflowLoaded, setIsWorkflowLoaded] = useState(false)
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSearchLoaded, setIsSearchLoaded] = useState(false)
  const [isRedactionOpen, setIsRedactionOpen] = useState(false)
  const [isRedactionLoaded, setIsRedactionLoaded] = useState(false)
  const [redactionRecords, setRedactionRecords] = useState<RedactionRecord[]>([])
  const [isContractOpen, setIsContractOpen] = useState(false)
  const [isContractLoaded, setIsContractLoaded] = useState(false)
  const [contractAnalysis, setContractAnalysis] = useState<ContractAnalysis | null>(null)
  const [isWritingAssistantOpen, setIsWritingAssistantOpen] = useState(false)
  const [isWritingAssistantLoaded, setIsWritingAssistantLoaded] = useState(false)
  const [writingAnalysis, setWritingAnalysis] = useState<WritingAnalysis | null>(null)
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
  const validShareIdsRef = useRef<string[]>([])
  const lastDocumentTextRef = useRef<string | null>(null)
  const lastSelectionRef = useRef<string | null>(null)
  const AskDocumentIcon = config.theme.icons.askDocument ?? MessageSquareText
  const CommandPaletteIcon = config.theme.icons.commandPalette ?? Command
  const availableCommands: WorkspaceCommandId[] = [
    ...(config.ai ? (['ask-ai', 'toggle-sidebar'] as const) : []),
    ...(config.ai && !config.readonly ? (['insert-last-response'] as const) : []),
    ...(config.ai && config.knowledgeSources ? (['upload-source'] as const) : []),
    ...(config.ai && config.knowledgeSources && config.preview
      ? (['open-preview'] as const)
      : []),
    'focus-editor',
  ]
  const documentHistoryNamespace = useMemo(
    () => historyNamespace(JSON.stringify(config.initialContent ?? 'document')),
    [config.initialContent],
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
  } = useComments(api, config.collaboration ? config.collaboration.user : undefined)
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
      setIsReviewMode(true)
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
      setIsSuggestionMode(true)
      setIsSuggestionSidebarOpen(true)
    })
  }, [api, isSuggestionMode])

  const openAskDocument = useCallback(() => {
    setIsFormBuilderOpen(false)
    setIsComplianceOpen(false)
    setIsComparisonOpen(false)
    setIsPageLayoutOpen(false)
    setIsWatermarkOpen(false)
    setIsAssetLibraryOpen(false)
    setIsReviewMode(false)
    setIsSuggestionMode(false)
    setIsSuggestionSidebarOpen(false)
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    setIsAskDocumentLoaded(true)
    setIsAskDocumentOpen(true)
  }, [setIsPageLayoutOpen, setIsWatermarkOpen])

  const closeAskDocument = useCallback(() => {
    setIsAskDocumentOpen(false)
    window.requestAnimationFrame(() => askDocumentButtonRef.current?.focus())
  }, [])

  const openAssetLibrary = useCallback(() => {
    setIsFormBuilderOpen(false)
    setIsComplianceOpen(false)
    setIsComparisonOpen(false)
    setIsPageLayoutOpen(false)
    setIsWatermarkOpen(false)
    setIsAskDocumentOpen(false)
    setIsReviewMode(false)
    setIsSuggestionMode(false)
    setIsSuggestionSidebarOpen(false)
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    setIsAssetLibraryLoaded(true)
    setIsAssetLibraryOpen(true)
  }, [setIsPageLayoutOpen, setIsWatermarkOpen])

  const openReviewMode = useCallback(() => {
    setIsFormBuilderOpen(false)
    setIsComplianceOpen(false)
    setIsComparisonOpen(false)
    setIsPageLayoutOpen(false)
    setIsWatermarkOpen(false)
    setIsAskDocumentOpen(false)
    setIsAssetLibraryOpen(false)
    setIsSuggestionMode(false)
    setIsSuggestionSidebarOpen(false)
    setSuggestionPreview(null)
    cancelPlacement()
    setIsReviewLoaded(true)
    setIsReviewMode(true)
  }, [cancelPlacement, setIsPageLayoutOpen, setIsWatermarkOpen])

  const closeReviewMode = useCallback(() => {
    setIsReviewMode(false)
    setCommentHighlightPreview(null)
    closeComposer()
    window.requestAnimationFrame(() => {
      document.getElementById('review-mode-trigger')?.focus()
    })
  }, [closeComposer])

  const openSuggestionMode = useCallback(() => {
    setIsFormBuilderOpen(false)
    setIsComplianceOpen(false)
    setIsComparisonOpen(false)
    setIsPageLayoutOpen(false)
    setIsWatermarkOpen(false)
    setIsAskDocumentOpen(false)
    setIsAssetLibraryOpen(false)
    setIsReviewMode(false)
    setCommentHighlightPreview(null)
    closeComposer()
    cancelPlacement()
    setIsSuggestionLoaded(true)
    setIsSuggestionMode(true)
    setIsSuggestionSidebarOpen(true)
  }, [cancelPlacement, closeComposer, setIsPageLayoutOpen, setIsWatermarkOpen])

  const closeSuggestionMode = useCallback(() => {
    setIsSuggestionMode(false)
    setIsSuggestionSidebarOpen(false)
    setSuggestionPreview(null)
    window.requestAnimationFrame(() => {
      document.getElementById('suggestion-mode-trigger')?.focus()
    })
  }, [])

  const openComparison = useCallback((seed?: DocumentComparison) => {
    setIsFormBuilderOpen(false)
    setIsComplianceOpen(false)
    setIsAskDocumentOpen(false)
    setIsAssetLibraryOpen(false)
    setIsReviewMode(false)
    setIsSuggestionMode(false)
    setIsSuggestionSidebarOpen(false)
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    setIsPageLayoutOpen(false)
    setIsWatermarkOpen(false)
    closeComposer()
    cancelPlacement()
    setComparisonInitialDocument(api?.getDocumentText() ?? '')
    setComparisonInitialLeft(seed?.leftDocument)
    setComparisonInitialRight(seed?.rightDocument)
    setIsComparisonOpen(true)
  }, [api, cancelPlacement, closeComposer, setIsPageLayoutOpen, setIsWatermarkOpen])

  const closeComparison = useCallback(() => {
    setIsComparisonOpen(false)
    window.requestAnimationFrame(() => {
      document.getElementById('comparison-trigger')?.focus()
    })
  }, [])

  const openPageLayout = useCallback(() => {
    setIsFormBuilderOpen(false)
    setIsComplianceOpen(false)
    setIsAskDocumentOpen(false)
    setIsAssetLibraryOpen(false)
    setIsReviewMode(false)
    setIsSuggestionMode(false)
    setIsSuggestionSidebarOpen(false)
    setIsComparisonOpen(false)
    setIsWatermarkOpen(false)
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
    setIsPageLayoutOpen(true)
  }, [cancelPlacement, closeComposer, setIsPageLayoutOpen, setIsWatermarkOpen])

  const closePageLayout = useCallback(() => {
    setIsPageLayoutOpen(false)
    window.requestAnimationFrame(() => {
      document.getElementById('page-layout-trigger')?.focus()
    })
  }, [setIsPageLayoutOpen])

  const openWatermark = useCallback(() => {
    setIsFormBuilderOpen(false)
    setIsComplianceOpen(false)
    setIsAskDocumentOpen(false)
    setIsAssetLibraryOpen(false)
    setIsReviewMode(false)
    setIsSuggestionMode(false)
    setIsSuggestionSidebarOpen(false)
    setIsComparisonOpen(false)
    setIsPageLayoutOpen(false)
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
    setIsWatermarkOpen(true)
  }, [cancelPlacement, closeComposer, setIsPageLayoutOpen, setIsWatermarkOpen])

  const closeWatermark = useCallback(() => {
    setIsWatermarkOpen(false)
    window.requestAnimationFrame(() => {
      document.getElementById('watermark-trigger')?.focus()
    })
  }, [setIsWatermarkOpen])

  const openExport = useCallback(() => {
    setIsFormBuilderOpen(false)
    setIsComplianceOpen(false)
    setIsAskDocumentOpen(false)
    setIsAssetLibraryOpen(false)
    setIsReviewMode(false)
    setIsSuggestionMode(false)
    setIsSuggestionSidebarOpen(false)
    setIsComparisonOpen(false)
    setIsPageLayoutOpen(false)
    setIsWatermarkOpen(false)
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
    setIsExportLoaded(true)
    setIsExportOpen(true)
  }, [cancelPlacement, closeComposer, setIsPageLayoutOpen, setIsWatermarkOpen])

  const closeExport = useCallback(() => {
    setIsExportOpen(false)
    window.requestAnimationFrame(() => {
      document.getElementById('export-trigger')?.focus()
    })
  }, [])

  const openIntelligence = useCallback(() => {
    setIsFormBuilderOpen(false)
    setIsComplianceOpen(false)
    setIsAskDocumentOpen(false)
    setIsAssetLibraryOpen(false)
    setIsReviewMode(false)
    setIsSuggestionMode(false)
    setIsSuggestionSidebarOpen(false)
    setIsComparisonOpen(false)
    setIsPageLayoutOpen(false)
    setIsWatermarkOpen(false)
    setIsExportOpen(false)
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
    setIsIntelligenceLoaded(true)
    setIsIntelligenceOpen(true)
  }, [cancelPlacement, closeComposer, setIsPageLayoutOpen, setIsWatermarkOpen])

  const closeIntelligence = useCallback(() => {
    setIsIntelligenceOpen(false)
    window.requestAnimationFrame(() => {
      document.getElementById('document-intelligence-trigger')?.focus()
    })
  }, [])

  const openCompliance = useCallback(() => {
    setIsFormBuilderOpen(false)
    setIsAskDocumentOpen(false)
    setIsAssetLibraryOpen(false)
    setIsReviewMode(false)
    setIsSuggestionMode(false)
    setIsSuggestionSidebarOpen(false)
    setIsComparisonOpen(false)
    setIsPageLayoutOpen(false)
    setIsWatermarkOpen(false)
    setIsExportOpen(false)
    setIsIntelligenceOpen(false)
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
    setIsComplianceLoaded(true)
    setIsComplianceOpen(true)
  }, [cancelPlacement, closeComposer, setIsPageLayoutOpen, setIsWatermarkOpen])

  const closeCompliance = useCallback(() => {
    setIsComplianceOpen(false)
    window.requestAnimationFrame(() => {
      document.getElementById('compliance-trigger')?.focus()
    })
  }, [])

  const openFormBuilder = useCallback(() => {
    setIsAskDocumentOpen(false)
    setIsAssetLibraryOpen(false)
    setIsReviewMode(false)
    setIsSuggestionMode(false)
    setIsSuggestionSidebarOpen(false)
    setIsComparisonOpen(false)
    setIsPageLayoutOpen(false)
    setIsWatermarkOpen(false)
    setIsExportOpen(false)
    setIsIntelligenceOpen(false)
    setIsComplianceOpen(false)
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
    setIsFormBuilderLoaded(true)
    setIsFormBuilderOpen(true)
  }, [cancelPlacement, closeComposer, setIsPageLayoutOpen, setIsWatermarkOpen])

  const closeFormBuilder = useCallback(() => {
    setIsFormBuilderOpen(false)
    window.requestAnimationFrame(() => {
      document.getElementById('form-builder-trigger')?.focus()
    })
  }, [])

  const openHistory = useCallback(() => {
    setIsAskDocumentOpen(false)
    setIsAssetLibraryOpen(false)
    setIsReviewMode(false)
    setIsSuggestionMode(false)
    setIsSuggestionSidebarOpen(false)
    setIsComparisonOpen(false)
    setIsPageLayoutOpen(false)
    setIsWatermarkOpen(false)
    setIsExportOpen(false)
    setIsIntelligenceOpen(false)
    setIsComplianceOpen(false)
    setIsFormBuilderOpen(false)
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
    setIsHistoryLoaded(true)
    setIsHistoryOpen(true)
  }, [cancelPlacement, closeComposer, setIsPageLayoutOpen, setIsWatermarkOpen])

  const closeHistory = useCallback(() => {
    setIsHistoryOpen(false)
    window.requestAnimationFrame(() => {
      document.getElementById('history-trigger')?.focus()
    })
  }, [])

  const openWorkflow = useCallback(() => {
    setIsAskDocumentOpen(false)
    setIsAssetLibraryOpen(false)
    setIsReviewMode(false)
    setIsSuggestionMode(false)
    setIsSuggestionSidebarOpen(false)
    setIsComparisonOpen(false)
    setIsPageLayoutOpen(false)
    setIsWatermarkOpen(false)
    setIsExportOpen(false)
    setIsIntelligenceOpen(false)
    setIsComplianceOpen(false)
    setIsFormBuilderOpen(false)
    setIsHistoryOpen(false)
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
    setIsWorkflowLoaded(true)
    setIsWorkflowOpen(true)
  }, [cancelPlacement, closeComposer, setIsPageLayoutOpen, setIsWatermarkOpen])

  const closeWorkflow = useCallback(() => {
    setIsWorkflowOpen(false)
    window.requestAnimationFrame(() => document.getElementById('workflow-trigger')?.focus())
  }, [])

  const openSearch = useCallback(() => {
    setIsAskDocumentOpen(false)
    setIsAssetLibraryOpen(false)
    setIsReviewMode(false)
    setIsSuggestionMode(false)
    setIsSuggestionSidebarOpen(false)
    setIsComparisonOpen(false)
    setIsPageLayoutOpen(false)
    setIsWatermarkOpen(false)
    setIsExportOpen(false)
    setIsIntelligenceOpen(false)
    setIsComplianceOpen(false)
    setIsFormBuilderOpen(false)
    setIsHistoryOpen(false)
    setIsWorkflowOpen(false)
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
    setIsSearchLoaded(true)
    setIsSearchOpen(true)
  }, [cancelPlacement, closeComposer, setIsPageLayoutOpen, setIsWatermarkOpen])

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
    window.requestAnimationFrame(() => document.getElementById('semantic-search-trigger')?.focus())
  }, [])

  const openRedaction = useCallback(() => {
    setIsAskDocumentOpen(false)
    setIsAssetLibraryOpen(false)
    setIsReviewMode(false)
    setIsSuggestionMode(false)
    setIsSuggestionSidebarOpen(false)
    setIsComparisonOpen(false)
    setIsPageLayoutOpen(false)
    setIsWatermarkOpen(false)
    setIsExportOpen(false)
    setIsIntelligenceOpen(false)
    setIsComplianceOpen(false)
    setIsFormBuilderOpen(false)
    setIsHistoryOpen(false)
    setIsWorkflowOpen(false)
    setIsSearchOpen(false)
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
    setIsRedactionLoaded(true)
    setIsRedactionOpen(true)
  }, [cancelPlacement, closeComposer, setIsPageLayoutOpen, setIsWatermarkOpen])

  const closeRedaction = useCallback(() => {
    setIsRedactionOpen(false)
    window.requestAnimationFrame(() => document.getElementById('redaction-trigger')?.focus())
  }, [])

  const openContract = useCallback(() => {
    setIsAskDocumentOpen(false)
    setIsAssetLibraryOpen(false)
    setIsReviewMode(false)
    setIsSuggestionMode(false)
    setIsSuggestionSidebarOpen(false)
    setIsComparisonOpen(false)
    setIsPageLayoutOpen(false)
    setIsWatermarkOpen(false)
    setIsExportOpen(false)
    setIsIntelligenceOpen(false)
    setIsComplianceOpen(false)
    setIsFormBuilderOpen(false)
    setIsHistoryOpen(false)
    setIsWorkflowOpen(false)
    setIsSearchOpen(false)
    setIsRedactionOpen(false)
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    closeComposer()
    setIsContractLoaded(true)
    setIsContractOpen(true)
  }, [cancelPlacement, closeComposer, setIsPageLayoutOpen, setIsWatermarkOpen])

  const closeContract = useCallback(() => {
    setIsContractOpen(false)
    window.requestAnimationFrame(() => document.getElementById('contract-trigger')?.focus())
  }, [])

  const openWritingAssistant = useCallback(() => {
    setIsAskDocumentOpen(false)
    setIsAssetLibraryOpen(false)
    setIsReviewMode(false)
    setIsSuggestionMode(false)
    setIsSuggestionSidebarOpen(false)
    setIsComparisonOpen(false)
    setIsPageLayoutOpen(false)
    setIsWatermarkOpen(false)
    setIsExportOpen(false)
    setIsIntelligenceOpen(false)
    setIsComplianceOpen(false)
    setIsFormBuilderOpen(false)
    setIsHistoryOpen(false)
    setIsWorkflowOpen(false)
    setIsSearchOpen(false)
    setIsRedactionOpen(false)
    setIsContractOpen(false)
    setCommentHighlightPreview(null)
    setSuggestionPreview(null)
    cancelPlacement()
    if (pendingComment) closeComposer()
    setIsWritingAssistantLoaded(true)
    setIsWritingAssistantOpen(true)
  }, [cancelPlacement, closeComposer, pendingComment, setIsPageLayoutOpen, setIsWatermarkOpen])

  const closeWritingAssistant = useCallback(() => {
    setIsWritingAssistantOpen(false)
    window.requestAnimationFrame(() => document.getElementById('writing-assistant-trigger')?.focus())
  }, [])

  useEffect(() => {
    if (
      isAskDocumentOpen || isAssetLibraryOpen || isReviewMode || isSuggestionMode ||
      isComparisonOpen || isPageLayoutOpen || isWatermarkOpen || isExportOpen ||
      isIntelligenceOpen || isComplianceOpen || isFormBuilderOpen || isHistoryOpen ||
      isWorkflowOpen || isSearchOpen || isRedactionOpen || isContractOpen
    ) setIsWritingAssistantOpen(false)
  }, [
    isAskDocumentOpen, isAssetLibraryOpen, isReviewMode, isSuggestionMode,
    isComparisonOpen, isPageLayoutOpen, isWatermarkOpen, isExportOpen,
    isIntelligenceOpen, isComplianceOpen, isFormBuilderOpen, isHistoryOpen,
    isWorkflowOpen, isSearchOpen, isRedactionOpen, isContractOpen,
  ])

  useEffect(() => {
    if (
      isAskDocumentOpen || isAssetLibraryOpen || isReviewMode || isSuggestionMode ||
      isComparisonOpen || isPageLayoutOpen || isWatermarkOpen || isExportOpen ||
      isIntelligenceOpen || isComplianceOpen || isFormBuilderOpen || isHistoryOpen ||
      isWorkflowOpen || isSearchOpen || isRedactionOpen
    ) setIsContractOpen(false)
  }, [
    isAskDocumentOpen, isAssetLibraryOpen, isReviewMode, isSuggestionMode,
    isComparisonOpen, isPageLayoutOpen, isWatermarkOpen, isExportOpen,
    isIntelligenceOpen, isComplianceOpen, isFormBuilderOpen, isHistoryOpen,
    isWorkflowOpen, isSearchOpen, isRedactionOpen,
  ])

  useEffect(() => {
    if (
      isAskDocumentOpen || isAssetLibraryOpen || isReviewMode ||
      isSuggestionMode || isComparisonOpen || isPageLayoutOpen ||
      isWatermarkOpen || isExportOpen || isIntelligenceOpen ||
      isComplianceOpen || isFormBuilderOpen || isHistoryOpen || isWorkflowOpen || isRedactionOpen
    ) setIsSearchOpen(false)
  }, [
    isAskDocumentOpen, isAssetLibraryOpen, isReviewMode, isSuggestionMode,
    isComparisonOpen, isPageLayoutOpen, isWatermarkOpen, isExportOpen,
    isIntelligenceOpen, isComplianceOpen, isFormBuilderOpen, isHistoryOpen,
    isWorkflowOpen, isRedactionOpen,
  ])

  useEffect(() => {
    if (
      isAskDocumentOpen || isAssetLibraryOpen || isReviewMode ||
      isSuggestionMode || isComparisonOpen || isPageLayoutOpen ||
      isWatermarkOpen || isExportOpen || isIntelligenceOpen ||
      isComplianceOpen || isFormBuilderOpen || isWorkflowOpen || isRedactionOpen
    ) setIsHistoryOpen(false)
  }, [
    isAskDocumentOpen,
    isAssetLibraryOpen,
    isReviewMode,
    isSuggestionMode,
    isComparisonOpen,
    isPageLayoutOpen,
    isWatermarkOpen,
    isExportOpen,
    isIntelligenceOpen,
    isComplianceOpen,
    isFormBuilderOpen,
    isWorkflowOpen, isRedactionOpen,
  ])

  useEffect(() => {
    if (
      isAskDocumentOpen || isAssetLibraryOpen || isReviewMode ||
      isSuggestionMode || isComparisonOpen || isPageLayoutOpen ||
      isWatermarkOpen || isExportOpen || isIntelligenceOpen ||
      isComplianceOpen || isFormBuilderOpen || isHistoryOpen || isRedactionOpen
    ) setIsWorkflowOpen(false)
  }, [
    isAskDocumentOpen, isAssetLibraryOpen, isReviewMode, isSuggestionMode,
    isComparisonOpen, isPageLayoutOpen, isWatermarkOpen, isExportOpen,
    isIntelligenceOpen, isComplianceOpen, isFormBuilderOpen, isHistoryOpen, isRedactionOpen,
  ])

  useEffect(() => {
    if (
      isAskDocumentOpen || isAssetLibraryOpen || isReviewMode ||
      isSuggestionMode || isComparisonOpen || isPageLayoutOpen ||
      isWatermarkOpen || isExportOpen || isIntelligenceOpen ||
      isComplianceOpen || isFormBuilderOpen || isHistoryOpen ||
      isWorkflowOpen || isSearchOpen
    ) setIsRedactionOpen(false)
  }, [
    isAskDocumentOpen, isAssetLibraryOpen, isReviewMode, isSuggestionMode,
    isComparisonOpen, isPageLayoutOpen, isWatermarkOpen, isExportOpen,
    isIntelligenceOpen, isComplianceOpen, isFormBuilderOpen, isHistoryOpen,
    isWorkflowOpen, isSearchOpen,
  ])

  const hideSuggestionSidebar = useCallback(() => {
    setIsSuggestionSidebarOpen(false)
    setSuggestionPreview(null)
    window.requestAnimationFrame(() => api?.focus())
  }, [api])

  const closeAssetLibrary = useCallback(() => {
    setIsAssetLibraryOpen(false)
    window.requestAnimationFrame(() => {
      document.getElementById('asset-library-trigger')?.focus()
    })
  }, [])

  const selectAsset = useCallback(
    (asset: Asset) => {
      beginPlacement(asset)
      setIsAssetLibraryOpen(false)
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
    setIsComplianceOpen(false)
    setIsReviewLoaded(true)
    setIsReviewMode(true)
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
    setIsComplianceOpen(false)
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
    setIsWritingAssistantOpen(false)
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
    setIsWritingAssistantOpen(false)
    setIsReviewLoaded(true)
    setIsReviewMode(true)
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
    setIsIntelligenceOpen(false)
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
      setIsSearchOpen(false)
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

  const registerShareArtifact = useCallback((shareId: string) => {
    validShareIdsRef.current = [
      shareId,
      ...validShareIdsRef.current.filter((id) => id !== shareId),
    ].slice(0, 32)
  }, [])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!isFormSubmissionMessage(event.data)) return
      if (!validShareIdsRef.current.includes(event.data.payload.shareId)) return
      events.emit('formSubmit', {
        ...event.data.payload,
        values: normalizeSubmissionValues(event.data.payload.values),
      })
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [events])

  const handleViewModeChange = useCallback((nextMode: DocumentViewMode) => {
    setIsPrintPreviewOpen(nextMode === 'pdf-preview')
    selectViewMode(nextMode)
    if (nextMode === 'editor') return

    setIsAskDocumentOpen(false)
    setIsAssetLibraryOpen(false)
    setIsReviewMode(false)
    setIsSuggestionMode(false)
    setIsSuggestionSidebarOpen(false)
    setIsComparisonOpen(false)
    setIsPageLayoutOpen(false)
    setIsWatermarkOpen(false)
    setIsExportOpen(false)
    setIsIntelligenceOpen(false)
    setIsComplianceOpen(false)
    setIsFormBuilderOpen(false)
    setIsHistoryOpen(false)
    setIsWorkflowOpen(false)
    setIsSearchOpen(false)
    setIsRedactionOpen(false)
    setIsContractOpen(false)
    setIsWritingAssistantOpen(false)
    setIsShareOpen(false)
    cancelPlacement()
    if (pendingComment) closeComposer()
  }, [
    cancelPlacement,
    closeComposer,
    pendingComment,
    selectViewMode,
    setIsPageLayoutOpen,
    setIsPrintPreviewOpen,
    setIsWatermarkOpen,
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
      isContractOpen || isWritingAssistantOpen
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
    if (!config.keyboardShortcuts || !config.commandPalette) return

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
  }, [config.commandPalette, config.keyboardShortcuts])

  useEffect(() => {
    if (!config.keyboardShortcuts || config.readonly) return
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
    config.keyboardShortcuts,
    config.readonly,
    isSuggestionMode,
    openSuggestionMode,
  ])

  useEffect(() => {
    if (!config.keyboardShortcuts) return
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
  }, [closeSearch, config.keyboardShortcuts, isSearchOpen, openSearch])

  return (
    <div className="document-editor-workspace mx-auto flex w-full max-w-[84rem] items-start justify-center px-3 pb-20 pt-4 sm:px-6 sm:py-7 lg:px-8 lg:py-6">
      <div className={cn('min-w-0 w-full max-w-[48rem]', viewMode === 'reading' && 'reader-workspace max-w-[54rem]')}>
        {viewMode === 'reading' ? (
          <ReadingMode mode={viewMode} onModeChange={handleViewModeChange} onExit={closeDocumentViewer} />
        ) : (
        <div className="sticky top-3 z-30 flex items-start gap-2.5 sm:top-4">
          {config.toolbar && !config.readonly && (
            <Toolbar
              api={api}
              className="min-w-0"
              trailingContent={
                <>
                  <AssetToolbarControl
                    isOpen={isAssetLibraryOpen}
                    onToggle={() => {
                      if (isAssetLibraryOpen) closeAssetLibrary()
                      else openAssetLibrary()
                    }}
                  />
                  <ReviewToolbarControl
                    isActive={isReviewMode}
                    onToggle={() => {
                      if (isReviewMode) closeReviewMode()
                      else openReviewMode()
                    }}
                  />
                  <SuggestionToolbar
                    isActive={isSuggestionMode}
                    onToggle={() => {
                      if (isSuggestionMode) closeSuggestionMode()
                      else openSuggestionMode()
                    }}
                  />
                  <ComparisonToolbarControl
                    isActive={isComparisonOpen}
                    onToggle={() => {
                      if (isComparisonOpen) closeComparison()
                      else openComparison()
                    }}
                  />
                  <PageLayoutToolbarControl
                    isOpen={isPageLayoutOpen}
                    onToggle={() => {
                      if (isPageLayoutOpen) closePageLayout()
                      else openPageLayout()
                    }}
                  />
                  <WatermarkToolbarControl
                    isOpen={isWatermarkOpen}
                    hasWatermark={Boolean(watermark)}
                    onToggle={() => {
                      if (isWatermarkOpen) closeWatermark()
                      else openWatermark()
                    }}
                  />
                  <ExportToolbarControl
                    isOpen={isExportOpen}
                    onToggle={() => {
                      if (isExportOpen) closeExport()
                      else openExport()
                    }}
                  />
                  <DocumentIntelligenceToolbarControl
                    isOpen={isIntelligenceOpen}
                    onToggle={() => {
                      if (isIntelligenceOpen) closeIntelligence()
                      else openIntelligence()
                    }}
                  />
                  <ComplianceToolbarControl
                    isOpen={isComplianceOpen}
                    onToggle={() => {
                      if (isComplianceOpen) closeCompliance()
                      else openCompliance()
                    }}
                  />
                  <FormBuilderToolbarControl
                    isOpen={isFormBuilderOpen}
                    fieldCount={formFieldCount}
                    onToggle={() => {
                      if (isFormBuilderOpen) closeFormBuilder()
                      else openFormBuilder()
                    }}
                  />
                  <HistoryToolbarControl
                    isOpen={isHistoryOpen}
                    versionCount={historyVersionCount}
                    onToggle={() => {
                      if (isHistoryOpen) closeHistory()
                      else openHistory()
                    }}
                  />
                  <WorkflowToolbarControl
                    isOpen={isWorkflowOpen}
                    status={currentWorkflow?.status}
                    onToggle={() => {
                      if (isWorkflowOpen) closeWorkflow()
                      else openWorkflow()
                    }}
                  />
                  <SearchToolbarControl
                    isOpen={isSearchOpen}
                    onToggle={() => {
                      if (isSearchOpen) closeSearch()
                      else openSearch()
                    }}
                  />
                  <RedactionToolbarControl
                    isOpen={isRedactionOpen}
                    count={redactionRecords.filter((record) => record.decision === 'pending').length}
                    onToggle={() => {
                      if (isRedactionOpen) closeRedaction()
                      else openRedaction()
                    }}
                  />
                  <ContractToolbarControl
                    isOpen={isContractOpen}
                    riskScore={contractAnalysis?.overallRiskScore}
                    onToggle={() => {
                      if (isContractOpen) closeContract()
                      else openContract()
                    }}
                  />
                  <WritingAssistantToolbarControl
                    isOpen={isWritingAssistantOpen}
                    score={writingAnalysis?.score}
                    onToggle={() => {
                      if (isWritingAssistantOpen) closeWritingAssistant()
                      else openWritingAssistant()
                    }}
                  />
                </>
              }
            />
          )}
          <div className="hidden sm:block">
            <ViewSwitcher mode={viewMode} onChange={handleViewModeChange} />
          </div>
          <div className="hidden sm:block">
            <ShareToolbarControl
              isOpen={isShareOpen}
              onToggle={() => {
                if (isShareOpen) closeShare()
                else openShare()
              }}
            />
          </div>
          {config.commandPalette && (
            <button
              type="button"
              aria-label="Open command palette"
              aria-keyshortcuts={
                config.keyboardShortcuts ? 'Meta+K Control+K' : undefined
              }
              title={
                config.keyboardShortcuts
                  ? 'Command palette (Cmd/Ctrl + K)'
                  : 'Command palette'
              }
              onClick={() => setIsCommandPaletteOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white/90 text-neutral-500 shadow-[var(--document-editor-shadow-surface)] backdrop-blur-xl transition-[border-color,background-color,color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-neutral-300 hover:bg-white hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f6f4] active:translate-y-0"
            >
              <CommandPaletteIcon width={17} height={17} strokeWidth={1.9} aria-hidden />
            </button>
          )}
          {config.ai && (
            <button
              ref={askDocumentButtonRef}
              type="button"
              aria-label={
                isAskDocumentOpen ? 'Close Ask Document' : 'Open Ask Document'
              }
              aria-expanded={isAskDocumentOpen}
              aria-controls="ask-document-panel"
              title={isAskDocumentOpen ? 'Close Ask Document' : 'Ask Document'}
              onClick={() => {
                if (isAskDocumentOpen) closeAskDocument()
                else openAskDocument()
              }}
              className={cn(
                'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border shadow-[var(--document-editor-shadow-surface)] backdrop-blur-xl transition-[border-color,background-color,color,box-shadow,transform] duration-150 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f6f4] active:translate-y-0',
                isAskDocumentOpen
                  ? 'border-neutral-800 bg-neutral-900 text-white shadow-[var(--document-editor-shadow-overlay)] hover:bg-neutral-800'
                  : 'border-neutral-200 bg-white/90 text-neutral-500 hover:border-neutral-300 hover:bg-white hover:text-neutral-950',
              )}
            >
              <AskDocumentIcon
                width={18}
                height={18}
                strokeWidth={1.9}
                aria-hidden
              />
            </button>
          )}
          {config.collaboration && (
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
        </div>
        )}
        <div className="relative pt-3.5 sm:pt-4">
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
          <DocumentEditor
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
          />
        </div>
      </div>
      <div className="shrink-0 lg:sticky lg:top-6 lg:self-start">
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
                  setIsHistoryOpen(false)
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
      {(viewMode === 'editor' || viewMode === 'reading') && (
        <MobileToolbar
          mode={viewMode}
          aiEnabled={Boolean(config.ai)}
          onModeChange={handleViewModeChange}
          onAskAi={openAskDocument}
          onShare={openShare}
        />
      )}
      <GoogleSearchButton
        api={api}
        enabled={
          (viewMode === 'editor' || viewMode === 'reading') &&
          !isShareOpen &&
          !isComparisonOpen &&
          !isExportOpen &&
          !isIntelligenceOpen
        }
      />
      {config.ai && viewMode === 'editor' && !config.readonly && !isReviewMode && !isSuggestionMode && !isComplianceOpen && !isFormBuilderOpen && !isHistoryOpen && !isWorkflowOpen && !isSearchOpen && !isRedactionOpen && !isContractOpen && !isWritingAssistantOpen && !isShareOpen && (
        <ErrorBoundary compact title="Selection AI needs a retry">
          <SelectionAi
            api={api}
            endpoint={config.ai.selectionEndpoint}
            streaming={config.streaming}
            events={events}
          />
        </ErrorBoundary>
      )}
      {isReviewMode && !config.readonly && reviewSelection && !pendingComment && (
        <CommentToolbar
          bounds={reviewSelection.bounds}
          onComment={openComposer}
        />
      )}
      {isReviewMode && pendingComment && (
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
      {isSuggestionMode && previewedChange && suggestionPreview && (
        <SuggestionPreview
          change={previewedChange}
          bounds={suggestionPreview.bounds}
        />
      )}
      {isSuggestionMode && !isSuggestionSidebarOpen && (
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
      {config.collaboration && (
        <>
          <SelectionLayer decorations={collaboratorDecorations} />
          <CursorLayer decorations={collaboratorDecorations} />
          <ConflictBanner conflict={collaboration.conflict} onDismiss={collaboration.dismissConflict} />
        </>
      )}
    </div>
  )
}
