# Production Architecture

## Runtime Topology

```text
Browser / Host Application
        |
        v
Vercel CDN (Vite application or packaged SDK consumer)
        |
        | HTTPS / SSE
        v
Reference Node API on Render
        |
        | server-side API key
        v
GroqCloud
```

The editor, pagination, OCR, semantic index, knowledge-source parsing, review,
history, forms, comparison, redaction review, and export preparation run in the
browser. The reference API is stateless and handles only the five streaming AI
workflows. Authentication, durable document storage, uploads, databases, and
business rules remain responsibilities of the host application.

## Trust Boundaries

- The browser never receives `GROQ_API_KEY`.
- AI requests accept JSON only, enforce body and field limits, and are cancelled
  when the client disconnects.
- The API uses exact-origin CORS when `CORS_ORIGINS` is configured, bounded
  per-client rate limiting, provider timeouts, no-store API responses, and
  security headers.
- Imported Markdown and DOCX preview HTML is sanitized with DOMPurify before it
  reaches the preview renderer.
- Generated form values are normalized to primitive values. Built-in form
  previews use a share-specific `BroadcastChannel`; optional window messaging
  requires an explicit target origin.
- Uploaded knowledge files and OCR results stay in browser memory. They are sent
  to AI only when the user activates the source for an AI request.

## Performance Model

- Heavy panels, PDF viewing, OCR, export adapters, and document intelligence are
  dynamically imported.
- PDF.js and Tesseract workers are loaded on demand and explicitly destroyed or
  terminated.
- AI streams are abortable and frame-buffered before React state updates.
- Carousel and print views retain page geometry but render page content only for
  the current page and its immediate neighbors.
- Object URLs for imports, exports, generated forms, reports, and versions are
  revoked after use.
- Search, writing, compliance, and contract analysis use cancellation and local
  fingerprint caches where their current architecture supports it.

For very large scanned PDFs, OCR remains intentionally sequential and
user-initiated to bound concurrent memory. Production hosts should establish
document size limits appropriate to their target devices and move OCR to a
server-side job system before guaranteeing processing on low-memory mobile
hardware.

## Scaling

The reference API can run as a single stateless service. Its in-memory rate
limiter is correct for the supplied single-instance deployment. A multi-replica
production deployment needs a shared gateway or distributed rate limiter. No
database, object storage, cache, or background worker is required for the
current repository feature set.
