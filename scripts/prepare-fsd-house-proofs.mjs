// Copy real FSD source/data and a frozen built reference into an isolated sandbox.
// No original website files or images are edited.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { products, categories } from '../fsd-replit-site/src/catalogue-data.js';
import { collectionDivisions } from '../fsd-replit-site/src/collection-divisions.js';
import { galleryProducts } from '../fsd-replit-site/src/gallery.js';

const site = 'fsd-replit-site';
const sandbox = 'artifacts/mockup-sandbox';
const group = `${sandbox}/src/components/mockups/fsd-house`;
const media = `${sandbox}/public/images/fsd-house`;
const backup = 'generated-artifacts/fsd-house/baseline';
for (const dir of [group, media, backup, `${group}/_shared`]) fs.mkdirSync(dir, { recursive: true });

function inventory(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? inventory(file) : [{
      file,
      sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
    }];
  });
}
const originalFiles = [
  ...inventory(`${site}/src`), ...inventory(`${site}/public`),
  ...inventory(`${site}/brand-review/shield-refined-matte/assets`),
];
fs.writeFileSync(`${backup}/original-sha256.json`, JSON.stringify(originalFiles, null, 2));
fs.writeFileSync(`${backup}/checkpoint.txt`, execFileSync('git', ['rev-parse', 'HEAD']));
execFileSync('tar', ['-czf', `${backup}/source-and-data.tar.gz`, `${site}/src`, `${site}/index.html`, `${site}/package.json`, `${site}/package-lock.json`, `${site}/vite.config.js`]);
fs.cpSync(`${site}/src`, `${group}/_shared/source`, { recursive: true });
fs.cpSync(`${site}/dist`, `${sandbox}/public/images/current-site`, { recursive: true });

function rewriteBuiltPaths(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) rewriteBuiltPaths(file);
    else if (/\.(html|js|css)$/.test(entry.name)) {
      const text = fs.readFileSync(file, 'utf8').replace(
        /(?<![a-zA-Z0-9])\/(images|fsd-assets|assets|favicon\.svg)(?=[/'")])/g,
        '/__mockup/images/current-site/$1',
      );
      fs.writeFileSync(file, text);
    }
  }
}
rewriteBuiltPaths(`${sandbox}/public/images/current-site`);

const selectedAssets = {
  'approved-header-logo.png': `${site}/brand-review/shield-refined-matte/assets/website-shield-lockup-refined.png`,
  'approved-shield.png': `${site}/brand-review/shield-refined-matte/assets/shield-refined.png`,
  'mens-performance.png': `${site}/public/images/ombre-blue.png`,
  'mens-windrunner.png': `${site}/public/images/windrunner-khaki.png`,
  'womens-velocity-hijab.jpg': `${site}/public/images/fsd-velocity-performance-sports-hijab.jpg`,
  'boxing-campaign.webp': `${site}/public/fsd-assets/694b62506e9f.webp`,
  'boxing-athlete.webp': `${site}/public/fsd-assets/8ffe2fd45a06.webp`,
  'technical-hoodie-detail.webp': `${site}/public/fsd-assets/1f50137316e8.webp`,
  'fabric-study.webp': `${site}/public/fsd-assets/16f286891533.webp`,
  'vector-concept-reference.webp': `${site}/public/fsd-assets/1b4f4ffbc322.webp`,
};
for (const [name, source] of Object.entries(selectedAssets)) fs.copyFileSync(source, `${media}/${name}`);
for (const name of ['mens-performance', 'mens-windrunner']) {
  execFileSync('magick', [`${media}/${name}.png`, '-resize', '1600x1600>', '-quality', '88', `${media}/${name}.webp`]);
}
fs.writeFileSync(`${group}/_shared/catalogue.json`, JSON.stringify({
  products, categories, collectionDivisions,
  galleryReferences: galleryProducts,
}, null, 2));
fs.writeFileSync(`${group}/_shared/asset-provenance.json`, JSON.stringify(selectedAssets, null, 2));
for (const entry of originalFiles) {
  const current = crypto.createHash('sha256').update(fs.readFileSync(entry.file)).digest('hex');
  if (current !== entry.sha256) throw new Error(`Original changed: ${entry.file}`);
}
console.log(`Preserved ${originalFiles.length} original files; copied ${products.length} active records and ${categories.length} original categories. Publication holds remain excluded.`);
