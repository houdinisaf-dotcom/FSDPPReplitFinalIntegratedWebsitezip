import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, extname, join, relative, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readImageDimensions, reviewProductImages } from '../src/asset-curation.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assetDirectory = join(projectRoot, 'public', 'fsd-assets');
const textExtensions = new Set(['.cjs', '.css', '.html', '.js', '.jsx', '.json', '.md', '.mjs', '.ts', '.tsx']);
const assetReferences = new Map();
const registryNames = new Map();

function addRegistryName(url, name) {
  if (typeof url !== 'string' || !url.startsWith('/fsd-assets/')) return;
  const names = registryNames.get(url) || new Set();
  if (name) names.add(name);
  registryNames.set(url, names);
}

async function collectTextFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectTextFiles(path));
    } else if (entry.isFile() && textExtensions.has(extname(entry.name).toLowerCase())) {
      files.push(path);
    }
  }
  return files;
}

async function scanSourceReferences() {
  const sourceRoots = ['src', 'content', 'scripts']
    .map(directory => join(projectRoot, directory));
  const sourceFiles = [join(projectRoot, 'index.html')];
  for (const root of sourceRoots) sourceFiles.push(...await collectTextFiles(root));

  const pattern = /\/fsd-assets\/([^"'`\s)]+)/g;
  for (const filePath of sourceFiles) {
    let text;
    try {
      text = await readFile(filePath, 'utf8');
    } catch {
      continue;
    }
    for (const match of text.matchAll(pattern)) {
      const relativeAsset = match[1].split(/[?#]/, 1)[0];
      if (!relativeAsset) continue;
      const url = `/fsd-assets/${basename(relativeAsset)}`;
      const paths = assetReferences.get(url) || new Set();
      paths.add(relative(projectRoot, filePath));
      assetReferences.set(url, paths);
    }
  }
}

async function readRegistryMetadata() {
  const registryPath = join(projectRoot, 'src', 'additional-catalog.json');
  const registry = JSON.parse(await readFile(registryPath, 'utf8'));
  for (const asset of registry.gallery || []) addRegistryName(asset.url, asset.name);
  for (const product of registry.wearables || []) addRegistryName(product.image_url, product.name);
}

async function collectAssets() {
  const entries = await readdir(assetDirectory, { withFileTypes: true });
  const files = entries.filter(entry => entry.isFile()).sort((a, b) => a.name.localeCompare(b.name));
  const assets = [];

  for (const entry of files) {
    const filePath = join(assetDirectory, entry.name);
    const buffer = await readFile(filePath);
    const url = `/fsd-assets/${entry.name}`;
    const dimensions = readImageDimensions(buffer);
    const names = [...(registryNames.get(url) || [])].sort();
    assets.push({
      filename: entry.name,
      name: names.join(' · '),
      url,
      width: dimensions?.width,
      height: dimensions?.height,
      tags: [],
      sha256: createHash('sha256').update(buffer).digest('hex'),
      referencedBy: [...(assetReferences.get(url) || [])].sort(),
      registryNames: names,
      bytes: buffer.length,
    });
  }
  return assets;
}

function countFlag(report, flag) {
  return report.assets.filter(asset => asset.reviewFlags.includes(flag)).length;
}

function label(asset) {
  const displayName = asset.name || asset.filename || asset.url;
  return `${displayName} — ${asset.filename} (${asset.width ?? '?'}×${asset.height ?? '?'})`;
}

function printList(title, assets) {
  console.log(`\n${title}: ${assets.length}`);
  for (const asset of assets.slice(0, 12)) console.log(`  - ${label(asset)}`);
  if (assets.length > 12) console.log(`  … and ${assets.length - 12} more; use --json for the complete report.`);
}

await readRegistryMetadata();
await scanSourceReferences();
const report = reviewProductImages(await collectAssets());

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const referencedCount = report.assets.filter(asset => asset.referencedBy.length > 0).length;
  console.log('FSD asset review — recommendations only');
  console.log(`Assets scanned and retained: ${report.assets.length}`);
  console.log(`Assets referenced by source or content: ${referencedCount}`);
  console.log(`Assets without source references: ${report.assets.length - referencedCount}`);
  console.log(`Exact byte-duplicate groups: ${report.duplicateGroups.length}`);
  printList('Possible composites by name (manual review)', report.assets.filter(asset => asset.reviewFlags.includes('possible-composite-name')));
  printList('Possible copy-name clues (manual review)', report.assets.filter(asset => asset.reviewFlags.includes('possible-copy-name')));
  printList('Below 1000px in either dimension (manual review)', report.assets.filter(asset => asset.reviewFlags.includes('below-1000px-review-threshold')));
  printList('Hero candidates from explicit tags/name hints (not selected)', report.heroCandidates);
  console.log('\nNo assets were deleted, renamed, moved, or excluded. No hero was selected.');
}
