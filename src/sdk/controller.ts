import type { EditorApi } from '../lib/editor-api'
import { resolveDocumentEditorConfig } from './config'
import { createDocumentEditorEvents, type InternalDocumentEditorEvents } from './events'
import type {
  DocumentEditorConfig,
  DocumentEditorController,
  ResolvedDocumentEditorConfig,
} from './types'
import { createIdentityManager } from '../identity/services/identityManager'

interface ControllerInternals {
  api: EditorApi | null
  events: InternalDocumentEditorEvents
  config: ResolvedDocumentEditorConfig
  removeIdentityAuditListener?: () => void
}

const CONTROLLERS = new WeakMap<DocumentEditorController, ControllerInternals>()

export function createEditor(
  config: DocumentEditorConfig = {},
): DocumentEditorController {
  const resolved = resolveDocumentEditorConfig(config)
  const events = createDocumentEditorEvents(resolved.callbacks)
  const identity = resolved.identity
    ? createIdentityManager(resolved.identity)
    : null
  const removeIdentityAuditListener = identity?.subscribeAudit(() => {
    const event = identity.getAuditEvents()[0]
    if (event) events.emit('identityAudit', event)
  })
  const internals: ControllerInternals = {
    api: null,
    events,
    config: resolved,
    removeIdentityAuditListener,
  }
  const controller: DocumentEditorController = Object.freeze({
    config: resolved,
    events,
    identity,
    getEditorApi: () => internals.api,
  })
  CONTROLLERS.set(controller, internals)
  return controller
}

/** @internal */
export function getControllerInternals(
  controller: DocumentEditorController,
): ControllerInternals {
  const internals = CONTROLLERS.get(controller)
  if (!internals) {
    throw new Error(
      '[DocumentEditor] The supplied controller was not created by createEditor().',
    )
  }
  return internals
}
