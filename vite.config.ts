import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const GITHUB_PAGES_BASE = '/gamespeed/'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  /**
   * Keep local dev simple at `/`, but build under the repository subpath
   * required by GitHub Pages.
   */
  base: command === 'serve' ? '/' : GITHUB_PAGES_BASE,
  test: {
    environment: 'happy-dom',
    globals: false,
    setupFiles: './src/tests/setup.ts',
    clearMocks: true,
    restoreMocks: true,
  },
}))
