# Migration Notes

## Application to SDK 1.0

The pre-1.0 repository rendered `EditorWorkspace` directly. Version 1.0 exposes
`DocumentEditor` as the supported host boundary.

Before:

```tsx
import { EditorWorkspace } from './components/EditorWorkspace'

<EditorWorkspace />
```

Version 1.0:

```tsx
import { DocumentEditor } from '@techcodie/editor'
import '@techcodie/editor/styles.css'

<DocumentEditor config={{ initialContent }} />
```

## Important Changes

- Package name is `@techcodie/editor`.
- Version is `1.0.0`.
- React and React DOM are peer dependencies.
- Internal source paths are not supported package exports.
- Styles must be imported from `@techcodie/editor/styles.css`.
- Initialization behavior is configured through `DocumentEditorConfig`.
- Host integrations should use callbacks, typed events, plugins, or `EditorApi`.
- AI endpoints are configurable, but provider credentials remain server-only.
- SDK CSS no longer styles the host `html`, `body`, or application root.

## Existing Backend

The reference `/api/ask-document` and `/api/selection-ai` contracts remain
compatible. No backend architecture change is required for the default
configuration.

## Migrating Custom UI

Custom formatting UI should consume `EditorApi`. Do not import Tiptap through
the SDK package or call internal component hooks. `EditorApi` is the stable
boundary for commands, active state, document text, selection, insertion, and
subscriptions.

## Future Versions

The 1.x line will preserve documented root exports using semantic versioning.
Undocumented generated chunks and internal source paths may change in any
release.
