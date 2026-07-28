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
- Typed configuration, event, plugin, theme, AI, knowledge-source,
  collaboration, search, embedding, and knowledge-graph contracts.
- Selection AI action constants and validation.

Package export maps allow only the root API, `styles.css`, and package metadata.
Internal components, Tiptap adapters, services, hooks, and knowledge parsers are
not importable package subpaths. The published SDK is ESM with declarations,
declaration maps, JavaScript source maps, preserved module boundaries for tree
shaking, and externalized runtime dependencies.

### Configuration and Events

`DocumentEditorConfig` supports initial content, placeholder, theme, readonly
mode, toolbar, voice, AI endpoints, Knowledge Sources, preview, streaming,
animations, keyboard shortcuts, command palette, collaboration, callbacks, and
plugins.
Configuration is resolved once per controller instance. Runtime validation
provides prefixed warnings, ignores unknown options, and safely falls back for
invalid nested values.

Each controller owns a typed event target. Public callbacks and `events.on`
cover editor readiness and changes, selection changes, AI request and response
lifecycle, insertions, Knowledge Source add/remove/activation, preview open and
close, collaboration status and presence changes, and errors. Events expose
public data contracts only. Semantic Search also emits index-size and
completed-query events without exposing indexed document content.

### Plugin Architecture

Version 1.0 includes lightweight, instance-scoped plugins. A plugin has a stable
name and a `setup` function receiving resolved configuration, typed events, a
lazy Editor API getter, and scoped warnings. Setup may return cleanup logic.
Plugins cannot access private controller internals and do not introduce a global
registry, dependency injection, UI, runtime service, or global state.

### Current AI Request Flow

```text
Ask Document UI / Selection AI UI / Compliance Engine / Contract Intelligence
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

The four current AI workflows are:

- Ask Document: current document, explicitly active Knowledge Sources, question,
  and recent conversation history.
- Selection AI: selected text, action, and optional current-document context.
- Compliance AI: current document and prioritized deterministic findings for
  optional recommendation enrichment.
- Contract AI: deterministic clauses, obligations, dates, risks, configured
  playbook gaps, and current document content for optional summary refinement.

All four workflows use the shared streaming transport and return server-sent events.
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

### Enterprise Document Comparison Flow

```text
Compare Toolbar Control
        |
        v
Original + Modified Documents
        |
        v
Word-Level Diff Engine
        |
        v
Existing TrackChange Model
        |
        v
Split / Unified Comparison Viewer
        |
        v
Comparison Change Sidebar
```

Document Comparison Phase 1 is a lazy-loaded workspace composed above the
editor. It reads the current document through the Editor API and accepts a
second document or version as local input. The `diff` package supplies the core
word-level algorithm; the comparison engine converts its output into the
existing `TrackChange[]` contract and does not introduce a parallel review
model.

The viewer supports synchronized side-by-side scrolling, a unified redline,
line-level browser rendering containment for long documents, change selection,
search, filters, document-order navigation, and local accept/reject decisions.
Formatting-only Markdown marker changes are classified as format changes.
Comparison inputs and decisions remain browser-memory state and do not create
version records or modify editor content.

### Enterprise Page Layout Flow

```text
Page Layout Toolbar Control
        |
        v
Instance-Local Page Layout State
        |
        v
Pagination Engine
        |
        v
Editor API
        |
        v
Visual Page Surface / Print Preview
```

Page Layout Phase 1 composes a visual pagination layer above the existing
editor. Paper size, orientation, margins, headers, footers, page numbers, and
manual page breaks remain instance-local layout state. The pure pagination
engine consumes measured top-level editor blocks and returns page geometry,
visual offsets, and navigation metadata. Automatic and manual pagination do
not add nodes to or otherwise rewrite document content.

Layout controls and preview components communicate with the editor only through
the Editor API. The API owns page-surface measurement, visual block offsets,
cursor-page calculation, manual-break mapping, pagination subscriptions, and
temporary readonly preview mode. The print preview is lazy-loaded and renders
content only for the current page and its immediate neighbors.

### Enterprise Watermark Flow

```text
Watermark Toolbar Control
        |
        v
Instance-Local Watermark State
        |
        v
Watermark Engine
        |
        v
Shared Page Overlay Renderer
        |
        v
Editor Pages / Print Preview
```

Watermark Phase 1 adds a visual page-overlay layer without changing editor
content. Text, PNG, SVG, and company-logo watermarks share one model, assignment
engine, and memoized renderer. Position, rotation, opacity, scale, image fit,
placement locking, and document/current/range/even/odd page assignment remain
instance-local workspace state.

Watermark controls do not import or call Tiptap. The shared `WatermarkLayer` is
non-interactive, hidden from assistive technology, and rendered below editable
content. The editor surface and print preview reuse the same page-aware overlay
renderer so placement remains consistent without duplicating decorations or
causing editor transactions.

### Page Overlay Architecture

Page overlays are composed by the workspace from framework-neutral page
geometry. Each overlay receives page number, top position, width, and height;
the assignment engine decides whether a watermark applies to that page. Overlay
DOM uses no pointer events and page-level rendering containment, preserving
selection, editing, keyboard navigation, and responsive document scrolling.
Uploaded watermark images remain browser-memory data URLs and are not inserted
into the editor document.

### Enterprise Export Flow

```text
Export Toolbar Control
        |
        v
Export Manager
        |
        v
Shared Document Renderer
        |
        v
Page Layout / Watermark / Asset Serializers
        |
        v
Lazy Format Adapter
        |
   PDF / DOCX / HTML
