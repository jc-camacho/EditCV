import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
