import { promises as fs } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { validateAssetMap } from './assetValidationCore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const assetsRoot = join(__dirname, '../public/assets');
const assetMapPath = join(assetsRoot, 'asset-map.json');

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));

const listFilesRecursive = async root => {
  const paths = [];
  const walk = async currentPath => {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      paths.push(relative(root, fullPath).replace(/\\/g, '/'));
    }
  };
  await walk(root);
  return paths;
};

const main = async () => {
  const assetMap = await readJson(assetMapPath);
  const existingFiles = new Set(await listFilesRecursive(assetsRoot));
  const validation = validateAssetMap({ assetMap, existingFiles });

  console.log('GameSpeed asset validator');
  console.log(`Asset map: ${assetMapPath}`);
  console.log(`Scanned files: ${existingFiles.size}`);
  console.log('');

  if (validation.errors.length > 0) {
    console.log('Errors:');
    validation.errors.forEach(error => console.log(`  - ${error}`));
  } else {
    console.log('Errors: none');
  }

  if (validation.warnings.length > 0) {
    console.log('');
    console.log('Warnings:');
    validation.warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  if (!validation.valid) {
    process.exit(1);
  }
};

main().catch(error => {
  console.error('Asset validation failed with an unexpected error.');
  console.error(error);
  process.exit(1);
});