```

Export Phase 1 captures an immutable, framework-neutral document snapshot
through the Editor API. The shared document renderer converts that snapshot,
the current page layout, manual page breaks, watermark, comments, suggestions,
and document-native assets into one normalized page model. Each format adapter
consumes that model; UI and export services never access Tiptap directly.

### Renderer Pipeline

The renderer preserves headings, paragraphs, lists, task items, block quotes,
code blocks, horizontal rules, tables, inline marks, embedded images, and
enterprise assets. It reuses page metrics and block pagination from the Page
Layout Engine, page assignment from the Watermark Engine, and the existing SVG
Stamp Renderer through the asset serializer. One snapshot is rendered once per
job, and each job keeps its own options and browser-memory result.

### Format Adapters

- PDF uses PDF-lib for fixed-layout pages, headers, footers, page numbers,
  watermarks, tables, rasterized images, and enterprise assets.
- DOCX uses docx for editable structured content, page geometry, headers,
  footers, page numbers, tables, images, assets, and review appendices. Text
  watermarks use a header representation pending native floating-watermark
  support.
- HTML Archive produces a standalone `.html` document with embedded CSS,
  embedded data assets, page layout, watermark overlays, and no external
  runtime dependencies.

PDF, DOCX, and HTML adapters are separate on-demand chunks. Export jobs and
repeat-download history remain instance-local browser state.

### Enterprise Document Intelligence Flow

```text
Document Intelligence Toolbar
        |
        v
Local Import Pipeline
        |
        v
Parser / Lazy OCR / Layout Analyzer
        |
        v
Structured DocumentModel
        |
   +----+----+
   v         v
Editor API   Knowledge Sources / AI Context
```

Document Intelligence Phase 1 analyzes local PNG, JPEG, PDF, scanned PDF,
DOCX, TXT, and Markdown inputs. Digital PDFs and existing document parsers are
reused; image-only pages load Tesseract.js on demand and retain paragraph-level
confidence and bounding boxes. The pipeline then classifies layout blocks,
extracts available metadata, and creates a browser-memory token index and an
AI-ready context string.

The framework-neutral `DocumentModel` owns pages, blocks, paragraphs, tables,
images, metadata, recognized text, language, confidence, and search data. The
responsive import workspace renders original, structure, and text views from
that model. Explicit insertion uses the Editor API, while saving as a Knowledge
Source hands the already analyzed text to the existing Ask Document session.
No UI component imports Tiptap, and no persistent index or backend document
upload has been introduced.

### Enterprise Compliance Analysis Flow

```text
Compliance Toolbar Control
        |
        v
Compliance Panel
        |
        v
Compliance Engine
        |
        v
Structured DocumentModel
        |
   +----+----+
   v         v
Local Rules  Optional AI Recommendations
        |
        v
Review / Track Changes / Ask AI / Report Export
```

Compliance Phase 1 converts live editor text into the existing structured
`DocumentModel` and runs deterministic checks for missing clauses, empty
sections, duplicate clauses, placeholders, inconsistent dates, undefined
terms, broken references, missing signatures, and long paragraphs. Findings
share one risk model with stable locations, confidence, severity, and advisory
recommendations. A confidence-weighted quality scorer returns a 0-100 score and
low, medium, high, or critical document risk.

Results are cached by document fingerprint and analysis reruns incrementally
while the panel is active. The existing streaming transport and server-only
Groq provider may enrich the highest-priority findings with grounded proposed
text through `/api/compliance-analysis`; local analysis remains complete when
AI is unavailable. The panel never modifies content automatically. Explicit
actions locate content through the Editor API, create existing review comments,
create pending tracked insertions or replacements, hand a grounded question to
Ask Document, or download a standalone advisory HTML report.

### Future Compliance Architecture

The structured model and Compliance Engine contracts are the shared input
boundary for future GDPR, HIPAA, ISO, SOC 2, company-policy, and legal rule
packs, plus AI redaction and contract intelligence. Future rule packs must
produce the current finding model instead of introducing format-specific
analysis paths. Legal certification, cloud compliance services, persistent
analysis, and realtime collaborative analysis remain separate capabilities.

### Enterprise Form Builder Flow

```text
Form Builder Toolbar Control
        |
        v
Field Palette / Properties / Preview
        |
        v
Field Registry / Validation Engine
        |
        v
Editor API
        |
        v
