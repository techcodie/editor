import { StrictMode, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  DocumentEditor,
  type DocumentEditorConfig,
  type DocumentEditorPlugin,
} from '@techcodie/editor'
import '@techcodie/editor/styles.css'
import './styles.css'

const analyticsPlugin: DocumentEditorPlugin = {
  name: 'example-analytics',
  version: '1.0.0',
  setup({ events }) {
    return events.on('insert', ({ target }) => {
      console.info(`[example-analytics] AI content inserted at ${target}`)
    })
  },
}

const initialContent = `
  <h1>Quarterly Planning Brief</h1>
  <p>Use this workspace to draft the launch plan, ask questions, and add supporting knowledge sources.</p>
  <h2>Release priorities</h2>
  <ul>
    <li>Complete accessibility review</li>
    <li>Publish release notes</li>
    <li>Confirm support coverage</li>
  </ul>
`

export function Example() {
  const [status, setStatus] = useState('Initializing editor')

  const config = useMemo<DocumentEditorConfig>(() => ({
    initialContent,
    toolbar: true,
    voice: true,
    ai: {
      askDocumentEndpoint: '/api/ask-document',
      selectionEndpoint: '/api/selection-ai',
    },
    knowledgeSources: true,
    preview: true,
    streaming: true,
    animations: true,
    keyboardShortcuts: true,
    commandPalette: true,
    productivity: true,
    identity: {
      principal: {
        id: 'example-administrator',
        displayName: 'Example Administrator',
        email: 'admin@example.test',
        roleIds: ['administrator'],
      },
      context: {
        tenantId: 'example-tenant',
        organizationId: 'techcodie-demo',
        workspaceId: 'quarterly-planning',
        departmentId: 'product',
      },
    },
    collaboration: {
      roomId: 'quarterly-planning-demo',
      user: {
        id: 'example-editor',
        name: 'Example Editor',
        color: '#0f766e',
      },
    },
    theme: {
      colors: {
        background: '#f3f5f7',
        accent: '#0f766e',
        selection: 'rgba(15, 118, 110, 0.2)',
      },
      radius: {
        large: '0.625rem',
      },
    },
    plugins: [analyticsPlugin],
    callbacks: {
      onReady: () => setStatus('Editor ready'),
      onEditorChange: ({ text }) =>
        setStatus(`${text.length.toLocaleString()} document characters`),
      onAIRequest: ({ workflow }) => setStatus(`${workflow} request started`),
      onAIResponse: ({ responseTime }) =>
        setStatus(`AI response completed in ${responseTime} ms`),
      onKnowledgeSourceAdded: ({ source }) =>
        setStatus(`${source.name} added as a knowledge source`),
      onCollaborationStatus: ({ connectionStatus, syncStatus }) =>
        setStatus(`${connectionStatus} · ${syncStatus}`),
      onSearch: ({ total, durationMs }) =>
        setStatus(`${total} search results in ${durationMs} ms`),
      onFormSubmit: ({ values }) =>
        setStatus(`${Object.keys(values).length} form values received`),
      onIdentityAudit: ({ action, outcome }) =>
        setStatus(`${action} · ${outcome}`),
      onError: ({ message }) => setStatus(message),
    },
  }), [])

  return (
    <main>
      <DocumentEditor config={config} />
      <footer aria-live="polite">
        <strong>SDK event</strong>
        <span>{status}</span>
      </footer>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Example />
  </StrictMode>,
)
