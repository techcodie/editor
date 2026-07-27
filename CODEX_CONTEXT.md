# Document Editor SDK

## Your Role

You are the primary software engineer implementing this project.

You are not responsible for redesigning the architecture.

Focus on writing clean, production-quality code while respecting the
architectural decisions documented below.

If you believe an architectural change is beneficial, mention it in the final
report but do not implement it unless explicitly requested.

---

## Project Vision

We are building a modern embeddable Document Editor SDK, not another document
application.

The editor should eventually be installable like:

```tsx
<DocumentEditor
  initialContent={document}
  onUpdate={handleUpdate}
  ai={aiProvider}
  upload={uploadProvider}
  storage={storageProvider}
/>
```

or:

```ts
const editor = createEditor(config)
```

The SDK should be usable inside:

- CRM
- ERP
- LMS
- CMS
- Internal Business Apps
- AI Applications
- SaaS Products

The host application owns:

- Authentication
- Database
- Storage
- Uploads
- AI providers
- Business logic

The SDK owns:

- Editing
- Rendering
- Commands
- Editor interactions
- UI components
- Editor lifecycle

---

## Core Principles

1. Keep the implementation simple.
2. Never over-engineer.
3. Build only what is required for the current milestone.
4. Future features should not influence today's implementation.
5. Avoid speculative abstractions.
6. Prefer deleting code over keeping unused abstractions.

---

## Locked Architecture

The following architecture is final.

Do not redesign it.

```text
Host Application
        |
        v
DocumentEditor SDK
        |
        v
Public Configuration / Events / Plugins
        |
        v
Editor Workspace
        |
 +------+--------+
 v               v
Toolbar     DocumentEditor
        |
        v
Editor API
        |
        v
Tiptap
        |
        v
ProseMirror
```

### Public SDK Surface

Version 1.0 exposes one package root, `@techcodie/editor`, with:

- `DocumentEditor` for React composition.
- `createEditor(config)` for creating an instance-scoped controller.
- Configuration validation and default-theme helpers.
- Framework-neutral Editor API types.
- Typed configuration, event, plugin, theme, AI, and knowledge-source contracts.
- Selection AI action constants and validation.

Package export maps allow only the root API, `styles.css`, and package metadata.
Internal components, Tiptap adapters, services, hooks, and knowledge parsers are
not importable package subpaths. The published SDK is ESM with declarations,
declaration maps, JavaScript source maps, preserved module boundaries for tree
shaking, and externalized runtime dependencies.

### Configuration and Events

`DocumentEditorConfig` supports initial content, placeholder, theme, readonly
mode, toolbar, voice, AI endpoints, Knowledge Sources, preview, streaming,
animations, keyboard shortcuts, command palette, callbacks, and plugins.
Configuration is resolved once per controller instance. Runtime validation
provides prefixed warnings, ignores unknown options, and safely falls back for
invalid nested values.

Each controller owns a typed event target. Public callbacks and `events.on`
cover editor readiness and changes, selection changes, AI request and response
lifecycle, insertions, Knowledge Source add/remove/activation, preview open and
close, and errors. Events expose public data contracts only.

### Plugin Architecture

Version 1.0 includes lightweight, instance-scoped plugins. A plugin has a stable
name and a `setup` function receiving resolved configuration, typed events, a
lazy Editor API getter, and scoped warnings. Setup may return cleanup logic.
Plugins cannot access private controller internals and do not introduce a global
registry, dependency injection, UI, runtime service, or global state.

### Current AI Request Flow

```text
Ask Document UI / Selection AI UI
                |
                v
        Frontend AI Service
                |
                v
        Node API Endpoint
                |
                v
          Groq Provider
```

The two current AI workflows are:

- Ask Document: current document, explicitly active Knowledge Sources, question,
  and recent conversation history.
- Selection AI: selected text, action, and optional current-document context.

Both workflows use the shared streaming transport and return server-sent events.
The Groq API key remains server-only.

Frontend stream updates are buffered to animation frames before React state is
updated. This preserves the existing transport while reducing render pressure
and producing smoother visible response updates. Ask Document exposes explicit
generation cancellation and retains content already received when a request is
stopped.

Ask Document builds a structured request through the Knowledge Context Builder.
The frontend sends document text, ordered active sources, conversation, and the
question as separate fields. Only the backend prompt builder formats those
fields for Groq. The backend emits response metadata before content, including
the configured model, stable source descriptors, and context size.

