import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { build } from 'vite'

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
)
const sdk = await import(new URL('../dist-sdk/index.js', import.meta.url))

const expectedRuntimeExports = [
  'DocumentEditor',
  'SELECTION_AI_ACTIONS',
  'createEditor',
  'getDefaultDocumentEditorTheme',
  'isSelectionAiAction',
  'resolveDocumentEditorConfig',
  'validateDocumentEditorConfig',
]

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
