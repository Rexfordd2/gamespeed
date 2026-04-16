import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const GITHUB_PAGES_BASE = '/gamespeed/'
const DEFAULT_BASE = '/'
const isGithubPagesBuild = process.env.GITHUB_ACTIONS === 'true'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  /**
   * Keep local dev simple at `/`, but build under the repository subpath
   * required by GitHub Pages when running in GitHub Actions.
   */
  base: command === 'serve' ? DEFAULT_BASE : isGithubPagesBuild ? GITHUB_PAGES_BASE : DEFAULT_BASE,
  test: {
    environment: 'happy-dom',
    globals: false,
    setupFiles: './src/tests/setup.ts',
    clearMocks: true,
    restoreMocks: true,
  },
}))