Protected Form Field Node / Page Layout
```

Form Builder Phase 1 adds text, paragraph, number, email, phone, date, time,
checkbox, radio group, dropdown, signature placeholder, file-upload
placeholder, initials, and currency fields. Each field definition stores a
stable ID, label, placeholder, required and readonly state, default value,
help text, validation, options, page, width, height, visibility, position, and
host metadata in an atomic document node. Normal text editing cannot modify a
field definition.

Builder UI communicates only through the Editor API. The API owns field
insertion, updates, deletion, enumeration, node selection, and range focus.
The responsive panel provides a memoized registry palette, selected-field
properties, validation rules, and an interactive local preview. Preview values
and errors are instance-local and are never submitted or persisted.

The shared export renderer preserves form definitions. PDF renders fixed visual
placeholders, DOCX renders editable-looking placeholders with hidden Techcodie
field metadata, and standalone HTML emits native interactive controls with
validation attributes. Compliance analysis consumes the same serialized field
definitions to flag empty labels, duplicates, invalid validation, and forms
without required fields.

### Future Form Submission Architecture

Submission APIs, databases, authentication, workflow automation, approval
routing, electronic signatures, conditional fields, calculations, repeating
sections, dynamic visibility, analytics, OCR field mapping, and backend
validation remain host-owned future integrations. They must consume the
current `FormDefinition` and `FormField` contracts rather than introducing a
second field model.

### Future Print Architecture

The current layout, watermark model, preview, and export renderer establish
paper metrics and a reusable page representation for future print adapters.
Native browser printing, persisted layout metadata, section-aware pagination,
columns, print-provider integration, and DOCX-native floating watermarks remain
deferred. Export Phase 1 generates local files but does not call `window.print`
or introduce a print queue.

### Future Cloud Export

Export results are generated and downloaded locally. Cloud storage, shared
links, email delivery, provider uploads, batch jobs, encryption, passwords,
digital signatures, and print queues remain host-owned future integrations.
No network request, upload provider, persistent export history, or global job
registry is introduced in Phase 1.

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

Document Comparison reads current document text through the Editor API. Its
viewer, diff services, and change sidebar remain framework-neutral and do not
access Tiptap or ProseMirror.

Page Layout UI also remains framework-neutral. It uses Editor API methods for
visual pagination, page-break commands, page navigation state, and readonly
preview mode; no layout component imports Tiptap or ProseMirror.

Form Builder UI also remains framework-neutral. It uses Editor API methods for
protected field insertion, configuration, deletion, enumeration, and focus.
Only the internal form-field node and Editor API adapter access Tiptap.

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

### Enterprise Document Comparison

- Opens from the formatting toolbar as a lazy-loaded full comparison workspace.
- Compares document-to-document or version-to-version text using named local
  sources without changing editor content.
- Converts word-level diff output into the existing insertion, deletion,
  replacement, and formatting `TrackChange` records.
- Supports synchronized side-by-side and unified redline views with green,
  red, amber, and blue change treatments.
- Provides total and per-type counts, word and character differences, and
  estimated reading-time difference.
- Supports change search, type and status filters, document/type sorting,
  mini-overview navigation, jump, previous/next, and accept/reject decisions.
- Uses line-level browser rendering containment for long comparison documents.
- Comparison data is instance-local. No version repository, persistence,
  three-way comparison, audit report, or editor replacement is included.

### Enterprise Page Layout

- Renders A4, A5, A3, Letter, Legal, Executive, and custom paper sizes in
  portrait or landscape orientation.
- Supports Normal, Narrow, Wide, and custom margins plus configurable headers,
  footers, page-number position and alignment, and first-page hiding.
- Automatically paginates measured editor blocks without modifying document
  content and recalculates when content, layout, or available width changes.
- Supports explicit, removable visual page breaks mapped through editor
  transactions and a current-page indicator for long documents.
- Provides a responsive Page Layout panel that remains available while the
  document scrolls on desktop and becomes a bounded overlay on smaller screens.
- Provides a lazy-loaded readonly print preview with 50%, 75%, 100%, 125%,
  150%, and Fit Width zoom, mini-page navigation, Page Up/Page Down controls,
  Escape dismissal, focus restoration, and nearby-page rendering.
- Page layout and manual breaks are session-local. Printing, export, persisted
  layout metadata, sections, columns, and image layout are not included in Page
  Layout Phase 1. Watermarks are provided by the separate overlay layer below.

### Enterprise Watermarks

- Supports text, PNG, SVG, and company-logo watermark overlays without changing
  document content.
- Provides CONFIDENTIAL, DRAFT, SAMPLE, COPY, INTERNAL, and custom text options
  with font, color, opacity, position, rotation, and placement locking controls.
- Supports fit/fill image sizing and live scale controls for uploaded PNG and
  SVG assets up to 5 MB.
- Applies watermarks to the entire document, current page, custom page ranges,
  even pages, or odd pages through the shared page-assignment engine.
- Reuses one memoized, non-interactive overlay renderer across editable pages
  and print preview, preserving editor selection and interaction.
- Watermark configuration and uploaded image data remain session-local. Print
  embedding, dynamic fields, QR codes, and generated watermarks are not
  included in Phase 1.

### Enterprise Export

- Generates downloadable PDF, DOCX, and standalone HTML files through one
  framework-neutral document renderer.
- Reuses current paper size, orientation, margins, manual pagination, headers,
  footers, page numbers, watermarks, images, tables, and enterprise assets.
- Supports optional comments, tracked changes, flattened suggestions,
  watermarks, assets, and export metadata.
- Exposes queued, rendering, generating, finalizing, completed, and failed job
  states with progress feedback and browser-memory repeat-download history.
- Lazy-loads the dialog, PDF adapter, DOCX adapter, and HTML adapter so exporter
  libraries do not increase the initial application bundle.
- Export remains local. Cloud storage, shared links, email delivery, encryption,
  digital signatures, and persistent job history are not included in Phase 1.

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

Form Builder derives definitions from protected nodes in the current editor
document. Builder selection, preview values, validation messages, and panel
state remain local to the editor workspace; no global form store or submission
state has been introduced.

Version History uses an instance-scoped storage adapter composed by the editor
workspace. Timeline filters, restore previews, and comparison state remain
local to the history panel. Snapshots are document-scoped and do not introduce
a global store, cloud service, or collaboration state.

Approval Workflow uses a document-scoped local workflow record composed by the
editor workspace. Stage configuration, reviewer decisions, validation, and
audit history remain local to the workflow panel. It coordinates existing
History, Compliance, Review, Track Changes, and Export services without a
global store or React Context.

Real-time Collaboration uses one instance-scoped engine composed by the editor
workspace. Presence, awareness, transport, operation sync, and conflict state
remain inside that editor instance. It shares document, comment, suggestion,
and workflow updates through typed transport messages without React Context or
a global collaboration store.

### Enterprise Version History Flow

```text
History Toolbar Control
        |
        v
History Panel / Timeline
        |
        v
Version Manager
        |
        v
Compressed Snapshot Engine
        |
        v
Instance Storage Adapter
        |
        v
Editor API / Existing Comparison Engine
```

Version History Phase 1 stores named, audit-aware document snapshots through
an instance-scoped browser storage adapter. Each version records its author,
time, description, reason, comments, document hash, source, word count,
bookmark, and favourite state. Full snapshots are gzip-compressed when the
browser supports it; later snapshots use prefix/suffix deltas when that is
smaller. Snapshot resolution validates dependency chains, and deleting a base
snapshot materializes dependent deltas before removal.

History UI communicates with the editor only through the Editor API. The API
owns whole structured-document replacement during restore. Every restore first
persists an automatic recovery snapshot of the live document, then resolves
and applies the selected snapshot. Timeline browsing, search, filters, sorting,
metadata editing, deletion, portable version export, timeline export, and
comparison-report export remain explicit user actions.

Saved-version comparisons call the existing Document Comparison Engine and can
open the existing full comparison workspace with seeded version documents.
History does not introduce another diff implementation and does not replace
editor undo or redo.

### Enterprise Approval Workflow Flow

```text
Workflow Toolbar Control
        |
        v
