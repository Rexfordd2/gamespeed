import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const DEFAULT_BASE = '/'
const resolveProductionBase = () => {
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH
  }
  if (process.env.GITHUB_ACTIONS === 'true') {
    const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
    if (repoName) {
      return `/${repoName}/`
    }
  }
  return DEFAULT_BASE
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  /**
   * Serve locally from root; derive production base from env/CI target.
   */
  base: command === 'serve' ? DEFAULT_BASE : resolveProductionBase(),
  test: {
    environment: 'happy-dom',
    globals: false,
    setupFiles: './src/tests/setup.ts',
    clearMocks: true,
    restoreMocks: true,
  },
}))
