import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { validateAssetMap } from './assetValidationCore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const assetsRoot = join(__dirname, '../public/assets');
const assetMapPath = join(assetsRoot, 'asset-map.json');

const expectedDirectories = [
  'sport-icons',
  'mode-icons',
  'target-skins',
  'hud-badges',
  'audio-cues/music',
  'audio-cues/gameplay',
  'audio-cues/training',
  'audio-cues/mode',
  'audio-cues/ui',
  'icons',
  'backgrounds/overlays',
  'audio/music',
  'audio/effects',
  'ui',
];

const ensureDirectories = async () => {
  await fs.mkdir(assetsRoot, { recursive: true });
  for (const relativeDir of expectedDirectories) {
    await fs.mkdir(join(assetsRoot, relativeDir), { recursive: true });
  }
};

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));

const listFilesRecursive = async root => {
  const files = [];
  const walk = async currentPath => {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        files.push(fullPath.slice(root.length + 1).replace(/\\/g, '/'));
      }
    }
  };
  await walk(root);
  return files;
};

const main = async () => {
  await ensureDirectories();
  const assetMap = await readJson(assetMapPath);
  const existingFiles = new Set(await listFilesRecursive(assetsRoot));
  const validation = validateAssetMap({ assetMap, existingFiles });

  console.log('GameSpeed asset scaffold + validation');
  console.log(`Assets root: ${assetsRoot}`);
  console.log('');
  console.log(`Directories ensured: ${expectedDirectories.length}`);
  console.log(`Validation errors: ${validation.errors.length}`);
  console.log(`Validation warnings: ${validation.warnings.length}`);
  if (validation.errors.length) {
    console.log('');
    validation.errors.forEach(error => console.log(`- ${error}`));
  }
};

main().catch(error => {
  console.error('Failed to prepare asset structure.');
  console.error(error);
  process.exit(1);
});