Approval Panel / Review Stages
        |
        v
Workflow Engine / Validator
        |
   +----+----------------+----------------+
   v                     v                v
Version Snapshot   Compliance Guard   Review Annotations
        |                     |                |
        +---------------------+----------------+
                              |
                              v
                     Immutable Audit Timeline
```

Approval Workflow Phase 1 provides Draft, In Review, Changes Requested,
Approved, Rejected, and Archived document states. Draft workflows support
ordered stages, descriptions, due dates, reviewer assignment, reassignment,
removal, and local reviewer notes. Active stages support explicit approval,
rejection, change requests, stage skipping, review notes, and linked existing
comments. Every transition records the acting reviewer, time, previous and next
status, stage, reason, notes, linked comment IDs, and related snapshot ID.

Every approval decision creates a document snapshot through the existing
Version History manager before changing workflow state. Approval can optionally
block on critical Compliance findings and can require all tracked suggestions
to be resolved. Validation runs in the background while the panel is active.
PDF, DOCX, and HTML exports can include the workflow status, stages, reviewers,
and audit timeline. The panel and services do not access Tiptap directly.

### Future Workflow Automation

The stage, reviewer, decision, guard, audit-entry, snapshot, and serialization
contracts are the boundaries for future authentication, role permissions,
server persistence, notifications, electronic signatures, conditional routing,
parallel approvals, delegated approvals, and organization policy templates.
Phase 1 is local and single-user; future automation must coordinate these
contracts rather than introduce a second workflow model.

### Enterprise Real-time Collaboration Flow

```text
Editor / Review / Workflow
        |
        v
Collaboration Engine
        |
   +----+------------------+
   v                       v
Sync Engine          Awareness Engine
   |                       |
   +-----------+-----------+
               v
       Transport Adapter
               |
               v
 Browser Channel or Host WebSocket
```

Collaboration Phase 1 provides live presence, cursors, selections, typing
state, connection quality, batched document synchronization, comment and
suggestion identity, workflow status updates, and automatic collaborative
history checkpoints. The Editor API now reports document-change origin and
provides framework-neutral selection geometry; collaboration UI and services
never access Tiptap directly. Remote document updates are marked at the adapter
boundary so they are not echoed as new local operations.

The default demo transport uses the browser `BroadcastChannel` API for multiple
tabs. SDK hosts may inject the exported native WebSocket transport or implement
the transport contract for their own backend. Phase 1 operations carry complete
validated structured snapshots with revisions, batching, duplicate rejection,
and deterministic concurrent-update reconciliation. Authentication,
authorization, and server persistence remain host responsibilities.

Collaboration code is grouped under `src/collaboration/` into components,
hooks, services, and types. Review comments, Track Changes, Workflow, History,
and the editor remain their existing modules and integrate through their public
contracts rather than moving into the collaboration module.

### Future CRDT Integration

The transport, operation, awareness, presence, and conflict contracts are the
replacement boundaries for a future CRDT-backed sync adapter. Yjs, Liveblocks,
Automerge, offline queues, presence recording, playback, and session replay can
be added behind those contracts without moving editor access outside the
Editor API or creating a parallel review model.

### Enterprise Semantic Search Flow

```text
Search Toolbar
        |
        v
Semantic Search Panel
        |
        v
Instance Search Engine
        |
   +----+----------------+----------------+
   v                     v                v
Keyword Ranking   Embedding Provider   Metadata Ranking
   |                     |                |
   +---------------------+----------------+
                         |
                         v
                  Knowledge Graph
                         |
                         v
Document Intelligence / Knowledge Sources / History / Workflow / Editor API
```

Semantic Search Phase 1 incrementally indexes the current document, ready
Knowledge Sources, up to sixty local Version History snapshots, workflow
status, and available compliance findings. Keyword relevance, deterministic
local feature-hash embeddings, document recency, and graph relationships are
combined by the hybrid ranking engine. Search results expose snippets,
relevance, matched topics, source metadata, related documents, pinning, recent
queries, and saved queries.

The knowledge graph links documents, sections, obligation-like clauses,
entities, references, shared topics, and Knowledge Sources. Graph rendering is
requested explicitly and remains local to the editor instance. Result actions
reuse the Editor API, Ask Document, Knowledge Sources, and Version History
surfaces; the search module does not access Tiptap or duplicate AI transport,
document parsing, snapshot resolution, or source management.

The public SDK exports the framework-neutral `createSearchEngine`, local
embedding provider, index/search contracts, and graph contracts. Hosts may
replace the embedding provider without changing indexing or UI composition.
No cloud vector database, external search provider, distributed index, or new
production dependency was introduced.

### Future Enterprise Retrieval

The embedding-provider and search-engine contracts are the boundaries for
future Pinecone, Weaviate, Qdrant, pgvector, OpenSearch, Azure AI Search,
GraphRAG, Enterprise RAG, federated retrieval, and cross-workspace search.
Those providers remain host-owned and must preserve explicit source selection
and the existing Editor API boundary.

### Enterprise AI Redaction Flow

```text
Redaction Toolbar
        |
        v
Sensitive Data Panel
        |
        v
Local Detection Pipeline ----> Optional Host AI Detector
        |
        v
Classification and Review
        |
   +----+-------------------+
   v                        v
Search Exclusion      Export Sanitizer
                             |
                             v
                       PDF / DOCX / HTML
