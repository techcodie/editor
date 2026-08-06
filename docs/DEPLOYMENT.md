# Deployment Guide

The lowest-manual-work preview architecture is Vercel for the Vite frontend and
Render for the reference Node API. The repository includes `vercel.json` and
`render.yaml`.

## Important Plan Limits

Vercel Hobby is limited to personal or non-commercial use. Render states that
Free web services are for previews and should not be used for production; they
also sleep after 15 idle minutes. Use these free plans only for a private demo or
evaluation. A commercial production deployment should use Vercel Pro and a paid
Render web service (or equivalent host infrastructure).

## 1. Create The Groq Key

1. Visit [GroqCloud](https://console.groq.com/keys) and sign in.
2. Select or create a project for this editor.
3. Open **API Keys** and click **Create API Key**.
4. Name it `techcodie-editor-production`.
5. Copy the key once. It will be pasted into Render as `GROQ_API_KEY`.

The default `llama-3.1-8b-instant` model has a Groq free tier. Current exact
limits are shown on the Groq [rate-limits page](https://console.groq.com/docs/rate-limits).

## 2. Deploy The API To Render

1. Visit [Render](https://dashboard.render.com/) and sign in with GitHub.
2. Click **New**, then **Blueprint**.
3. Connect `techcodie/editor` and select `main`.
4. Render reads `render.yaml` and creates `techcodie-editor-api`.
5. For `GROQ_API_KEY`, paste the Groq key.
6. For `CORS_ORIGINS`, temporarily enter `http://127.0.0.1:5173`.
7. Click **Apply** and wait for the service to become live.
8. Copy the `https://...onrender.com` service URL.
9. Open `<service-url>/api/health`; it must return `{"status":"ok"}`.
10. Open `<service-url>/api/ready`; it must return `{"status":"ready","provider":"configured"}`.

## 3. Deploy The Frontend To Vercel

1. Visit [Vercel](https://vercel.com/new) and click **Add New Project**.
2. Import `techcodie/editor`.
3. Keep the detected Vite settings; `vercel.json` sets the build command and
   output directory.
4. Open **Environment Variables**.
5. Add `VITE_API_BASE_URL` and paste the Render service URL without a trailing
   slash.
6. Enable it for Production and Preview as appropriate.
7. Click **Deploy**.
8. Copy the final Vercel URL after the deployment succeeds.

## 4. Lock CORS To Vercel

1. Return to Render and open `techcodie-editor-api`.
2. Open **Environment**.
3. Replace `CORS_ORIGINS` with the exact Vercel origin, for example
   `https://editor.example.vercel.app`.
4. Add additional exact origins separated by commas only when they must call the
   API.
5. Save changes and let Render restart the service.
6. Open the Vercel site and run one Ask Document request.

When adding a custom frontend domain, add its exact origin to `CORS_ORIGINS`.
Do not use a wildcard origin.

## Rollback

- Vercel: open the project, select **Deployments**, open the last healthy
  deployment, and choose **Promote to Production**.
- Render: open the service, select **Events**, choose a previous successful
  deploy, and redeploy it.
- Rotate the Groq key if rollback follows a credential incident.

## Cost

- Personal/non-commercial preview: `$0/month` while Vercel Hobby, Render Free,
  and Groq Free limits are respected.
- Commercial production baseline: approximately `$27/month` before AI usage,
  based on one Vercel Pro developer seat (currently `$20/month`) and a small paid
  Render service (commonly starting near `$7/month`). Verify prices in both
  dashboards before purchase.
- Groq Developer usage for `llama-3.1-8b-instant` is currently `$0.05` per one
  million input tokens and `$0.08` per one million output tokens. Free-tier use
  remains `$0` within account limits.
- Database, storage, cache, and background-worker cost is `$0` because the
  current reference deployment does not provision them.
