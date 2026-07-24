# TechCodie Editor

`@techcodie/editor` is an embeddable React document editor SDK built with
Tiptap and ProseMirror. It includes rich-text editing, Ask Document, Selection
AI, local knowledge sources, document preview, voice input, typed events,
theming, and instance-scoped plugins.

## Install

```sh
npm install @techcodie/editor react react-dom
```

React 19 or newer is required.

## Quick Start

```tsx
import { DocumentEditor } from '@techcodie/editor'
import '@techcodie/editor/styles.css'

export function Editor() {
  return (
    <DocumentEditor
      config={{
        initialContent: '<h1>Project brief</h1><p>Start writing here.</p>',
        callbacks: {
          onReady: ({ api }) => api.focus(),
          onEditorChange: ({ text }) => console.log(text),
        },
      }}
    />
  )
}
```

The SDK sends AI requests to `/api/ask-document` and `/api/selection-ai` by
default. The host application owns those endpoints, authentication, storage,
uploads, business logic, and provider credentials. The included Node server is
a reference Groq integration for local development.

## Controller API

Use `createEditor` when events or the editor API must be accessed outside the
React render tree.

```tsx
import { createEditor, DocumentEditor } from '@techcodie/editor'

const editor = createEditor({
  toolbar: true,
  commandPalette: true,
})

editor.events.on('ready', ({ api }) => api.focus())

export function Editor() {
  return <DocumentEditor controller={editor} />
}
```

## Documentation

- [Architecture and public API](docs/API.md)
- [Configuration, events, and theming](docs/CONFIGURATION.md)
- [Ask Document, knowledge sources, voice, and troubleshooting](docs/GUIDES.md)
- [Plugin guide](docs/PLUGINS.md)
- [Migration notes](docs/MIGRATION.md)
- [Version history](CHANGELOG.md)

## Repository Development

```sh
cp .env.example .env
# Set GROQ_API_KEY in .env
npm install
npm run dev
```

The repository application runs at `http://127.0.0.1:5173` and proxies API
requests to the reference Node backend on port `3001`.

Useful release commands:

```sh
npm run typecheck
npm run lint
npm run build
npm run pack:check
```

The React consumer example lives in [`examples/react`](examples/react).

## License

MIT