```

AI Redaction Phase 1 detects common personal, financial, identity, credential,
medical, company-secret, and confidential-clause data with cached local regex
and entity rules, plus debounced rescanning while the panel is active. Hosts may
optionally provide an AI-assisted detector through
`DocumentEditorAiConfig.redactionDetector`; cloud DLP remains host-owned and is
not part of this milestone.

Detected and manually selected ranges enter instance-local review records with
confidence, classification, replacement style, reviewer decision, comments,
and an immutable audit trail. Adding a record creates a Version History restore
point. Approving a redaction never changes the editor snapshot: Semantic Search
indexes a copy with approved ranges excluded, and the shared Export Engine
sanitizes its rendered document before the PDF, DOCX, or HTML adapter runs.

The public SDK exports framework-neutral detection, classification, review,
and sanitization contracts plus pure detection and sanitization helpers. UI
selection and navigation use only the Editor API; no redaction component
accesses Tiptap.

### Future Enterprise DLP

The AI detector and custom-pattern contracts are the replacement boundaries
for future Microsoft Purview, Google DLP, AWS Macie, company policy packs,
legal hold, selective disclosure, role-based visibility, and document labels.
Permission enforcement, approval-gated exports, realtime monitoring, and cloud
DLP are intentionally deferred.

### Enterprise Contract Intelligence Flow

```text
Contract Toolbar
        |
        v
Contract Intelligence Panel
        |
        v
Deterministic Analysis Pipeline
        |
  +-----+--------+----------+---------+
  v              v          v         v
Clauses       Entities   Obligations  Dates
  |              |          |         |
  +--------------+----------+---------+
                 |
                 v
       Playbook and Risk Engine
                 |
        +--------+---------+
        v                  v
 Optional Contract AI   Local Summary
        |                  |
        +--------+---------+
                 v
 Search / Workflow / History / Export
```

Contract Intelligence Phase 1 extracts and classifies clauses, identifies
parties and contract entities, maps obligations and key dates, tracks renewal
terms, scores advisory risks, and prepares a local summary. Hosts may provide a
configuration-only `contractPlaybook` for required, forbidden, custom, and
recommended-language checks. No legal requirements are built into the SDK.

Optional Groq refinement uses `DocumentEditorAiConfig.contractEndpoint` and the
shared streaming transport. Invalid or unavailable AI output falls back to the
deterministic local summary. Analysis is cancellable, fingerprint-cached,
incrementally refreshed while its panel is active, and retained in bounded
document-scoped browser history. The original document is never changed.

Clause, obligation, and date results feed the existing Semantic Search and
Knowledge Graph index. High-priority advisory risks can participate in the
existing Approval Workflow when its contract gate is explicitly enabled.
Users can create labeled Version History checkpoints and export standalone
summary, risk, clause, and obligation reports. All document navigation uses the
Editor API.

### Future Contract Architecture

The public playbook, analysis, risk, entity, and clause contracts are the
boundaries for future host-provided LLM legal analysis, jurisdiction-specific
rules, clause recommendations, negotiation workflows, CLM integrations, and
enterprise legal AI. Legal advice, automatic negotiation, external legal APIs,
e-signatures, billing, and matter management remain intentionally deferred.

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
- Diff
- PDF-lib
- docx
- Tesseract.js

PDF.js and Mammoth are isolated to client-side Knowledge Source parsing and
preview rendering. Marked and DOMPurify are also reused by the AI insertion
normalizer to produce sanitized, schema-compatible editor content. PDF-lib and
docx are isolated to lazy export adapters for local file generation.
Tesseract.js is loaded only when an image or scanned PDF page requires OCR;
digital documents do not load the OCR runtime.

---

## Current Folder Structure

```text
server/
  providers/             Groq provider integration
  ai-response.ts         Shared AI streaming response handling
  ask-document.ts        Ask Document endpoint
  selection-ai.ts        Selection AI endpoint
  compliance.ts          Compliance AI endpoint
  contract.ts            Contract summary endpoint
  http.ts                Shared request validation and errors
  prompts.ts             Centralized AI prompts

shared/
  ai.ts                  Shared AI and Selection AI contracts
  ask-document.ts        Ask Document contracts
  compliance.ts          Compliance AI contracts
  contract.ts            Contract AI summary contracts

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
  intelligence/
    components/          Import workspace, preview modes, progress, and extraction UI
    hooks/               Import and OCR lifecycles with cancellation
    services/            Parsing pipeline, OCR, layout, metadata, classification, and index
    types/               Structured document, OCR, and layout contracts
  layout/
    components/          Layout controls, page overlays, navigation, and preview
    hooks/               Instance-local layout and pagination composition
    services/            Paper metrics and pure visual pagination
    types/               Page layout, page, break, and preview zoom contracts
  watermark/
    components/          Panel, editor, preview, assignment, and page overlay UI
    hooks/               Instance-local watermark composition
    services/            Watermark defaults, assignment, and render styles
    types/               Watermark configuration and image contracts
  export/
    components/          Export dialog, selector, options, progress, and history
    hooks/               Instance-local export job lifecycle
    services/            Renderer pipeline, serializers, manager, and adapters
    types/               Export jobs, options, results, and rendered document model
  forms/
    components/          Builder panel, field palette, properties, validation, and preview
    editor/              Internal protected form-field node and node view
    hooks/               Instance-local field list and selection composition
    services/            Registry, defaults, validation, rendering, and serialization
    types/               Form definition, field, validation, and preview contracts
  history/
    components/          Timeline, snapshot cards, restore preview, and comparison UI
    hooks/               Instance-local history lifecycle and persistence composition
    services/            Version manager, compressed snapshots, storage, and diff adapter
    types/               Version, metadata, snapshot, storage, filter, and timeline contracts
  workflow/
    components/          Approval panel, stages, reviewers, decisions, guards, and audit UI
    hooks/               Document-scoped workflow lifecycle and background validation
    services/            State transitions, decisions, snapshots, validation, storage, and history
    types/               Workflow, stage, reviewer, decision, and audit contracts
  comparison/
    components/          Workspace, toolbar, summary, viewers, sidebar, and navigation
    hooks/               Instance-local comparison lifecycle and decisions
    services/            Diff adapter, TrackChange conversion, statistics, and filtering
    types/               Comparison documents, statistics, view state, and diff segments
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
  search/
    components/          Search panel, results, filters, graph, related documents, and status UI
    hooks/               Instance-local index, query, preferences, and graph composition
    services/            Embeddings, keyword/semantic/hybrid ranking, linking, graph, and engine
    types/               Search index, result, provider, graph node, edge, and relation contracts
  redaction/
    components/          Detection, classification, review, preview, restore, and toolbar UI
    hooks/               Cancellable scanning and instance-local redaction review state
    services/            Pattern, entity, classification, review, rendering, and export sanitization
    types/               Detection, classification, redaction, audit, and provider contracts
  contract/
    components/          Contract panel, clauses, parties, duties, dates, risk, and comparison UI
    hooks/               Cancellable analysis and clause-search composition
    services/            Extraction, classification, entity, obligation, renewal, playbook, risk, summary, comparison, and orchestration
    types/               Contract, clause, entity, obligation, renewal, risk, and playbook contracts
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

