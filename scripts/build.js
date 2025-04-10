import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

try {
  // Run TypeScript compilation programmatically
  const tscPath = join(rootDir, 'node_modules', 'typescript', 'lib', 'tsc.js');
  execSync(`node ${tscPath}`, { stdio: 'inherit' });
  
  // Run Vite build
  execSync('vite build', { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 