Ask Document voice input is a browser-only input method. The native Web Speech
API converts microphone speech into editable text before the existing Ask
Document request flow begins. Voice input never submits a question
automatically and does not change the backend or Groq integration.

### Knowledge Source Preview Flow

```text
Local File
    |
    v
Knowledge File Parser
    |
    v
Local Source State
    |
    v
In-App Preview Workspace
```

Knowledge source files and parsed content remain in browser memory. This flow
does not use storage providers or the Editor API.

### Knowledge Context Flow

```text
Current Document + Active Parsed Sources
                    |
                    v
        Knowledge Context Builder
                    |
                    v
        Structured Ask Document Request
                    |
                    v
        Backend Prompt Builder
                    |
                    v
                  Groq
```

The Current Document is always active. Uploaded sources are included only when
the user has explicitly left them active and parsing completed successfully.
Missing, empty, failed, inactive, or removed sources are skipped. Source order
is preserved, source content is never summarized or truncated, and the exact
source set used by each response is retained in that response's UI metadata.

Temporary preview sources are scoped to the next question. Context ordering is
Current Document, temporary sources, then active workspace sources. Duplicate
source IDs are removed before the request is created.

### AI Editor Insertion Flow

```text
Assistant Response
        |
        v
Structured Content Normalizer
        |
        v
Editor Insertion Service
        |
        v
Editor API
        |
        v
Single Tiptap Transaction
```

Ask Document UI supplies response content and insertion intent only. The
insertion service normalizes supported Markdown structure, validates the target,
and attaches response ID, source IDs, and insertion time as transaction
provenance. Only the Editor API performs Tiptap operations.

### Enterprise Asset Insertion Flow

```text
Toolbar Asset Control
        |
        v
Enterprise Asset Library
        |
        v
Asset Registry / Renderer
        |
        v
Editor API
        |
        v
Selectable Editor Asset Node
```

The Enterprise Asset Library is a generic, registry-driven side panel. Phase 1
ships stamps as its first asset type, but library UI, search, favorites, recent
items, placement state, and editor insertion are modeled as assets rather than
stamp-specific commands. Stamp presets configure one reusable, memoized SVG
renderer; they do not include static image files.

Asset Library UI communicates with the editor only through `EditorApi.insertAsset`.
The internal asset node extension renders the inserted document node and owns
native document movement, selection, resizing, and rotation. Asset instances
remain part of editor content rather than browser-overlay state.

### Enterprise Review Flow

```text
Review Toolbar Control
        |
        v
Review Mode / Text Selection
        |
        v
Comment Thread Registry
        |
        v
Review Sidebar
        |
        v
Editor API
        |
        v
Commented Text Mark
```

Review Phase 1 is an instance-local layer composed above the editor. Comment
components and hooks communicate with the editor only through the Editor API.
The internal `reviewComment` mark stores a stable comment ID on the selected
document range; thread content remains browser-memory state owned by the
workspace. Review mode controls highlight visibility and comment interaction
listeners without changing normal editor behavior.

### Enterprise Track Changes Flow

```text
Suggestion Toolbar Control
        |
        v
Suggestion Mode
        |
        v
Transaction-Aware Change Mark
        |
        v
Suggestion Registry / Sidebar
        |
        v
Editor API Decisions
        |
        v
Accepted or Restored Document Content
```

Track Changes Phase 1 extends the existing review annotation layer. A single
internal `trackChange` mark represents insertion, deletion, replacement, and
format segments. The transaction-aware mark compares each editor transaction,
restores deleted content for review, groups adjacent typing and deletion, and
emits framework-neutral change drafts to instance-local workspace state.

The Editor API owns Suggestion Mode, live change lookup, accept and reject
decisions, range focus, and annotation interactions. Suggestion UI never imports
Tiptap or ProseMirror. The responsive sidebar may be hidden while Suggestion
Mode remains active, allowing mobile users to continue editing and reopen the
same review session.

### Future Annotation Engine

Comments and Track Changes now share the same architectural pattern: stable
document annotations, local review models, Editor API interactions, and
workspace-composed side panels. This is the integration point for future
governed review, audit, compliance, version, and AI review workflows. No global
annotation engine, event bus, permissions layer, or persistence service has
been introduced in Phase 1.

