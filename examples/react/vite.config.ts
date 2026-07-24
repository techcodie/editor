import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: '@techcodie/editor/styles.css',
        replacement: fileURLToPath(
          new URL('../../dist-sdk/styles.css', import.meta.url),
        ),
      },
      {
        find: '@techcodie/editor',
        replacement: fileURLToPath(
          new URL('../../dist-sdk/index.js', import.meta.url),
        ),
      },
    ],
  },
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
  build: {
    outDir: 'dist',
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'editor-vendor',
              test: /node_modules[\\/](@tiptap|prosemirror-)/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
})
