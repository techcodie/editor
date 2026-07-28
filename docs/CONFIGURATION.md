# Configuration, Events, and Theming

## Configuration

All options are optional and validated once during initialization.

| Option | Default | Description |
| --- | --- | --- |
| `initialContent` | `''` | HTML, text, or ProseMirror-compatible JSON |
| `placeholder` | `Start writing…` | Empty-document placeholder |
| `theme` | Default light tokens | Partial design-token overrides |
| `readonly` | `false` | Disables direct editing and mutation UI |
| `toolbar` | `true` | Shows the formatting toolbar |
| `voice` | `true` | Shows native speech-to-text input when supported |
| `ai` | `true` | Enables AI or supplies endpoint configuration |
| `knowledgeSources` | `true` | Shows local knowledge-source controls |
| `preview` | `true` | Enables source preview |
| `streaming` | `true` | Shows streamed deltas; false reveals the completed response |
| `animations` | `true` | Enables SDK motion unless the OS requests reduced motion |
| `keyboardShortcuts` | `true` | Enables SDK keyboard shortcuts |
| `commandPalette` | `true` | Shows the command palette control |
| `collaboration` | `false` | Enables collaboration or supplies room, user, and transport configuration |
| `callbacks` | `{}` | Typed lifecycle and interaction callbacks |
| `plugins` | `[]` | Instance-scoped plugins |

Invalid JavaScript values fall back to safe defaults and produce warnings
prefixed with `[DocumentEditor]`. TypeScript users receive compile-time
guidance. Unknown configuration keys are ignored with a warning.

Use the validator without creating an editor:

```ts
const { config, warnings } = validateDocumentEditorConfig(untrustedValue)
```

## Feature Examples

### Read-only document

```tsx
<DocumentEditor
  config={{
    initialContent: savedHtml,
    readonly: true,
    toolbar: false,
    ai: false,
    commandPalette: false,
  }}
/>
```

`readonly` prevents user editing and hides mutation UI. The host can still use
the intentional `EditorApi` for controlled programmatic operations.

### Custom AI endpoints

```ts
const config: DocumentEditorConfig = {
  ai: {
    askDocumentEndpoint: '/api/editor/ask',
    selectionEndpoint: '/api/editor/selection',
  },
}
```

The host should add authentication, authorization, rate limits, audit behavior,
and provider credentials at those server endpoints.

### Collaboration transport

```ts
import { createWebSocketTransport } from '@techcodie/editor'

const config: DocumentEditorConfig = {
  collaboration: {
    roomId: documentId,
    user: { id: user.id, name: user.name, color: user.color },
    transport: createWebSocketTransport({
      url: (roomId) => `wss://editor.example.com/rooms/${roomId}`,
    }),
  },
}
```

`collaboration: true` uses a local browser channel for demos and multiple-tab
development. Production hosts should provide authenticated identity and a
transport backed by their own WebSocket service.

## Events

Events are synchronous, typed, and scoped to one controller. Calling `on`
returns an unsubscribe function.

```ts
const stop = controller.events.on('previewOpen', ({ source }) => {
  analytics.track('editor_preview_open', { sourceType: source.type })
})

stop()
```

| Event | Callback | Payload purpose |
| --- | --- | --- |
| `ready` | `onReady` | `EditorApi` is available |
| `editorChange` | `onEditorChange` | Plain document text changed |
| `selectionChange` | `onSelectionChange` | Current text selection changed |
| `aiRequest` | `onAIRequest` | Ask Document or Selection AI started |
| `aiResponse` | `onAIResponse` | AI completed with content and timing |
| `insert` | `onInsert` | AI response was inserted |
| `knowledgeSourceAdded` | `onKnowledgeSourceAdded` | Source entered local workspace |
| `knowledgeSourceRemoved` | `onKnowledgeSourceRemoved` | Source left local workspace |
| `knowledgeSourceActivated` | `onKnowledgeSourceActivated` | Source context state changed |
| `previewOpen` | `onPreviewOpen` | Source preview opened |
| `previewClose` | `onPreviewClose` | Source preview closed |
| `collaborationStatus` | `onCollaborationStatus` | Connection or sync state changed |
| `collaboratorsChange` | `onCollaboratorsChange` | Live presence list changed |
| `error` | `onError` | Configuration, plugin, editor, AI, source, preview, or collaboration error |

Callbacks and `events.on` use the same event target. Throwing inside a
non-error handler emits an `error` event rather than breaking the editor.

## Theming

Theme values become CSS custom properties on the SDK root. Partial overrides
are merged with stable defaults.

```ts
theme: {
  colors: {
    background: '#f3f5f7',
    surface: '#ffffff',
    text: '#17202a',
    mutedText: '#64748b',
    border: '#d8dee5',
    accent: '#0f766e',
    selection: 'rgba(15, 118, 110, 0.2)',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    editorFontSize: '1rem',
  },
  spacing: {
    workspace: '1.5rem',
    panelGap: '1rem',
  },
  radius: {
    small: '0.25rem',
    medium: '0.375rem',
    large: '0.625rem',
  },
  animationDuration: '140ms',
  shadows: {
    surface: '0 12px 30px -24px rgba(15, 23, 42, 0.4)',
    overlay: '0 24px 70px -24px rgba(15, 23, 42, 0.5)',
  },
}
```

### Custom shell icons

```tsx
theme: {
  icons: {
    askDocument: CustomChatIcon,
    commandPalette: CustomCommandIcon,
  },
}
```

Icon components receive standard SVG props. Internal action icons remain
consistent SDK defaults in version 1.0.

### Direct CSS token overrides

Host styles may override tokens at the SDK root:

```css
.customer-editor {
  --document-editor-accent: #0f766e;
  --document-editor-radius-lg: 0.75rem;
  --document-editor-animation-duration: 120ms;
}
```

The SDK stylesheet scopes resets and component styles under
`.document-editor-sdk`. It does not set host `body`, `html`, or application-root
styles.