---

## Important Rules

### Toolbar

Toolbar must never import Tiptap.

Toolbar must never call:

- `editor.chain()`
- `editor.commands`
- `editor.can()`
- `editor.isActive()`

Toolbar communicates only with the Editor API.

### Bubble Menu

Bubble Menu must also communicate only through the Editor API.

### Slash Menu

Slash Menu must also communicate only through the Editor API.

### Editor UI Components

Every editor UI component must use the Editor API.

Examples:

- Bubble Menu
- Slash Menu
- Floating Toolbar
- AI Toolbar
- Command Palette

No UI should depend directly on Tiptap.

The current workspace command palette is a local UI coordinator, not a command
registry. It invokes focused workspace callbacks and uses the Editor API for
editor focus and AI insertion. It introduces no global state, runtime service,
or plugin system.

---

## Editor API

The Editor API is currently the only layer allowed to interact with Tiptap.

Today it is a thin wrapper.

Later it will become the Runtime.

Do not bypass it.

The current Editor API also owns selected-text access, selection bounds,
explicit selection replacement, selection clearing, and editor focus. Selection
AI UI components consume only these API methods and never access Tiptap
directly.

The Editor API also owns structured insertion at the current cursor, a validated
selection, or the document end. Each insertion uses one native history
transaction so one Undo restores the previous document.

The Editor API also owns generic asset insertion. Asset Library components send
framework-neutral asset payloads and never access Tiptap directly.

The Editor API also owns review comment anchoring, anchor removal, range focus,
active-comment lookup, review-mode visibility, and comment highlight
interactions. Review UI never imports or calls Tiptap. Clearing formatting
preserves review anchors so document styling commands do not silently remove
discussions.

The Editor API also owns Suggestion Mode, tracked-change subscriptions,
accept/reject decisions, live range focus, and hover/click interactions.
Insertion, deletion, replacement, and formatting annotations remain internal
editor marks while the sidebar consumes framework-neutral change records.

---

## AI Capabilities

### Ask Document

- Opens in a responsive side panel.
- Answers questions using the current document and explicitly active Knowledge
  Sources.
- Supports suggested questions, recent conversation context, retry, clear, and
  cancellation.
- Batches streaming updates to animation frames for smooth response rendering,
  prevents duplicate sends, and exposes an explicit Stop control that preserves
  content already received.
- Stores model, stable source metadata, context size, and response time on each
  assistant message.
- Displays compact source badges and evidence cards for each completed response.
- Supports Insert at Cursor, Replace Selection, Append to End, Copy, Regenerate,
  View Sources, and Open Preview response actions.
- Shows a lightweight Original-to-Replacement preview before replacing selected
  editor content.
- Supports native browser speech-to-text with live transcription, manual stop,
  editable results, permission and error feedback, and no automatic submission.
- Streams responses from the backend through Groq.

### Selection AI

- Appears only when non-empty editor text is selected.
- Supports Improve Writing, Rewrite, Simplify, Expand, Shorten, Fix Grammar,
  Translate, and Explain.
- Shows loading, error, and result-preview states.
- Supports Replace Selection, Copy Result, Try Again, Cancel, and Escape.
- Never changes editor content without explicit user confirmation.
- Verifies that the captured selection is still valid before replacement.
- Translate currently targets English because prompt customization is deferred.

### Knowledge Sources

- Appears inside Ask Document without changing its conversation workflow.
- Keeps the Current Document as the permanent first source.
- Supports local file selection and drag-and-drop validation for PDF, DOCX, TXT,
  and Markdown files.
- Parses supported files locally and stores extracted text and preview metadata
  in local component state.
- Caches parsing promises by browser `File` object to prevent duplicate parsing
  while allowing failed attempts to be retried.
- Renders PDF pages and formatted DOCX, Markdown, and TXT content in a responsive
  in-app preview workspace.
- Lazy-loads the preview workspace, PDF renderer, PDF.js module, and PDF worker;
  PDF pages render near the viewport and large preview blocks use browser
  content containment.
- Supports parsing progress, page counts for PDFs, validation errors, parsing
  errors, preview keyboard controls, and source removal.
- Uses one shared preview instance across source cards, response badges, and
  evidence actions.
