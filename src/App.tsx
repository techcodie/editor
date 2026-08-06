import { DocumentEditor } from './index'
import type { DocumentEditorAiConfig } from './sdk/types'

function getAiConfig(): true | DocumentEditorAiConfig {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '')
  if (!baseUrl) return true

  return {
    askDocumentEndpoint: `${baseUrl}/api/ask-document`,
    selectionEndpoint: `${baseUrl}/api/selection-ai`,
    complianceEndpoint: `${baseUrl}/api/compliance-analysis`,
    contractEndpoint: `${baseUrl}/api/contract-analysis`,
    writingEndpoint: `${baseUrl}/api/writing-assistant`,
  }
}

const ai = getAiConfig()

export default function App() {
  return <DocumentEditor config={{ ai, collaboration: true }} />
}
