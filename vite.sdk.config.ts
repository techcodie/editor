import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const EXTERNAL_PACKAGES = [
  'react',
  'react-dom',
  '@radix-ui/react-toolbar',
  '@radix-ui/react-tooltip',
  '@tiptap/extension-highlight',
  '@tiptap/extension-list',
  '@tiptap/extension-placeholder',
  '@tiptap/extension-text-align',
  '@tiptap/react',
  '@tiptap/starter-kit',
  'diff',
  'dompurify',
  'lucide-react',
  'mammoth',
  'marked',
  'pdfjs-dist',
]

function isExternalDependency(id: string) {
  return EXTERNAL_PACKAGES.some(
    (packageName) => id === packageName || id.startsWith(`${packageName}/`),
  )
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: false,
  build: {
    outDir: 'dist-sdk',
    sourcemap: true,
    lib: {
      entry: 'src/sdk-entry.ts',
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'styles',
    },
    rolldownOptions: {
      external: isExternalDependency,
      output: {
        preserveModules: true,
      },
    },
  },
})