- Provides an Ask AI preview action that focuses chat and adds a temporary
  next-question source chip without changing permanent active-source state.
- Reserves disabled preview actions for future Summarize and Insert capabilities.
- Keeps Current Document active and immutable while allowing uploaded, parsed
  sources to be included or excluded from Ask Document.
- Warns when active source content is large without summarizing or truncating it.
- Rejects empty, unsupported, and files larger than 25 MB before parsing.
- Sends active parsed source text only as part of an explicit Ask Document
  request; it does not upload or persist sources separately.

AI request parsing, stream handling, provider errors, and HTTP validation are
shared where practical without introducing a runtime, registry, or plugin
system.

### AI Editor Insertion

- Normalizes assistant Markdown into schema-compatible headings, paragraphs,
  links, emphasis, lists, task lists, blockquotes, code, and horizontal rules.
- Converts table rows to readable paragraphs because table nodes are not
  registered in the current editor schema.
- Supports cursor insertion, validated selection replacement, and append-to-end
  through a reusable insertion service and hook.
- Associates each inserted transaction with response ID, source IDs, and
  insertion timestamp without exposing provenance in editor content.
- Preserves native Tiptap history and keeps conversation, Knowledge Sources, and
  preview state unchanged.

### Speech Recognition

- `useSpeechRecognition` isolates all native `SpeechRecognition` and
  `webkitSpeechRecognition` access from presentation components.
- Recognition is client-only and does not upload or store audio in this
  application.
- Existing typed text is preserved when recognition starts.
- Interim and final results update the existing Ask Document textarea.
- Typing, sending, closing the panel, or starting an AI request safely cancels
  active recognition.
- Unsupported browsers expose a disabled microphone control with an accessible
  explanation.

### Enterprise Review

- Review Mode is toggled from the workspace toolbar and opens a responsive
  right-side review panel.
- Selecting non-empty editor text exposes a lightweight comment action and an
  accessible composer with keyboard submission and Escape cancellation.
- Saved comment ranges remain highlighted while Review Mode is active; hover
  shows a compact preview and click opens the corresponding discussion.
- Discussions support replies, resolving, reopening, editing and deleting the
  current user's comment, and jumping back to the anchored selection.
- The sidebar supports Active, Resolved, Mine, and All views; newest and oldest
  sorting; author, text, status, and date search; and previous/next navigation.
- Comment threads are memoized and review state updates do not recreate the
  editor instance.
- Comments and replies are currently session-local. No persistence, mentions,
  notifications, collaboration, governed review workflow, or Track Changes
  behavior
  is included in Phase 1.

### Enterprise Track Changes

- Suggestion Mode is toggled from the workspace toolbar or its accessible
  keyboard shortcut and uses the existing review side-panel lifecycle.
- Normal editing remains unchanged while Suggestion Mode is off.
- Typing creates grouped green insertion suggestions; deleting restores text
  with a red strike-through; replacement shows old and new segments under one
  suggestion; formatting receives a reversible blue annotation.
- Suggestions support Accept, Reject, Accept All, Reject All, jump, click-to-open,
  hover preview, previous/next navigation, and newest/oldest sorting.
- The sidebar supports All, Pending, Accepted, Rejected, and Mine views plus
  author, type, status, content, and date search.
- Suggestion state remains active when the responsive sidebar is hidden, so the
  editor stays usable on small screens.
- Track-change records are session-local. No realtime collaboration, version
  history, branching, permissions, or persistent audit log is included.

### Production Shell

- Ask Document is lazy-loaded on first use and remains mounted afterward so its
  browser-memory workspace session is preserved.
- The document preview and PDF renderer are separate on-demand chunks.
- The application isolates Tiptap and ProseMirror in a stable editor vendor
  chunk. The SDK externalizes runtime dependencies and preserves ESM module
  boundaries for consumer deduplication and tree shaking.
- Expensive chat messages, evidence lists, source cards, text previews, and PDF
  pages are memoized around stable props.
- Application and feature error boundaries keep the editor usable when an
  isolated UI surface fails.
- `Cmd/Ctrl + K` opens an accessible command palette with search, arrow
  navigation, Enter execution, Escape dismissal, a focus trap, and focus
  restoration.
- Palette actions include Ask AI, Upload Source, Open Preview, Insert Last
  Response, Toggle Sidebar, and Focus Editor. State-dependent commands provide
  friendly feedback when no source or response is available.
