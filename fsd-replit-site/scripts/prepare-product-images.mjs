import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAssetManifest } from '../src/catalogue-model.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const path = resolve(root, 'src/catalogue-assets.json');
const assets = JSON.parse(await readFile(path, 'utf8'));
const errors = validateAssetManifest(assets);
if (errors.length) throw new Error(errors.join(' '));
await mkdir(resolve(root, 'public/images/responsive'), { recursive: true });
let originalBytes = 0, derivativeBytes = 0;
for (const asset of assets.filter(asset => asset.approved && asset.approval)) {
  if (!/^\/images\/[a-z0-9-]+\.(png|jpg|jpeg)$/.test(asset.src)) throw new Error(`Unsafe source reference: ${asset.src}`);
  const source = resolve(root, `public${asset.src}`);
  const bytes = await readFile(source);
  const digest = createHash('sha256').update(bytes).digest('hex');
  const [width, height] = execFileSync('magick', ['identify', '-format', '%w %h', source], { encoding: 'utf8' }).trim().split(' ').map(Number);
  asset.width = width;
  asset.height = height;
  asset.sourceSha256 = digest;
  asset.responsive = [];
  originalBytes += bytes.length;
  for (const target of [...new Set([360, 640, 960, width].filter(value => value <= width))]) {
    const name = `${asset.id}-${digest.slice(0, 8)}-${target}.webp`;
    const destination = resolve(root, 'public/images/responsive', name);
    // Do not overwrite an existing derivative or alter any original. No crop,
    // recolouring, sharpening, artwork generation or metadata-based rotation.
    try { await stat(destination); }
    catch {
      execFileSync('magick', [source, '-resize', `${target}x>`, '-quality', '90', destination]);
    }
    const [actualWidth, actualHeight] = execFileSync('magick', ['identify', '-format', '%w %h', destination], { encoding: 'utf8' }).trim().split(' ').map(Number);
    const size = (await stat(destination)).size;
    derivativeBytes += size;
    asset.responsive.push({ src: `/images/responsive/${name}`, width: actualWidth, height: actualHeight, bytes: size });
  }
}
await writeFile(path, `${JSON.stringify(assets, null, 2)}\n`);
console.log(`Originals untouched: ${originalBytes} bytes. Responsive WebP copies: ${derivativeBytes} bytes across ${assets.reduce((sum, asset) => sum + (asset.responsive?.length || 0), 0)} files.`);
