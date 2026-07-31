import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { build } from 'vite'

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
)
const sdk = await import(new URL('../dist-sdk/index.js', import.meta.url))

const expectedRuntimeExports = [
  'DocumentEditor',
  'BrowserVoiceProvider',
  'DOCUMENT_VIEW_MODES',
  'FORM_SUBMISSION_MESSAGE',
  'BUILT_IN_ROLE_IDS',
  'IDENTITY_PERMISSIONS',
  'IdentityManager',
  'IdentityProviderRegistry',
  'LocalGrammarProvider',
  'MemoryAuditAdapter',
  'MockImageProvider',
  'ProductivityProviderRegistry',
  'SELECTION_AI_ACTIONS',
  'VIEWER_ZOOM_LEVELS',
  'VOICE_COMMANDS',
  'WRITING_REWRITE_ACTIONS',
  'clearDetectionCache',
  'clearContractAnalysisCache',
  'clearWritingAnalysisCache',
  'createBroadcastChannelTransport',
  'createEditor',
  'createFormShareArtifact',
  'createFormShareHtml',
  'createGoogleSearchUrl',
  'createIdentityManager',
  'createMemoryAuditAdapter',
  'createProductivityProviderRegistry',
  'createLocalEmbeddingProvider',
  'createLocalRewrite',
  'createRedaction',
  'createSearchEngine',
  'createViewerPages',
  'createWebSocketTransport',
  'analyzeContract',
  'analyzeWriting',
  'compareContractAnalyses',
  'detectSensitiveData',
  'excludeRedactedText',
  'getDefaultDocumentEditorTheme',
  'getBuiltInIdentityRoles',
  'fingerprintContract',
  'isSelectionAiAction',
  'isFormSubmissionMessage',
  'matchVoiceCommand',
  'isWritingRewriteAction',
  'replacementFor',
  'normalizeSubmissionValues',
  'parseTranscriptSpeakers',
  'resolveDocumentEditorConfig',
  'revokeFormShareArtifact',
  'sanitizeTextForExport',
  'summarizeRedactions',
  'validatePlaybook',
  'validateDocumentEditorConfig',
].sort()

assert.deepEqual(Object.keys(sdk).sort(), expectedRuntimeExports)
assert.deepEqual(Object.keys(packageJson.exports).sort(), [
  '.',
  './package.json',
  './styles.css',
])

await assert.rejects(
  import('@techcodie/editor/sdk/config'),
  (error) => error?.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED',
)

const validation = sdk.validateDocumentEditorConfig({
  toolbar: 'invalid',
  callbacks: { onReady: 'invalid' },
  theme: { colors: { accent: '' } },
})
assert.equal(validation.warnings.length, 3)
assert.equal(validation.config.toolbar, true)
assert.equal(validation.config.theme.colors.accent, '#4f46e5')

const emptyDocument = sdk.validateDocumentEditorConfig({ initialContent: '' })
assert.deepEqual(emptyDocument.warnings, [])

const firstDefaults = sdk.validateDocumentEditorConfig({}).config
const secondDefaults = sdk.validateDocumentEditorConfig({}).config
firstDefaults.theme.colors.accent = '#000000'
firstDefaults.ai.askDocumentEndpoint = '/changed'
assert.equal(secondDefaults.theme.colors.accent, '#4f46e5')
assert.equal(secondDefaults.ai.askDocumentEndpoint, '/api/ask-document')

const identity = sdk.createIdentityManager({
  principal: {
    id: 'sdk-viewer',
    displayName: 'SDK Viewer',
    roleIds: ['viewer'],
  },
  context: {
    tenantId: 'tenant-1',
    organizationId: 'organization-1',
    workspaceId: 'workspace-1',
  },
})
assert.equal(identity.can('document.read'), true)
assert.equal(identity.can('document.edit'), false)
const removeRole = identity.registerRole({
  id: 'exporter',
  name: 'Exporter',
  description: 'Can read and export documents.',
  permissions: ['document.read', 'export'],
})
identity.setPrincipal({
  id: 'sdk-exporter',
  displayName: 'SDK Exporter',
  roleIds: ['exporter'],
})
assert.equal(identity.can('export'), true)
assert.ok(identity.getAuditEvents().some((event) => event.category === 'permission'))
removeRole()

const buildResult = await build({
  configFile: false,
  logLevel: 'silent',
  plugins: [
    {
      name: 'sdk-tree-shake-entry',
      resolveId(id) {
        if (id === 'virtual:sdk-tree-shake') return '\0virtual:sdk-tree-shake'
      },
      load(id) {
        if (id === '\0virtual:sdk-tree-shake') {
          return `
            import { getDefaultDocumentEditorTheme } from '@techcodie/editor'
            console.log(getDefaultDocumentEditorTheme().colors.accent)
          `
        }
      },
    },
  ],
  build: {
    minify: true,
    write: false,
    rolldownOptions: {
      input: 'virtual:sdk-tree-shake',
      external: (id) =>
        !id.startsWith('.') &&
        !id.startsWith('/') &&
        !id.startsWith('\0') &&
        id !== '@techcodie/editor',
    },
  },
})

const output = Array.isArray(buildResult) ? buildResult[0].output : buildResult.output
const bundledCode = output
  .filter((item) => item.type === 'chunk')
  .map((item) => item.code)
  .join('')
const bundleBytes = Buffer.byteLength(bundledCode)

assert.ok(bundleBytes < 10_000, `Tree-shaken helper bundle is ${bundleBytes} bytes.`)
assert.ok(!bundledCode.includes('EditorContent'))
assert.ok(!bundledCode.includes('tiptap'))

console.log(
  `SDK verification passed: ${expectedRuntimeExports.length} runtime exports, ` +
    `${bundleBytes}-byte helper bundle.`,
)
