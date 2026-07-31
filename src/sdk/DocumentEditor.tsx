import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { EditorWorkspace } from '../components/EditorWorkspace/EditorWorkspace'
import { ErrorBoundary } from '../components/ErrorBoundary/ErrorBoundary'
import { cn } from '../lib/cn'
import { createEditor, getControllerInternals } from './controller'
import { createThemeVariables } from './theme'
import type {
  DocumentEditorController,
  DocumentEditorHandle,
  DocumentEditorProps,
} from './types'

export const DocumentEditor = forwardRef<DocumentEditorHandle, DocumentEditorProps>(
  function DocumentEditor({ config, controller, className, style }, ref) {
    const [activeController] = useState(() => controller ?? createEditor(config))
    const internals = getControllerInternals(activeController)
    const initialController = useRef(controller)
    const pluginCleanupsRef = useRef<Array<() => void>>([])
    const [api, setApi] = useState(activeController.getEditorApi())
    const handleApiChange = useCallback(
      (nextApi: ReturnType<DocumentEditorController['getEditorApi']>) => {
        if (internals.api === nextApi) return
        internals.api = nextApi
        setApi(nextApi)
      },
      [internals],
    )

    useEffect(() => {
      if (initialController.current !== controller) {
        console.warn(
          '[DocumentEditor] The controller is an initialization option. Remount the component to replace it.',
        )
      }
    }, [controller])

    useEffect(() => {
      pluginCleanupsRef.current = internals.config.plugins.flatMap((plugin) => {
        try {
          const cleanup = plugin.setup({
            config: internals.config,
            events: internals.events,
            getEditorApi: () => internals.api,
            warn: (message) => console.warn(`[DocumentEditor:${plugin.name}] ${message}`),
          })
          return typeof cleanup === 'function' ? [cleanup] : []
        } catch (cause) {
          internals.events.emit('error', {
            scope: 'plugin',
            message: `Plugin "${plugin.name}" failed during setup.`,
            cause,
          })
          return []
        }
      })

      return () => {
        for (const cleanup of pluginCleanupsRef.current.reverse()) {
          try {
            cleanup()
          } catch (cause) {
            internals.events.emit('error', {
              scope: 'plugin',
              message: 'A plugin failed during cleanup.',
              cause,
            })
          }
        }
        pluginCleanupsRef.current = []
      }
    }, [internals])

    useEffect(() => {
      if (api) internals.events.emit('ready', { api })
    }, [api, internals.events])

    useImperativeHandle(
      ref,
      () => ({
        config: activeController.config,
        events: activeController.events,
        identity: activeController.identity,
        getEditorApi: activeController.getEditorApi,
        focus: () => activeController.getEditorApi()?.focus(),
      }),
      [activeController],
    )

    return (
      <div
        data-document-editor-sdk=""
        data-animations={internals.config.animations ? 'enabled' : 'disabled'}
        className={cn('document-editor-sdk', className)}
        style={{ ...createThemeVariables(internals.config.theme), ...style }}
      >
        <ErrorBoundary>
          <EditorWorkspace
            config={internals.config}
            events={internals.events}
            identityManager={activeController.identity}
            onApiChange={handleApiChange}
          />
        </ErrorBoundary>
      </div>
    )
  },
)

export type { DocumentEditorController }