- `Cmd/Ctrl + Enter` sends Ask Document messages. Existing dialog and preview
  Escape behavior restores focus to the initiating control.
- Motion respects `prefers-reduced-motion`, dialogs expose accessible names and
  descriptions, streaming regions expose busy state, and responsive overlays
  avoid horizontal viewport overflow.

---

## Runtime

Do not build the runtime yet.

The runtime will come later.

Do not create:

- Command registry
- Runtime services
- Dependency injection
- Global stores

until explicitly requested.

The v1.0 typed event target and plugin setup lifecycle are public SDK contracts,
not the future Runtime. They are local to each controller and must remain
lightweight until a Runtime milestone is explicitly requested.

---

## State Management

No Zustand.

No Redux.

No MobX.

No React Context for editor state.

Current architecture shares the editor through composition and props.

Ask Document uses a lightweight local Workspace Session composition hook to
coordinate Knowledge Sources, conversation, preview state, and temporary
sources. It is not a global store and does not persist state.

Enterprise Review uses a local comment hook composed by the editor workspace.
It does not introduce React Context, a global registry, or persistent comment
storage.

Track Changes uses a local suggestion hook composed alongside comments in the
same workspace. The editor mark owns transaction interpretation; React owns
only the review records and visible panel state. No new global store or context
has been introduced.

---

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Tiptap v3
- ProseMirror
- Radix UI
- Lucide Icons
- Node.js backend
- Groq API
- Native Web Speech API
- PDF.js
- Mammoth
- Marked
- DOMPurify

PDF.js and Mammoth are isolated to client-side Knowledge Source parsing and
preview rendering. Marked and DOMPurify are also reused by the AI insertion
normalizer to produce sanitized, schema-compatible editor content.

---

## Current Folder Structure

```text
server/
  providers/             Groq provider integration
  ai-response.ts         Shared AI streaming response handling
  ask-document.ts        Ask Document endpoint
  selection-ai.ts        Selection AI endpoint
  http.ts                Shared request validation and errors
  prompts.ts             Centralized AI prompts

shared/
  ai.ts                  Shared AI and Selection AI contracts
  ask-document.ts        Ask Document contracts

src/
  assets/
    categories/stamps/    Registry presets and reusable SVG stamp renderer
    components/           Generic asset side panel, search, grid, cards, and preview
    editor/               Internal selectable asset node and node view
    hooks/                Click-to-place asset insertion lifecycle
    services/             Asset registry and renderer-to-editor mapping
    types/                Generic asset and stamp configuration contracts
  components/
    AskDocument/         Chat UI, evidence, response metadata, and workspace session
    CommandPalette/      Local workspace command search and keyboard navigation
    DocumentEditor/      Editing surface
    EditorWorkspace/     Editor composition and layout
    ErrorBoundary/       Application and isolated-feature error containment
    SelectionAI/         Selection toolbar and result preview
    Toolbar/             Formatting controls
  editor/
    components/          Replacement review UI
    hooks/               Editor insertion lifecycle and capabilities
    services/            Structured response parsing and insertion orchestration
  knowledge/
    components/          Source list, cards, and upload dialog
    hooks/               Local source and preview state
    preview/             Preview workspace and format-specific viewers
    services/            Local parsers, PDF loading, and AI context building
    types/               Source contracts, validation, and file helpers
  review/
    components/          Review sidebar, navigation, threads, composers, and highlights
    editor/              Internal comment anchor mark
    hooks/               Local comment and selection-comment lifecycles
    services/            Comment model operations, filtering, and display helpers
    types/               Comment, reply, anchor, and review UI contracts
    trackChanges/
      components/        Suggestion sidebar, cards, navigation, toolbar, and preview
      editor/            Transaction-aware tracked-change annotation mark
      hooks/             Instance-local suggestion lifecycle and decisions
      services/          Change registry, filtering, labels, and date helpers
      types/             Change model, decisions, filters, and sorting contracts
  hooks/
    useSpeechRecognition.ts  Native browser speech recognition lifecycle
  services/              Shared AI transport and frame-batched stream updates
  lib/editor-api.ts      Public framework-neutral editor command contract
  lib/create-editor-api.ts  Internal Tiptap-to-Editor-API adapter
  sdk/                   Public configuration, events, plugins, theme, and controller
  index.ts               Intentional public SDK exports
  sdk-entry.ts           ESM library and stylesheet build entry
  styles/editor.css      Editor typography and content styling

docs/                    API, configuration, guides, plugins, and migration notes
examples/react/          React consumer example built against the SDK artifact
```

