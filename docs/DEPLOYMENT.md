# Deployment

This repository deploys as two separate services:

- **Backend** (`server/`, the Groq-backed AI proxy + static-file fallback) → **Render**
- **Frontend** (the Vite app in `src/`) → **Vercel**

They are independent deployments connected over HTTPS: Vercel serves the static
app and proxies `/api/*` requests to the Render service (see `vercel.json`).

## 1. Deploy the backend to Render

The repo includes `render.yaml` (a Render Blueprint) that pins the exact build
command, start command, health check, and Node version so the service
deploys the same way every time.

1. In the Render dashboard: **New → Blueprint**, point it at this repo/branch.
   Render will read `render.yaml` and create the `techcodie-editor-api` web
   service automatically.
2. Set the required secret environment variables on the service (these are
   marked `sync: false` in `render.yaml`, so Render won't set them for you):
   - `GROQ_API_KEY` — required. Requests fail with a 503 until this is set.
   - `CORS_ALLOWED_ORIGIN` — recommended for production. Comma-separated list
     of exact origins allowed to call the API (e.g.
     `https://your-app.vercel.app,https://your-custom-domain.com`). If left
     unset, the API allows any origin — acceptable since every endpoint is a
     stateless JSON/SSE proxy with a server-only API key and no
     cookies/sessions, but tighten this for stricter deployments.
3. Deploy. Render will run `npm ci && npm run build:server`, then
   `npm start`, and poll `GET /healthz` (returns `{"status":"ok"}`) to confirm
   the service is live.
4. Copy the resulting service URL (`https://<service>.onrender.com`).

If you don't use the Blueprint, configure an equivalent Node web service by
hand with these exact settings:

| Setting | Value |
|---|---|
| Build Command | `npm ci && npm run build:server` |
| Start Command | `npm start` |
| Health Check Path | `/healthz` |
| Node Version | `>=22.12.0` (set `NODE_VERSION=22.12.0` or add a `.node-version` file) |
| Environment Variables | `GROQ_API_KEY`, `GROQ_MODEL` (optional, defaults to `llama-3.1-8b-instant`), `HOST=0.0.0.0`, `CORS_ALLOWED_ORIGIN` |

The Build Command must run a full `npm ci` (not `--omit=dev`/`--production`):
`typescript` and `@types/node` are devDependencies needed to compile the
server, even though the compiled output only needs plain Node to run.

## 2. Point Vercel at the Render backend

`vercel.json` proxies `/api/*` to the Render service so the frontend can keep
calling relative paths (`/api/ask-document`, etc.) unchanged in every
environment.

1. **Required manual step:** open `vercel.json` and replace
   `https://YOUR-RENDER-SERVICE.onrender.com` with the real Render URL from
   step 1.4 above, then commit that change. (The Render URL isn't known until
   after the first Render deploy, so this can't be pre-filled.)
2. In the Vercel dashboard: **New Project**, import this repo.
3. Vercel reads `vercel.json` for the build settings:

   | Setting | Value |
   |---|---|
   | Install Command | `npm ci` |
   | Build Command | `npm run build:app` |
   | Output Directory | `dist` |

4. No frontend environment variables are required for the default setup —
   the SDK's AI endpoints default to relative `/api/...` paths, which the
   `vercel.json` rewrite forwards to Render.
5. Deploy. Verify the deployed app can open **Ask Document** and receive a
   streamed response — this exercises the full Vercel → Render → Groq path,
   including CORS if you're calling Render directly instead of through the
   rewrite (e.g. a preview deployment on a different domain not listed in
   `CORS_ALLOWED_ORIGIN`).
6. Confirm PDF preview and OCR import still work after deploy — both load a
   web worker (`pdfjs-dist`, `tesseract.js`) as a separate on-demand chunk;
   this only fails if a CDN/proxy in front of Vercel strips or misroutes
   `Content-Type` for `.wasm`/worker assets, which the default Vercel static
   hosting does not do.

## 3. Local verification before every deploy

```bash
npm ci
npm run typecheck     # tsc project references, zero errors
npm run lint           # oxlint, zero errors
npm run build:server   # compiles server/ + shared/ -> dist-server/
npm run build:app      # compiles + bundles the frontend -> dist/
npm run verify:release # runs all four of the above in sequence
```

To smoke-test the production server build locally:

```bash
npm run build:server
GROQ_API_KEY=... npm start
curl -i http://localhost:3001/healthz
```

## Notes

- `npm run build` (no suffix) builds the app, the publishable SDK package,
  and the standalone example — that's the release pipeline for the
  `@techcodie/editor` npm package, not the Render/Vercel deploy path. Render
  only needs `build:server`; Vercel only needs `build:app`.
- The backend also serves `dist/` directly as a fallback static file server
  (see `server/http.ts`) for same-origin, single-service deployments. The
  Render+Vercel split described here does not rely on that path, since Render
  never builds `dist/` — only `dist-server/`.
