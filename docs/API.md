# Architecture and Public API

## Architecture

The host application owns authentication, databases, persistence, uploads, AI
providers, and business rules. The SDK owns editing, rendering, commands,
interaction UI, and editor lifecycle.

```text
Host Application
        |
        v
DocumentEditor
        |
        v
EditorWorkspace
   |          |
Toolbar   Editor Surface
        |
        v
EditorApi
        |
        v
Tiptap / ProseMirror
```

UI components never call Tiptap directly. Formatting, selection, insertion,
focus, and document access cross the `EditorApi` boundary.

Each mounted SDK instance owns:

- One validated configuration
- One typed event target
- One editor instance and `EditorApi`
- Its own plugin setup and cleanup lifecycle
- Browser-memory conversation, source, and preview state

There is no global editor store or global plugin registry.

## Package Entry Points

The package exposes two supported entry points:

```ts
import { DocumentEditor, createEditor } from '@techcodie/editor'
import '@techcodie/editor/styles.css'
```

Internal files are not package exports. Consumers should not import from
`src`, `dist-sdk` chunks, component folders, hooks, services, or parser paths.

## React Component

### `DocumentEditor`

```tsx
<DocumentEditor
  config={config}
  className="host-editor"
  style={{ minHeight: 640 }}
/>
```

Props:

| Prop | Type | Description |
| --- | --- | --- |
| `config` | `DocumentEditorConfig` | Initialization configuration |
| `controller` | `DocumentEditorController` | Controller returned by `createEditor` |
| `className` | `string` | Class applied to the isolated SDK root |
| `style` | `CSSProperties` | Inline style applied to the SDK root |

Configuration and controllers are initialization inputs. Remount the component
to replace an active controller or rebuild the editor with different
initialization options.

### Component ref

The forwarded ref is a `DocumentEditorHandle`:

```ts
interface DocumentEditorHandle {
  config: ResolvedDocumentEditorConfig
  events: DocumentEditorEvents
  getEditorApi(): EditorApi | null
  focus(): void
}
```

## Controller

### `createEditor(config?)`

Creates an instance controller without creating DOM or a Tiptap editor.

```ts
const controller = createEditor(config)
const unsubscribe = controller.events.on('editorChange', ({ text }) => {
  saveDraft(text)
})

// After the component emits ready:
controller.getEditorApi()?.focus()
unsubscribe()
```

One controller should be mounted by one `DocumentEditor` at a time.

## Editor API

`EditorApi` is the intentional imperative editing surface.

### History

- `undo()`
- `redo()`
- `canUndo()`
- `canRedo()`

### Block and mark commands

- `setParagraph()`
- `toggleHeading(level)`
- `toggleBold()`
- `toggleItalic()`
- `toggleUnderline()`
- `toggleStrike()`
- `toggleInlineCode()`
- `toggleHighlight()`
- `toggleBulletList()`
- `toggleOrderedList()`
- `toggleTaskList()`
- `toggleBlockquote()`
- `toggleCodeBlock()`
- `insertHorizontalRule()`
- `clearFormatting()`
- `setTextAlign(align)`

Each command has matching active-state methods where applicable.

### Document and selection

- `getDocumentText()`
- `getTextSelection()`
- `replaceTextSelection(selection, replacement)`
- `clearTextSelection()`
- `insertStructuredContent(insertion)`
- `focus()`

### Reactivity

- `subscribe(listener)`
- `getSnapshot()`

These methods form an external-store contract. Most consumers should prefer SDK
events unless they are building a custom editor UI.

## AI API

The SDK exposes AI configuration and event contracts, not provider credentials.

```ts
ai: {
  askDocumentEndpoint: '/internal/editor/ask',
  selectionEndpoint: '/internal/editor/selection',
}
```

Both endpoints use server-sent events and the request contracts implemented by
the reference server. `ai: false` removes Ask Document and Selection AI UI.

## Knowledge Sources and Preview

Version 1.0 keeps source files, parsed content, and preview state in browser
memory. PDF, DOCX, TXT, and Markdown are accepted. The SDK emits source and
preview events with serializable metadata; raw `File` objects and parsed
content are not exposed through the public event surface.

Knowledge sources are intentionally managed through the built-in UI in v1.0.
An imperative source provider API is not part of the public surface.

## Semantic Search

The built-in Semantic Search panel incrementally indexes the current document,
ready Knowledge Sources, local version snapshots, workflow metadata, and
available compliance findings. It supports keyword, semantic, hybrid, recent,
related-document, and Knowledge Source retrieval plus an on-demand knowledge
graph view.

Hosts can also create a framework-neutral engine:

```ts
import { createSearchEngine } from '@techcodie/editor'

const search = createSearchEngine()
await search.index([{
  id: 'policy-1',
  title: 'Security Policy',
  content: policyText,
  metadata: { kind: 'knowledge-source' },
}])

const response = await search.search({
  query: 'data retention obligations',
  mode: 'hybrid',
})
```

The default provider creates deterministic feature-hash embeddings locally.
Supply an `EmbeddingProvider` to `createSearchEngine` when a host-controlled
embedding service is required. The engine does not send document content to an
external search or vector service.

## Public Exports

Runtime exports:

- `DocumentEditor`
- `createBroadcastChannelTransport`
- `createEditor`
- `createLocalEmbeddingProvider`
- `createSearchEngine`
- `createWebSocketTransport`
- `validateDocumentEditorConfig`
- `resolveDocumentEditorConfig`
- `getDefaultDocumentEditorTheme`
- `SELECTION_AI_ACTIONS`
- `isSelectionAiAction`

Type exports include configuration, controller, component, theme, event,
plugin, selection action, collaboration, semantic search, knowledge graph,
embedding provider, and `EditorApi` contracts. Package exports prevent
supported imports from reaching internal implementation modules.
