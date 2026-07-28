import type {
  DocumentEditorCallbacks,
  DocumentEditorEventHandler,
  DocumentEditorEventMap,
  DocumentEditorEventName,
  DocumentEditorEvents,
} from './types'

export interface InternalDocumentEditorEvents extends DocumentEditorEvents {
  emit<Event extends DocumentEditorEventName>(
    event: Event,
    payload: DocumentEditorEventMap[Event],
  ): void
  clear(): void
}

const CALLBACK_EVENTS = {
  onReady: 'ready',
  onEditorChange: 'editorChange',
  onSelectionChange: 'selectionChange',
  onAIRequest: 'aiRequest',
  onAIResponse: 'aiResponse',
  onInsert: 'insert',
  onKnowledgeSourceAdded: 'knowledgeSourceAdded',
  onKnowledgeSourceRemoved: 'knowledgeSourceRemoved',
  onKnowledgeSourceActivated: 'knowledgeSourceActivated',
  onPreviewOpen: 'previewOpen',
  onPreviewClose: 'previewClose',
  onCollaborationStatus: 'collaborationStatus',
  onCollaboratorsChange: 'collaboratorsChange',
  onError: 'error',
} as const satisfies Record<keyof DocumentEditorCallbacks, DocumentEditorEventName>

export function createDocumentEditorEvents(
  callbacks: DocumentEditorCallbacks = {},
): InternalDocumentEditorEvents {
  const listeners = new Map<DocumentEditorEventName, Set<(payload: never) => void>>()

  const events: InternalDocumentEditorEvents = {
    on(event, handler) {
      const handlers = listeners.get(event) ?? new Set()
      handlers.add(handler as (payload: never) => void)
      listeners.set(event, handlers)
      return () => events.off(event, handler)
    },
    off(event, handler) {
      listeners.get(event)?.delete(handler as (payload: never) => void)
    },
    emit(event, payload) {
      for (const handler of listeners.get(event) ?? []) {
        try {
          handler(payload as never)
        } catch (cause) {
          if (event !== 'error') {
            events.emit('error', {
              scope: 'editor',
              message: `An event handler for "${event}" failed.`,
              cause,
            })
          }
        }
      }
    },
    clear() {
      listeners.clear()
    },
  }

  for (const [callbackName, event] of Object.entries(CALLBACK_EVENTS) as Array<
    [keyof DocumentEditorCallbacks, DocumentEditorEventName]
  >) {
    const callback = callbacks[callbackName] as
      | DocumentEditorEventHandler<typeof event>
      | undefined
    if (callback) events.on(event, callback)
  }

  return events
}
