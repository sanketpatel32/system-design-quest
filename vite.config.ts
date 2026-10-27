import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vitest/config'
import { readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

/** Editable .excalidraw sources stay in the repo (public/diagrams) but are not deployed; the site links to them on GitHub */
function dropDiagramSources(): Plugin {
  return {
    name: 'drop-diagram-sources',
    apply: 'build',
    closeBundle() {
      const dir = join(import.meta.dirname, 'dist', 'diagrams')
      try {
        for (const f of readdirSync(dir)) if (f.endsWith('.excalidraw')) rmSync(join(dir, f))
      } catch { /* no diagrams folder */ }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), dropDiagramSources()],
  server: {
    host: '0.0.0.0',
    port: 43123,
  },
  preview: {
    host: '0.0.0.0',
    port: 43123,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
