import { mkdir, writeFile } from 'node:fs/promises'

const worker = `const NOT_FOUND = new Response('Not found', { status: 404 })

function withIndex(pathname) {
  return pathname.endsWith('/') ? \`\${pathname}index.html\` : pathname
}

async function fetchAsset(request, env, pathname) {
  const url = new URL(request.url)
  url.pathname = pathname
  return env.ASSETS.fetch(new Request(url, request))
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const direct = await fetchAsset(request, env, withIndex(url.pathname))

    if (direct.status !== 404) {
      return direct
    }

    if (request.method === 'GET' && request.headers.get('accept')?.includes('text/html')) {
      return fetchAsset(request, env, '/index.html')
    }

    return NOT_FOUND
  },
}
`

await mkdir('dist/server', { recursive: true })
await writeFile('dist/server/index.js', worker)
