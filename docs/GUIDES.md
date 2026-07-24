# Feature Guides and Troubleshooting

## Ask Document

Ask Document sends the current document, explicitly active knowledge sources,
the question, and recent conversation to the configured endpoint. The host
backend formats provider prompts and returns server-sent events.

Disable AI entirely:

```ts
const config = { ai: false }
```

Set `streaming: false` to keep the streaming transport while revealing the
assistant response only after completion.

## Selection AI

Selecting non-empty editor text opens the Selection AI toolbar. Available
actions are Improve Writing, Rewrite, Simplify, Expand, Shorten, Fix Grammar,
Translate, and Explain. Responses are never applied automatically.

Selection replacement and Ask Document insertion both use `EditorApi`, preserve
one-step history, and emit `insert` when an Ask Document response is inserted.

## Knowledge Sources

Knowledge Sources accepts PDF, DOCX, TXT, and Markdown files up to 25 MB.

- Files and parsed content stay in browser memory.
- The Current Document is always active.
- Uploaded sources can be activated or excluded.
- Empty, unsupported, oversized, corrupted, and unreadable files are rejected.
- PDF.js, its worker, Mammoth, Marked, and preview UI load on demand.

Set `knowledgeSources: false` to remove source controls. Version 1.0 does not
provide persistence, an upload provider, or an imperative source-management
API.

## Preview

Set `preview: false` to disable source preview while retaining source context.
Preview open and close events contain serializable source metadata.

## Voice Input

Voice input uses the browser's native `SpeechRecognition` or
`webkitSpeechRecognition` implementation.

- Audio is not stored by the SDK.
- Recognition results remain editable.
- Speech never submits automatically.
- Unsupported browsers show no active microphone workflow.
- The host must serve from a secure context for production microphone access.

Set `voice: false` to remove the microphone control.

## Keyboard

When `keyboardShortcuts` is enabled:

- `Cmd/Ctrl + K`: command palette
- `Cmd/Ctrl + Enter`: send Ask Document message
- `Escape`: close the active preview, dialog, result, or panel
- Arrow keys and Enter: navigate and execute command-palette items

Standard Tab navigation remains available when shortcuts are disabled.

## Best Practices

- Create one controller per mounted editor.
- Memoize large configuration objects in frequently rendering hosts.
- Use `onEditorChange` as a persistence trigger, then debounce storage in the
  host.
- Keep AI keys and privileged operations server-only.
- Validate source access and document authorization on every AI request.
- Import the distributed stylesheet once in the host application.
- Use callbacks for simple integrations and plugins for reusable lifecycle
  behavior.
- Use `readonly` for viewing and host permissions, but continue enforcing
  authorization outside the browser.

## React Example

The complete example is in `examples/react`. It demonstrates:

- Initial content
- Custom theme tokens
- Ask Document and Selection AI endpoints
- Knowledge Sources and preview
- Voice input
- Typed callbacks
- An analytics plugin
- A live event status

Build it from the repository root:

```sh
npm run build:example
```

## Troubleshooting

### Styles are missing

Import the stylesheet once:

```ts
import '@techcodie/editor/styles.css'
```

### Ask Document says it is not configured

The configured endpoint is unavailable or the reference backend has no
`GROQ_API_KEY`. Configure the host endpoint and keep the key on the server.

### AI responses fail validation

Ensure the endpoint returns the SDK server-sent event protocol, including Ask
Document metadata, content deltas, and a final done event.

### Microphone is unavailable

Check browser support, secure-context requirements, OS permissions, and site
permissions. Typed input remains available.

### A source cannot be previewed

Wait for parsing to complete. Confirm the file is supported, non-empty, under
25 MB, and not password protected.

### Configuration warnings appear

Warnings identify invalid runtime values or unknown keys. Use
`validateDocumentEditorConfig` when configuration comes from JavaScript,
remote data, or a CMS.

### The editor is mounted but `getEditorApi()` returns null

Wait for `onReady` or subscribe to the `ready` event. The React editor instance
is created after the controller.

### An event callback throws

The SDK converts failures in non-error event handlers into an `error` event.
Inspect `cause` in development and keep production handlers resilient.