---

## Coding Standards

Use:

- Strict TypeScript
- Functional Components
- Small files
- Reusable primitives
- Composition over inheritance
- Clear naming
- Minimal abstractions

Avoid:

- Large components
- Deep prop drilling
- Duplicate logic
- Premature optimization

---

## Current Project Status

**Version 1.0 Complete; Enterprise Track Changes Phase 1 Complete**

Completed:

- Editor shell
- Professional formatting toolbar
- Rich text editing
- Editor API
- Responsive layout
- Accessibility
- Active and disabled toolbar states
- Markdown shortcuts
- Ask Document UI
- Groq-backed Ask Document streaming
- Shared frontend and backend AI streaming transport
- Selection AI toolbar and all eight selection actions
- Selection AI preview, copy, retry, cancellation, and explicit replacement
- Selection-safe editor API integration
- Cohesive editor and AI UI polish across desktop and mobile
- Ask Document speech-to-text input with live, editable transcription
- Knowledge Sources UI with Current Document, file selection, drag-and-drop
  validation, local metadata cards, and source removal
- Local PDF, DOCX, TXT, and Markdown parsing with extracted content and errors
- Responsive document preview workspace with PDF page rendering, formatted text
  previews, loading states, focus management, and keyboard dismissal
- Active Knowledge Source controls with Current Document permanently enabled
- Multi-source Ask Document context built from the current document and ordered
  active parsed sources
- Per-response source labels and large-context feedback
- Stable source and model metadata persisted on assistant messages
- Compact source badges, evidence cards, and response actions
- Shared preview integration for cited sources with approximate start positioning
- Ask AI from preview with temporary next-question source chips
- Lightweight local Workspace Session coordination
- Structured AI response normalization into supported editor blocks and marks
- AI response insertion at cursor, validated selection replacement, and document end
- Accessible replacement preview with native one-step undo
- Internal insertion provenance for response and source traceability
- Frame-batched Ask Document and Selection AI stream rendering
- Explicit Ask Document generation cancellation with partial-response retention
- Lazy-loaded Ask Document, preview, PDF renderer, PDF.js, and PDF worker paths
- Cached knowledge source parsing and viewport-deferred preview rendering
- Stable editor vendor bundle splitting
- Accessible workspace command palette with all six milestone actions
- Application and feature-level error boundaries
- Keyboard, focus restoration, reduced-motion, and responsive accessibility audit
- Intentional `@techcodie/editor` public API and package export map
- Strongly typed, runtime-validated SDK configuration
- Typed instance-scoped callbacks and event subscriptions
- Lightweight plugin setup and cleanup lifecycle
- Theme tokens for colors, typography, spacing, radius, icons, motion, and shadows
- Readonly and feature-level SDK configuration integration
- Pure ESM packaging with declarations, source maps, dependency externalization,
  and tree-shakeable preserved modules
- Comprehensive installation, API, configuration, event, feature, plugin,
  migration, troubleshooting, and best-practice documentation
- React example covering AI, voice, Knowledge Sources, theming, callbacks, and
  plugins
- Version 1.0 license, release notes, package metadata, and publish allowlist
- Enterprise Asset Library with search, favorites, recent assets, and ten
  category views
- Forty reusable workflow, finance, legal, engineering, healthcare, HR,
  logistics, security, date, and signature stamp presets
- Memoized dynamic SVG stamp renderer with ten visual styles and composed icons
- Explicit click-to-place asset insertion through the Editor API
- Selectable, document-native asset nodes with movement, resizing, and rotation
- Enterprise Review Mode with anchored text comments and visible highlights
- Responsive Review Sidebar with active, resolved, mine, and all views
- Comment replies, edit, delete, resolve, reopen, jump, search, sort, and
  previous/next navigation
- Accessible selection composer, highlight preview, keyboard shortcut, focus
  management, and mobile review layout
