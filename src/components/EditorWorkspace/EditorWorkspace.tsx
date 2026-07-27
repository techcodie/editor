import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Command, FilePenLine, LoaderCircle, MessageSquareText, MousePointer2, X } from 'lucide-react'
import { AssetToolbarControl } from '../../assets/components/AssetToolbarControl'
import { useAssetInsertion } from '../../assets/hooks/useAssetInsertion'
import type { Asset } from '../../assets/types/asset'
import { ComparisonToolbarControl } from '../../comparison/components/ComparisonToolbar'
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
  const [comparisonInitialDocument, setComparisonInitialDocument] = useState('')
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [askDocumentCommand, setAskDocumentCommand] =
    useState<AskDocumentCommandRequest | null>(null)
  const askDocumentButtonRef = useRef<HTMLButtonElement>(null)
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
    commentsById,
    currentAuthor,
    addComment,
    addReply,
    editComment,
    setResolved,
    deleteComment,
    jumpToComment,
  } = useComments(api)
  const {
    changes,
    changesById,
    decide: decideTrackChange,
    decideAll: decideAllTrackChanges,
    jumpToChange,
  } = useTrackChanges(api, currentAuthor)

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
    snapshot: pagination,
    insertPageBreak,
    removePageBreak,
  } = usePagination(api, pageLayout)
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

  const openComparison = useCallback(() => {
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
    setIsComparisonOpen(true)
  }, [api, cancelPlacement, closeComposer, setIsPageLayoutOpen, setIsWatermarkOpen])

  const closeComparison = useCallback(() => {
    setIsComparisonOpen(false)
    window.requestAnimationFrame(() => {
      document.getElementById('comparison-trigger')?.focus()
    })
  }, [])

  const openPageLayout = useCallback(() => {
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

  const requestAskDocumentCommand = useCallback(
    (command: AskDocumentCommandRequest['command']) => {
      openAskDocument()
      setAskDocumentCommand({ id: crypto.randomUUID(), command })
    },
    [openAskDocument],
  )

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

  return (
    <div className="document-editor-workspace mx-auto flex w-full max-w-[84rem] items-start justify-center px-3 py-4 sm:px-6 sm:py-7 lg:px-8 lg:py-6">
      <div className="min-w-0 w-full max-w-[48rem]">
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
                </>
              }
            />
          )}
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
        </div>
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
            placementActive={Boolean(pendingAsset)}
            onSurfaceClick={placePendingAsset}
            pageOverlay={
              <>
                <WatermarkLayer
                  watermark={watermark}
                  pages={watermarkPages}
                  currentPage={pagination.currentPage}
                />
                <PageIndicator
                  layout={pageLayout}
                  pagination={pagination}
                  onRemoveBreak={removePageBreak}
                />
              </>
            }
          />
        </div>
      </div>
      <div className="shrink-0 lg:sticky lg:top-6 lg:self-start">
        <PageLayoutPanel
          isOpen={isPageLayoutOpen}
          layout={pageLayout}
          pagination={pagination}
          onLayoutChange={setPageLayout}
          onInsertBreak={insertPageBreak}
          onOpenPreview={() => setIsPrintPreviewOpen(true)}
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
                onClose={closeAskDocument}
              />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>
      {config.ai && !config.readonly && !isReviewMode && !isSuggestionMode && (
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
              onClose={closeComparison}
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
              onClose={() => setIsPrintPreviewOpen(false)}
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
    </div>
  )
}
