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

- Ask Document: document, question, and recent conversation history.
- Selection AI: selected text, action, and optional current-document context.

Both workflows use the shared streaming transport and return server-sent events.
The Groq API key remains server-only.

Ask Document voice input is a browser-only input method. The native Web Speech
API converts microphone speech into editable text before the existing Ask
Document request flow begins. Voice input never submits a question
automatically and does not change the backend or Groq integration.

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
- Answers questions using the current document.
- Supports suggested questions, recent conversation context, retry, clear, and
  cancellation.
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

No additional runtime dependencies were added for Ask Document, Selection AI,
voice input, or the UI polish milestone.

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

Architecture is verified. Ask Document and Selection AI both preserve the
Editor API boundary. No known functional bugs are open.

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
