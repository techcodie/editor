# Document Editor SDK

React, TypeScript, Vite and Tiptap document editor foundation with an Ask Document assistant.

## Local development

Create a local `.env` from `.env.example` and set `GROQ_API_KEY`. The key is read only by the Node backend and is never exposed to Vite or browser code.

```sh
npm install
npm run dev
```

The editor runs at `http://127.0.0.1:5173` and proxies `/api` requests to the stateless backend on port `3001`.

## Production

```sh
npm run build
npm start
```

The production server exposes the Ask Document endpoint and serves the built editor from the same origin.
Set `HOST=0.0.0.0` in a container or deployment environment that must accept external traffic.
