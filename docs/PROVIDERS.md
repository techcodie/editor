# Provider Inventory

Pricing and free-plan limits were checked on August 6, 2026. Provider terms and
limits can change; verify them before enabling paid production traffic.

| Provider | Purpose | Required | Pricing / free tier | Recommended plan | Key setup | Free alternative |
| --- | --- | --- | --- | --- | --- | --- |
| [OpenAI](https://openai.com/api/pricing/) | Default provider for Ask Document, Selection AI, compliance recommendations, contract summary refinement, and explicit writing rewrites | Required only for hosted AI workflows (default `AI_PROVIDER`) | Supports `gpt-4.1`, `gpt-4o`, and `gpt-4o-mini`; current pricing and free-tier terms are published on OpenAI's own pricing page. | `gpt-4o-mini` for evaluation and low-cost production traffic; `gpt-4o`/`gpt-4.1` where quality requirements justify the cost | Create a project key at [OpenAI API Keys](https://platform.openai.com/api-keys). Put it in local `.env` and Render `OPENAI_API_KEY`; never put it in Vercel or a `VITE_` variable. | Set `AI_PROVIDER=groq` to use GroqCloud instead (below), or rely on the deterministic local writing, compliance, contract, search, and redaction engines, which work without any hosted provider. |
| [GroqCloud](https://groq.com/pricing) | Alternate provider (set `AI_PROVIDER=groq`) for the same four AI workflows | Optional — only required if `AI_PROVIDER=groq` | Free plan available. `llama-3.1-8b-instant` Developer pricing is currently $0.05/M input tokens and $0.08/M output tokens. Current free limits are published in [GroqDocs](https://console.groq.com/docs/rate-limits). | Free for evaluation; Developer for commercial production capacity | Create a project key at [Groq API Keys](https://console.groq.com/keys). Put it in local `.env` and Render `GROQ_API_KEY`; never put it in Vercel or a `VITE_` variable. | The deterministic local writing, compliance, contract, search, and redaction engines continue to work without a hosted provider. |
| Browser Web Speech API | Voice dictation and editor voice commands | Optional | Browser-provided; no usage bill or project key. Availability and language support depend on the browser and operating system. | Use where supported; keep typed input available | No key. Microphone permission is requested by the browser when the user starts voice input. | Typed Ask Document input and normal editor controls. |
| [Tesseract.js](https://tesseract.projectnaptha.com/) | Local OCR for images and scanned PDF pages | Optional and bundled | Open-source local processing; no API usage charge. Language data downloads and client CPU/memory are the practical cost. | Bundled local worker | No key. Loaded dynamically in the browser. | Digital PDF, DOCX, Markdown, and text parsing do not require OCR. |
| Local grammar and writing engines | Grammar, spelling, tone, style, readability, scoring, and local rewrite rules | Included | Free, deterministic, and browser-local. | Default | No key. | Hosts may register a future external grammar adapter, but none is required. |
| Local mock image provider | Demonstration image-generation contract and insertion flow | Included demonstration provider | Free and browser-local; it does not call a generative image service. | Use for SDK demonstrations only | No key. | Register a host-owned image provider when real generation is required. |
| Google Search link | Opens a search for explicitly selected editor text | Optional | Normal end-user Google Search; no API integration or key. | Default link behavior | No key. Selected text is placed in the search URL only after the user activates the command. | Copy the selected text and use any search engine manually. |

## Not Required

This release does not require Anthropic, Gemini, Azure AI, Pinecone, Qdrant,
Supabase, a database, object storage, Redis, email, or an authentication
vendor. Identity providers are host adapter contracts only; no real SSO vendor
connection is included.
