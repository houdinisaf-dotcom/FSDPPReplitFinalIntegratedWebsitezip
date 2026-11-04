import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspace = resolve(app, '..');
const output = resolve(app, 'public/brand/logo-panel-crops');
const manifestPath = resolve(app, 'handoff/approved-logo-crops.json');
const check = process.argv.includes('--check');
const definitions = [
  { key: 'ascent', name: 'Concept 2 — Ascent Triangle', source: '03.33', file: 'concept-2-ascent-triangle.png', crop: [90, 152, 330, 231] },
  { key: 'aligned', name: 'Concept 4 — Aligned Wordmark', source: '03.32', file: 'concept-4-aligned-wordmark.png', crop: [20, 300, 285, 103] },
  { key: 'signature', name: 'Concept 5 — Signature Mark', source: '03.32', file: 'concept-5-signature-mark.png', crop: [337, 268, 262, 180] },
  { key: null, name: 'Monogram — identity unconfirmed', source: '03.34', file: 'monogram-unassigned.png', crop: [45, 398, 225, 146] },
];
const run = args => {
  const result = spawnSync('magick', args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Image operation failed: ${result.stderr}`);
  return result.stdout.trim();
};
const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const records = [];
if (!check) mkdirSync(output, { recursive: true });
for (const definition of definitions) {
  const source = `attached_assets/Image_22-10-2026_at_${definition.source}_1793783461384.png`;
  const original = resolve(workspace, source);
  const destination = resolve(output, definition.file);
  const sourceHash = sha256(original);
  const [width, height] = run(['identify', '-format', '%w %h', original]).split(' ').map(Number);
  const [x, y, cropWidth, cropHeight] = definition.crop;
  if (x < 0 || y < 0 || x + cropWidth > width || y + cropHeight > height) {
    throw new Error(`Crop exceeds source bounds: ${definition.name}`);
  }
  const geometry = `${cropWidth}x${cropHeight}+${x}+${y}`;
  if (!check) run([original, '-crop', geometry, '+repage', destination]);
  // Compare decoded pixels, not just file sizes. No resize, masking, tracing,
  // transparency extraction, palette adjustment or recolouring is permitted.
  run(['compare', '-metric', 'AE', `${original}[${geometry}]`, destination, 'null:']);
  if (sha256(original) !== sourceHash) throw new Error('Original source was modified');
  records.push({
    key: definition.key, name: definition.name,
    asset: `/brand/logo-panel-crops/${definition.file}`,
    source, sourceDimensions: [width, height],
    crop: { x, y, width: cropWidth, height: cropHeight },
    sourceSha256: sourceHash, assetSha256: sha256(destination),
    treatment: 'Owner-approved lossless rectangular panel crop; original background retained.',
  });
  console.log(`PASS exact source pixels: ${definition.name} (${geometry})`);
}
const manifest = {
  approval: 'Owner authorised unchanged logo-panel crops. Collection assignments were not supplied.',
  excludedConcepts: [3],
  notes: 'These are flattened raster crops, not standalone transparent or vector masters. The unnumbered monogram is not assigned to Serene or any collection.',
  assets: records,
};
if (check) {
  const existing = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (JSON.stringify(existing) !== JSON.stringify(manifest)) throw new Error('Crop provenance manifest differs');
} else {
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}
