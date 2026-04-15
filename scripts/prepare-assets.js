import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const assetsRoot = join(__dirname, '../public/assets');

const expectedDirectories = [
  'icons',
  'backgrounds/overlays',
  'audio/music',
  'audio/effects',
  'ui',
];

const expectedFiles = [
  'icons/target-primate.svg',
  'backgrounds/overlays/canopy-top.svg',
  'backgrounds/overlays/canopy-left.svg',
  'backgrounds/overlays/canopy-right.svg',
  'backgrounds/overlays/canopy-bottom.svg',
  'ui/hud-vignette.svg',
  'audio/music/rainforest-loop.mp3',
  'audio/effects/target-hit.mp3',
  'audio/effects/target-miss.mp3',
  'audio/effects/round-complete.mp3',
];

const ensureDirectories = async () => {
  await fs.mkdir(assetsRoot, { recursive: true });
  for (const relativeDir of expectedDirectories) {
    await fs.mkdir(join(assetsRoot, relativeDir), { recursive: true });
  }
};

const pathExists = async (pathToCheck) => {
  try {
    await fs.access(pathToCheck);
    return true;
  } catch {
    return false;
  }
};

const main = async () => {
  await ensureDirectories();

  console.log('GameSpeed asset scaffold check');
  console.log(`Assets root: ${assetsRoot}`);
  console.log('');

  for (const relativePath of expectedFiles) {
    const fullPath = join(assetsRoot, relativePath);
    const exists = await pathExists(fullPath);
    const status = exists ? 'OK' : 'MISSING';
    console.log(`[${status}] ${relativePath}`);
  }
};

main().catch(error => {
  console.error('Failed to prepare asset structure.');
  console.error(error);
  process.exit(1);
});