**Version 1.0 Complete; Enterprise Contract Intelligence Phase 1 Complete**

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
- Lazy-loaded enterprise document comparison workspace
- Document and version source inputs with source names and swap action
- Reusable word-level diff engine converted into the existing TrackChange model
- Side-by-side comparison with synchronized scrolling and selection
- Unified redline comparison with insertion, deletion, replacement, and
  formatting visualization
- Comparison summary statistics, search, filters, sorting, mini overview,
  previous/next navigation, jump, and local change decisions
- Line-contained comparison rendering for long documents
- Visual page-based editing with automatic non-destructive pagination
- A4, A5, A3, Letter, Legal, Executive, and custom paper configuration
- Portrait and landscape orientation with preset and custom margins
- Configurable headers, footers, page numbers, alignment, and first-page hiding
- Removable manual page breaks mapped through editor transactions
- Responsive Page Layout controls, live page indicators, and current-page state
- Lazy readonly print preview with zoom, mini pages, keyboard navigation, focus
  restoration, and nearby-page rendering
- Text, PNG, SVG, and company-logo watermark overlays
- Watermark presets, custom text, font, color, opacity, position, rotation,
  image sizing, scale, and placement locking
- Entire-document, current-page, page-range, even-page, and odd-page assignment
- Shared memoized watermark rendering across editor pages and print preview
- Responsive watermark controls with keyboard dismissal and focus restoration
- Framework-neutral structured document snapshots through the Editor API
- Shared page-aware export renderer for document blocks, tables, and assets
- Local PDF generation with page layout, headers, footers, page numbers,
  watermarks, tables, images, and enterprise stamps
- Editable DOCX generation with document structure, page settings, images,
  tables, assets, and optional review appendices
- Standalone HTML export with embedded CSS and data assets
- Export content options, estimated size, staged progress, error handling, and
  repeat-download history
- Lazy-loaded export dialog and PDF, DOCX, and HTML format adapters
- Local Document Intelligence import for images, PDFs, scanned PDFs, DOCX,
  TXT, and Markdown
- Lazy image and scanned-page OCR with recognized text, confidence, and
  paragraph bounding boxes
- Framework-neutral structured document model with pages, layout blocks,
  metadata, local search index, and AI-ready context
- Original, recognized-structure, and recognized-text preview modes with
  responsive extraction and metadata summaries
- Explicit recognized-content insertion through the Editor API and direct
  handoff to the existing Knowledge Sources session
- Enterprise Compliance Panel with background progress, severity filters,
  finding navigation, responsive focus management, and cancellation
- Deterministic compliance checks for missing clauses, empty sections,
  duplicates, placeholders, dates, terms, references, signatures, and readability
- Confidence-weighted 0-100 document quality score and low-to-critical risk level
- Fingerprint-cached local reports with incremental reanalysis while active
- Optional Groq-backed recommendation enrichment through the shared AI transport
- Explicit compliance handoffs to comments, pending tracked suggestions, and
  grounded Ask Document questions
- Standalone advisory compliance report export
- Enterprise Form Builder with fourteen field types, field palette, and live
  document insertion
- Protected selectable form-field nodes with Editor API configuration, focus,
  deletion, and structured snapshot preservation
- Field properties for labels, placeholders, required and readonly state,
  defaults, help text, options, width, visibility, and validation rules
- Responsive interactive form preview with accessible native controls and
  required, length, regex, email, phone, numeric, date, and custom-hook validation
- PDF visual field placeholders, DOCX field metadata preservation, and
  interactive standalone HTML form controls
- Compliance findings for empty labels, duplicate fields, invalid validation,
  and missing required-field configuration
- Enterprise Version History with named snapshots, timeline grouping, search,
  filters, sorting, bookmarks, favourites, rename, deletion, and audit metadata
- Gzip-compressed full snapshots and size-aware incremental delta snapshots
  with dependency-safe resolution and deletion
- Restore preview with automatic recovery snapshot creation before every restore
- Saved-version and current-document comparison through the existing Document
  Comparison Engine and full comparison workspace
- Portable version, timeline, and comparison-report exports
- Instance-scoped browser storage adapter with in-memory fallback
- Enterprise Approval Workflow with Draft, In Review, Changes Requested,
  Approved, Rejected, and Archived states
- Ordered review stages with descriptions, due dates, reviewer assignment,
  reassignment, removal, notes, and per-reviewer decisions
- Explicit approve, reject, request-changes, skip-stage, note, submit, resubmit,
  archive, and restore actions
- Immutable workflow audit timeline with actors, reasons, notes, linked comments,
  status transitions, stages, and snapshot references