- Suggestion Mode integrated with the existing enterprise review architecture
- Transaction-aware insertion, deletion, replacement, and formatting suggestions
- Green insertion, red deletion, and blue formatting document annotations
- Suggestion accept, reject, accept-all, reject-all, jump, search, filtering,
  sorting, navigation, click-to-open, and hover-preview workflows
- Responsive sidebar visibility independent from active tracking state

Architecture is verified. Ask Document and Selection AI both preserve the
Editor API boundary. Knowledge Sources remains browser-memory state and uses a
dedicated context builder to create structured Ask Document requests. Prompt
formatting and response-source metadata remain server-side. Evidence is
source-level transparency for the exact request context; no embeddings,
retrieval, semantic claim matching, or source persistence has been introduced.
AI insertion remains independent of Ask Document presentation and reaches
Tiptap only through the Editor API. The command palette coordinates existing
local callbacks and reaches editor behavior only through the Editor API; no
runtime, command registry, dependency injection, or global store has been
introduced. The public event and plugin contracts remain controller-local. No
global asset store, asset persistence, custom creator, or static stamp image
catalog has been introduced. Review comments and tracked suggestions are local
workspace state and reach Tiptap only through the Editor API. Their internal
marks share one annotation pattern without a parallel store or UI-to-Tiptap
dependency. No known functional bugs are open.

### Version 1.0 Release Notes

- The existing editor, AI, voice, Knowledge Source, evidence, preview, insertion,
  accessibility, and performance capabilities are now available through the
  embeddable `DocumentEditor` SDK.
- Host applications can configure features and theme tokens, subscribe through
  callbacks or typed events, and attach lightweight plugins without importing
  implementation modules.
- The release artifact is ready for package publication as
  `@techcodie/editor@1.0.0`.

---

## Intentionally Deferred

These are not missing. Do not implement unless requested.

### Version 1.1+

- Runtime
- Command registry
- Provider-oriented AI, voice, upload, and storage plugin contracts
- Additional public theme icon slots
- Headless and non-React adapters
- Upload providers
- Storage providers
- Collaboration
- Persisted and server-backed comment threads
- Realtime comment collaboration
- Comment mentions and notifications
- Governed review and suggestion workflows
- Comment author and permission providers
- Persisted and server-backed tracked changes
- Realtime suggestion collaboration and conflict handling
- Version history and legal audit records
- Track-change author and permission providers
- AI-assisted review and compliance policy checks
- Export
- Search
- Persistence
- Autosave
- Multi-document support
- AI suggestion history
- Prompt customization
- Inline AI editing
- Automatic AI replacement
- RAG
- Embeddings
- Multiple selections
- Claim-level and passage-level citations
- Exact evidence-section highlighting
- Backend knowledge source upload and persistence
- Knowledge source search
- Insert knowledge source content into the editor
- Voice conversation
- AI voice replies
- Text-to-speech
- Third-party or server-side speech recognition
- Backend audio uploads
- Audio recording storage
- Wake words
- Automatic voice submission
- Additional asset renderers for icons, logos, QR codes, signatures, badges,
  shapes, and watermarks
- Dynamic asset fields for date, company, user, department, and version
- Custom asset and stamp creator
- Asset persistence and shared favorites
- QR code and signature authoring tools
- Asset export workflows

---

## Development Workflow

For every task:

1. Implement only the requested milestone.
2. Run TypeScript, production build, and lint.
3. Verify the implementation manually.
4. If UI changed, verify desktop and mobile layouts and take screenshots.
5. Review the implementation for production quality.
6. Stage all milestone changes.
7. Commit with a clear, professional commit message.
8. Keep the working tree clean.

For every milestone, return only:

1. Summary
2. Files Created
3. Files Modified
4. Verification Results
5. Technical Debt
6. Deferred Improvements
7. Commit Hash
8. Commit Message

---

## Quality Expectations

This project should feel comparable to:

- Notion
- Linear
- Craft Docs
- Medium

Focus on:

- Excellent UX
- Excellent accessibility
- Clean code
- Long-term maintainability

Do not optimize for shipping the most code.

Optimize for shipping the best code.

---

## Default Behavior

Unless explicitly instructed otherwise:

- Never redesign architecture.
- Never introduce speculative abstractions.
- Never implement future roadmap items.
- Never add dependencies without clear justification.
- Prefer small, focused commits.
- If unsure, choose the simpler solution.

This document is the single source of truth for the project.
