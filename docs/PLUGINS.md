# Plugin Guide

Plugins attach integration behavior to one editor instance. They do not modify
Tiptap extensions, register UI, or create global services in version 1.0.

## Basic Plugin

```ts
import type { DocumentEditorPlugin } from '@techcodie/editor'

export const analyticsPlugin: DocumentEditorPlugin = {
  name: 'analytics',
  version: '1.0.0',
  setup({ events }) {
    const stopReady = events.on('ready', () => {
      analytics.track('editor_ready')
    })
    const stopInsert = events.on('insert', ({ target, sourceIds }) => {
      analytics.track('editor_ai_insert', {
        target,
        sourceCount: sourceIds.length,
      })
    })

    return () => {
      stopInsert()
      stopReady()
    }
  },
}
```

```tsx
<DocumentEditor config={{ plugins: [analyticsPlugin] }} />
```

## Plugin Context

`setup` receives:

- `config`: resolved, validated, read-only configuration
- `events`: typed instance event target
- `getEditorApi()`: current `EditorApi` or `null` before readiness
- `warn(message)`: namespaced developer warning

Subscribe to `ready` before requiring the API:

```ts
setup({ events, getEditorApi }) {
  return events.on('ready', () => {
    getEditorApi()?.focus()
  })
}
```

## Lifecycle

- Plugins initialize for the mounted SDK instance.
- Setup errors emit an SDK `error` event.
- Cleanup functions run in reverse setup order when the component unmounts.
- Plugin state should remain inside the plugin closure or host application.
- One plugin object may be used by multiple editors if its setup function does
  not store instance state on the shared object.

## Guidelines

- Use events for analytics, observability, persistence triggers, and host UI.
- Use `EditorApi` for intentional editor commands.
- Keep credentials and privileged provider logic on the host server.
- Avoid reading internal DOM structure or importing package internals.
- Return cleanup for timers, subscriptions, observers, and external clients.
- Prefix diagnostics with the plugin name.

## Future Plugin Categories

The v1.0 contract can support future host integrations for AI providers,
analytics, export, comments, spelling, and grammar. Extension registration,
plugin-provided editor UI, and provider replacement hooks are candidates for
v1.1+ and are not implied by the current setup contract.