- Automatic Version History snapshot before every workflow decision
- Optional critical Compliance gate and resolved-suggestion approval guard
- Workflow summaries in PDF, DOCX, and standalone HTML exports
- Framework-neutral approval and workflow contracts in the public SDK types
- Instance-scoped real-time Collaboration Engine with injectable transport
  adapters and no global state
- Browser-tab collaboration through `BroadcastChannel` and an exported native
  WebSocket transport for host backends
- Live collaborator presence, avatars, cursors, selections, typing state,
  connection quality, and synchronization status
- Batched structured-document operations with origin tracking, duplicate
  rejection, deterministic conflict reconciliation, and recovery feedback
- Live comment, tracked-suggestion, and approval-workflow metadata sharing
- Automatic deduplicated Version History checkpoints after remote edits settle
- Public collaboration configuration, presence and status events, transport
  contracts, and framework-neutral editor selection geometry
- Instance-scoped Semantic Search Engine with incremental local indexing and
  cached query results
- Keyword, semantic, hybrid, recent, related-document, and Knowledge Source
  search modes with filters, snippets, relevance scores, topics, and pinning
- Deterministic local feature-hash embeddings behind an injectable public
  `EmbeddingProvider` contract
- Knowledge graph relationships across documents, sections, clauses, entities,
  references, shared topics, and Knowledge Sources
- Search integration with current editor content, parsed Knowledge Sources,
  Version History snapshots, workflow status, and compliance findings
- Saved and recent searches, related-document navigation, AI summary handoff,
  source creation, responsive UI, and typed SDK search lifecycle events
- Enterprise Sensitive Data panel with cancellable background scanning, type
  filters, confidence scores, manual selection capture, and responsive review UI
- Local regex and entity detection for personal, identity, financial, medical,
  credential, company-secret, confidential-clause, and custom policy data
- Public optional AI-assisted detector contract without a bundled cloud DLP service
- Public, Internal, Confidential, Restricted, and Highly Confidential classification
  with minimum-classification validation
- Black Box, Blur, Mask, Label, Placeholder, and Temporary Hide replacements
- Explicit approve, reject, reviewer comment, restore, navigation, and sanitized
  preview workflows with immutable audit entries
- Automatic Version History restore point for every new redaction review record
- Shared permanent sanitization of PDF, DOCX, and HTML export copies while the
  original editor document remains unchanged
- Semantic Search exclusion for approved redacted ranges
- Framework-neutral redaction types, detector, sanitizer, and engine helpers in
  the public SDK surface
- Enterprise Contract Intelligence panel with cancellable background analysis,
  responsive views, keyboard dismissal, focus restoration, and editor navigation
- Clause extraction and classification across termination, confidentiality,
  indemnity, liability, payment, warranty, IP, force majeure, governing law,
  assignment, data privacy, general, and host-defined custom clause types
- Party and contract entity detection for organisations, people, addresses,
  dates, amounts, currencies, jurisdictions, and document references
- Obligation ownership, action, due-date, status, priority, dependency, key-date,
  renewal, notice-period, and termination-window extraction
- Configuration-only contract playbooks for required, forbidden, custom, and
  recommended-language checks without bundled legal requirements
- Confidence-scored advisory risk findings and overall contract risk score with
  deterministic local summaries and optional Groq summary refinement
- Fingerprint-cached analysis, debounced active-panel updates, bounded local
  analysis history, previous-result comparison, and explicit cancellation
- Semantic Search and Knowledge Graph indexing for contract clauses,
  obligations, and dates with Editor API navigation
- Optional contract-risk Approval Workflow guard and Contract-labeled Version
  History checkpoints
- Standalone contract summary, risk, clause, and obligation report exports
- Framework-neutral contract analysis, clause, entity, obligation, date, risk,
  playbook, and comparison contracts in the public SDK surface

