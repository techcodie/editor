# Environment Configuration

The SDK itself does not require environment variables. The variables below
configure the repository demo application and its reference Node AI server.
Host applications may instead provide their own AI endpoints through
`DocumentEditorConfig.ai`.

## Variable Reference

| Variable | Scope | Required | Purpose | Development | Production |
| --- | --- | --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Frontend build | Only for a separate API origin | Absolute origin used by the repository app for all five AI endpoints | Empty for the Vite proxy | Render API origin, such as `https://techcodie-editor-api.onrender.com` |
| `AI_PROVIDER` | Server | Optional | Selects the active AI provider: `openai` (default) or `groq` | `openai` | `openai` unless the deployment specifically wants Groq |
| `OPENAI_API_KEY` | Server secret | Required when `AI_PROVIDER=openai` (default) | Authenticates server-side OpenAI requests | A development project key | A separate production project key |
| `OPENAI_MODEL` | Server | Optional | OpenAI production model ID — `gpt-4.1`, `gpt-4o`, or `gpt-4o-mini` | `gpt-4o-mini` | `gpt-4o-mini` unless quality requirements justify `gpt-4o` or `gpt-4.1` |
| `OPENAI_API_URL` | Server | Optional | OpenAI-compatible HTTPS chat-completions endpoint | Official OpenAI endpoint | Official OpenAI endpoint; custom values must use HTTPS |
| `OPENAI_TIMEOUT_MS` | Server | Optional | Cancels stalled provider streams | `30000` | `30000`, allowed range 1,000-120,000 ms |
| `GROQ_API_KEY` | Server secret | Required only when `AI_PROVIDER=groq` | Authenticates server-side Groq requests | A development project key | A separate production project key |
| `GROQ_MODEL` | Server | Optional | Groq production model ID | `llama-3.1-8b-instant` | `llama-3.1-8b-instant` unless quality requirements justify another production model |
| `GROQ_API_URL` | Server | Optional | Groq-compatible HTTPS chat-completions endpoint | Official Groq endpoint | Official Groq endpoint; custom values must use HTTPS |
| `GROQ_TIMEOUT_MS` | Server | Optional | Cancels stalled provider streams | `30000` | `30000`, allowed range 1,000-120,000 ms |
| `AI_SERVER_PORT` | Server | Optional | Local API port; takes precedence over `PORT` | `3001` | Leave unset on managed hosting |
| `PORT` | Server | Hosting supplied | Managed platform listening port | Unset | Supplied automatically by Render |
| `HOST` | Server | Optional | Network interface to bind | `127.0.0.1` | `0.0.0.0` |
| `CORS_ORIGINS` | Server | Required for cross-origin frontend | Comma-separated exact HTTP(S) origins allowed to call the API | `http://127.0.0.1:5173` | Exact Vercel production and preview origins that need access |
| `TRUST_PROXY` | Server | Optional | Uses the first forwarded client address for rate-limit keys | `false` | `true` only behind Render or another trusted proxy |
| `RATE_LIMIT_REQUESTS` | Server | Optional | AI requests allowed per client per window | `30` | Start at `30`, then tune from observed traffic |
| `RATE_LIMIT_WINDOW_MS` | Server | Optional | Rate-limit window duration | `60000` | `60000` |
| `NODE_ENV` | Server | Optional | Runtime mode marker | `development` | `production` |

## Secret Rules

- Never prefix `OPENAI_API_KEY` or `GROQ_API_KEY` with `VITE_`; Vite variables
  are embedded in the browser bundle.
- Store production secrets in Render's Environment settings, not in `.env`,
  source control, screenshots, or frontend code.
- Use separate provider projects and keys for development and production.
- Rotate the production key periodically and immediately after suspected
  exposure.
- `identity.token` is supplied at runtime by the host application and is not an
  environment variable owned by this SDK.

## Local Setup

```sh
cp .env.example .env
# Add OPENAI_API_KEY to .env (or set AI_PROVIDER=groq and add GROQ_API_KEY)
npm ci
npm run dev
```

The frontend is available at `http://127.0.0.1:5173`; the local API listens on
`http://127.0.0.1:3001`.
