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

Ask Document builds a structured request through the Knowledge Context Builder.
The frontend sends document text, ordered active sources, conversation, and the
question as separate fields. Only the backend prompt builder formats those
fields for Groq.

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

### Future UI

Any future UI component must use the Editor API.

Examples:

- Bubble Menu
- Slash Menu
- Floating Toolbar
- AI Toolbar
- Command Palette

No UI should depend directly on Tiptap.

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

---

## AI Capabilities

### Ask Document

- Opens in a responsive side panel.
- Answers questions using the current document and explicitly active Knowledge
  Sources.
- Supports suggested questions, recent conversation context, retry, clear, and
  cancellation.
- Displays the exact sources used above each completed response.
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
- Renders PDF pages and formatted DOCX, Markdown, and TXT content in a responsive
  in-app preview workspace.
- Supports parsing progress, page counts for PDFs, validation errors, parsing
  errors, preview keyboard controls, and source removal.
- Keeps Current Document active and immutable while allowing uploaded, parsed
  sources to be included or excluded from Ask Document.
- Warns when active source content is large without summarizing or truncating it.
- Rejects empty, unsupported, and files larger than 25 MB before parsing.
- Sends active parsed source text only as part of an explicit Ask Document
  request; it does not upload or persist sources separately.

AI request parsing, stream handling, provider errors, and HTTP validation are
shared where practical without introducing a runtime, registry, or plugin
system.

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

---

## Runtime

Do not build the runtime yet.

The runtime will come later.

Do not create:

- Command registry
- Runtime services
- Plugin system
- Event bus
- Dependency injection
- Global stores

until explicitly requested.

---

## State Management

No Zustand.

No Redux.

No MobX.

No React Context for editor state.

Current architecture shares the editor through composition and props.

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

PDF.js, Mammoth, Marked, and DOMPurify are isolated to client-side Knowledge
Source parsing and safe preview rendering.

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
  components/
    AskDocument/         Document chat UI
    DocumentEditor/      Editing surface
    EditorWorkspace/     Editor composition and layout
    SelectionAI/         Selection toolbar and result preview
    Toolbar/             Formatting controls
  knowledge/
    components/          Source list, cards, and upload dialog
    hooks/               Local source and preview state
    preview/             Preview workspace and format-specific viewers
    services/            Local parsers, PDF loading, and AI context building
    types/               Source contracts, validation, and file helpers
  hooks/
    useSpeechRecognition.ts  Native browser speech recognition lifecycle
  services/              Shared frontend AI streaming services
  lib/editor-api.ts      Tiptap boundary and editor command API
  styles/editor.css      Editor typography and content styling
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

Architecture is verified. Ask Document and Selection AI both preserve the
Editor API boundary. Knowledge Sources remains browser-memory state and uses a
dedicated context builder to create structured Ask Document requests. Prompt
formatting remains server-side. No embeddings, retrieval, source persistence,
or citation generation has been introduced. No known functional bugs are open.

---

## Intentionally Deferred

These are not missing. Do not implement unless requested.

- Runtime
- Command registry
- Upload providers
- Storage providers
- Collaboration
- Comments
- Track changes
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
- Knowledge source citations
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