Architecture is verified. Ask Document and Selection AI both preserve the
Editor API boundary. Knowledge Sources remains browser-memory state and uses a
dedicated context builder to create structured Ask Document requests. Prompt
formatting and response-source metadata remain server-side. Evidence remains
source-level transparency for the exact request context; Semantic Search does
not change citation behavior or persist source content.
AI insertion remains independent of Ask Document presentation and reaches
Tiptap only through the Editor API. The command palette coordinates existing
local callbacks and reaches editor behavior only through the Editor API; no
runtime, command registry, dependency injection, or global store has been
introduced. The public event and plugin contracts remain controller-local. No
global asset store, asset persistence, custom creator, or static stamp image
catalog has been introduced. Review comments and tracked suggestions are local
workspace state and reach Tiptap only through the Editor API. Their internal
marks share one annotation pattern without a parallel store or UI-to-Tiptap
dependency. Document Comparison also reuses `TrackChange` records and obtains
editor content through the Editor API; its diff and viewer layers remain
independent from Tiptap. No known functional bugs are open.
Page Layout follows the same boundary: UI consumes framework-neutral layout and
pagination contracts while the Editor API alone measures and adjusts the Tiptap
surface. Pagination remains visual and session-local, so document content and
existing editor, AI, asset, review, suggestion, and comparison behavior are
unchanged. Export reads its structured snapshot through the same Editor API
boundary and does not mutate the document.
Watermarks extend that page-layout boundary through a separate non-interactive
overlay. The shared renderer consumes only watermark and page contracts, never
the editor instance, and uploaded images remain local browser-memory data. No
watermark persistence layer or print embedding behavior has been added.
The Export Manager renders one normalized document per job and dispatches it to
lazy PDF, DOCX, or HTML adapters. PDF-lib and docx remain isolated export
dependencies. Export results and history remain local to the editor instance;
no backend, storage provider, or global job service has been introduced.
Document Intelligence follows the same boundary: parsers and lazy OCR produce
one `DocumentModel`, the workspace consumes only that model, and editor changes
go through the Editor API. Tesseract.js is the only new production dependency.
OCR results, metadata, and search entries remain browser-memory data.
Compliance analysis consumes the same `DocumentModel`, keeps rule results and
cache entries in browser memory, and uses the Editor API for all document
selection and review actions. Its generic governance baseline is advisory, not
an industry rule pack or legal certification. The direct tracked-insertion
Editor API command reuses the existing `trackChange` mark and suggestion
registry for document-level proposed clauses without creating parallel review
state. No new production dependency was added.
Form Builder stores its definitions in protected document nodes and reaches
those nodes only through the Editor API. The registry, validation engine,
preview, serializer, export adapters, and compliance checks consume
framework-neutral field contracts. Preview values remain local and no backend
submission, authentication, approval, signature, or workflow behavior was
introduced. No new production dependency was added.
Version History captures and restores structured content only through the
Editor API. The snapshot engine, version manager, storage adapter, timeline,
and comparison adapter consume framework-neutral contracts. Restore always
creates a recovery point first, while comparisons reuse the existing engine.
Snapshots remain local to the document instance and no cloud or collaborative
service was introduced. No new production dependency was added.
Approval Workflow coordinates those existing services through framework-neutral
contracts. Decisions snapshot the document before transition, validation reads
existing compliance and suggestion state, comments remain references to the
existing review model, and exports consume a cloned workflow summary. No
authentication, permission, notification, signature, cloud, or realtime layer
was added. No new production dependency was added.
Real-time Collaboration composes the Editor API, Review, Track Changes,
Workflow, and History contracts through one instance engine. The engine batches
local structured snapshots, tags remote applications, throttles awareness,
shares annotation metadata, and schedules checkpoint snapshots. Its default
browser channel is demo and local-development infrastructure; production
identity, permissions, persistence, and WebSocket routing remain host-owned. No
new production dependency was added.
Semantic Search composes existing Document Intelligence, Knowledge Sources,
History, Workflow, Compliance, Ask Document, and Editor API contracts. Its
index, embeddings, query cache, graph, pinned results, and saved searches remain
local to the editor instance or document-scoped browser storage. The default
embedding provider is deterministic local retrieval infrastructure, not an AI
model or hosted vector service. No new production dependency was added.
Contract Intelligence composes the existing Editor API, Compliance, Semantic
Search, Knowledge Graph, Approval Workflow, Version History, Export, and shared
AI transport. Its deterministic engines operate on document text and
framework-neutral contracts; only the Editor API performs document navigation.
Playbooks remain host-owned configuration, AI enrichment is optional, reports
are advisory, and no automatic content editing or legal-service integration was
introduced. No new production dependency was added.

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
- Persisted and server-backed comment threads
- Comment mentions and notifications
- Server-backed governed review and suggestion workflows
- Comment author and permission providers
- Persisted and server-backed tracked changes
- CRDT-backed character-level collaboration and advanced conflict handling
- Yjs, Liveblocks, or Automerge provider adapters
- Offline collaboration queues and reconnect replay
- Presence recording, playback, and collaboration session replay
- Server-persisted collaboration rooms and operation logs
- Server-backed version history and legal audit records
- Persisted comparison sessions across devices
- Three-way document comparison and move detection
- Comparison report export and audit reporting
- Native browser printing and print-provider integration
- Persisted page-layout settings and manual page breaks
- Section breaks and section-specific layout
- Multi-column page layout
- Persisted watermark settings and uploaded watermark assets
- Native floating watermark embedding in DOCX and print output
- Dynamic watermark fields, QR codes, security hashes, and generated watermarks
- Page-level background image layout
- Track-change author and permission providers
- Backend form submissions and submission persistence
- Form authentication and automatic workflow routing
- Conditional fields, calculations, repeating sections, and dynamic visibility
- Electronic signatures, form analytics, and OCR field mapping
- Industry-specific compliance rule packs for GDPR, HIPAA, ISO, SOC 2, custom
  company policies, and legal domains
- Legal certification and cloud compliance services
- Microsoft Purview, Google DLP, AWS Macie, and cloud DLP providers
- Realtime sensitive-data monitoring and automatic deletion
- Redaction permission enforcement, legal hold, selective disclosure, and
  role-based visibility
- Document classification labels and approval-gated permanent export
- Encrypted and password-protected PDF export
- Digital signatures and compliance certificates
- Batch export and background export workers
- Cloud storage providers, shared links, and email delivery
- Persistent export history and server-side export jobs
- Print queues and managed print providers
- Persistence
- Autosave
- Multi-document support
- AI suggestion history
- Prompt customization
- Inline AI editing
- Automatic AI replacement
- Hosted and generative RAG
- Cloud embedding providers and model-generated embeddings
- Multiple selections
- Claim-level and passage-level citations
- Exact evidence-section highlighting
- Backend knowledge source upload and persistence
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
  and shapes
- Dynamic asset fields for date, company, user, department, and version
- Custom asset and stamp creator
- Asset persistence and shared favorites
- QR code and signature authoring tools
- Cloud and server-side OCR
- Persistent document intelligence models and search indexes
- Realtime OCR and background upload queues
- Multi-language OCR selection and automatic language detection
- Persistent compliance reports and realtime collaborative analysis
- Invoice-specific extraction
- Host-provided LLM legal analysis and external legal APIs
- Custom enterprise playbook services and jurisdiction-specific rule packs
- Clause recommendations, negotiation workflows, and CLM integrations
- Automatic contract negotiation, legal advice, e-signatures, billing, and
  matter management
- Cloud vector databases including Pinecone, Weaviate, Qdrant, and pgvector
- OpenSearch and Azure AI Search providers
- GraphRAG, Enterprise RAG, federated search, and cross-workspace retrieval
- Cloud history and multi-user editing
- Governed version workflows, branching, and conflict resolution
- Server-side snapshot compaction and retention policies
- Workflow authentication, role permissions, and organization policy templates
- Conditional and parallel approval routing, delegated approvals, and escalations
- Workflow notifications, email integration, realtime synchronization, and cloud persistence
- Electronic signatures and approval certificates

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
