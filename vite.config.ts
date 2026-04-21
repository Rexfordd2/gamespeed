import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const DEFAULT_BASE = '/'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  /**
   * Keep both local dev and production builds on the root path for Vercel.
   */
  base: command === 'serve' ? DEFAULT_BASE : DEFAULT_BASE,
  test: {
    environment: 'happy-dom',
    globals: false,
    setupFiles: './src/tests/setup.ts',
    clearMocks: true,
    restoreMocks: true,
  },
}))
