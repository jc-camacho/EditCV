import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const TEX_MANIFEST = new URL('./public/swiftlatex/pdftex/manifest.json', import.meta.url)

/**
 * Adds <link rel="preload"> for the TeX bundle (see src/latex/engine.js), so the
 * multi-megabyte download starts together with the page. The archive's name
 * carries a content hash, so it is read from the manifest at build time.
 */
function preloadTexBundle() {
  let base = '/'
  return {
    name: 'preload-tex-bundle',
    configResolved(config) { base = config.base },
    transformIndexHtml() {
      const { bundle } = JSON.parse(fs.readFileSync(TEX_MANIFEST, 'utf8'))
      // as="fetch" + crossorigin matches engine.js's plain fetch(), so it reuses these responses
      return ['manifest.json', bundle].map(file => ({
        tag: 'link',
        attrs: { rel: 'preload', href: `${base}swiftlatex/pdftex/${file}`, as: 'fetch', crossorigin: 'anonymous' },
        injectTo: 'head',
      }))
    },
  }
}

export default defineConfig({
  plugins: [react(), preloadTexBundle()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
  // pdfjs-dist 4 ships modern syntax (top-level await, private fields)
  build: {
    target: 'es2022',
    // pdf.js in its own chunk: cached independently from the app code
    rollupOptions: { output: { manualChunks: { pdfjs: ['pdfjs-dist'] } } },
  },
  optimizeDeps: {
    esbuildOptions: { target: 'es2022' },
  },
})
