import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { products, safe } from '../src/catalogue-data.js';
import { validateContentRecord, validateAssetManifest, integrateReviewedRecords } from '../src/catalogue-model.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = resolve(root, '../generated-artifacts/fsd-catalogue-review');
const command = process.argv[2] || 'validate';
const args = process.argv.slice(3);
const value = name => args[args.indexOf(name) + 1];
const manifest = JSON.parse(await readFile(resolve(root, 'src/catalogue-assets.json'), 'utf8'));
const drafts = JSON.parse(await readFile(resolve(root, 'content/catalogue.json'), 'utf8')).records;
const records = drafts.filter(record => !args.includes('--id') || String(record.id) === value('--id'))
  .filter(record => !args.includes('--key') || record.key === value('--key'));
const exists = async path => { try { return (await stat(path)).isFile(); } catch { return false; } };
const errors = validateAssetManifest(manifest);
const keys = new Set();
for (const record of drafts) {
  errors.push(...validateContentRecord(record, products.map(product => product.id)).map(message => `${record.key}: ${message}`));
  if (keys.has(record.key)) errors.push(`Duplicate editorial key: ${record.key}`);
  keys.add(record.key);
  if (record.sourceId !== null) {
    const original = products.find(product => product.id === record.sourceId);
    if (!original || original.id !== record.id) errors.push(`Unknown original record: ${record.key}`);
    else for (const field of ['name', 'category', 'collection', 'confirmedPrice', 'suggestedPrice']) {
      if (record[field] !== null && record[field] !== original[field]) errors.push(`${record.key}: original ${field} cannot be overwritten.`);
    }
  }
  for (const id of record.assetIds || []) {
    const asset = manifest.find(asset => asset.id === id);
    if (!asset || asset.productId !== record.id) errors.push(`${record.key}: missing or mismatched asset ${id}.`);
  }
}
for (const asset of manifest) {
  const owner = products.find(product => product.id === asset.productId);
  const preparation = drafts.find(record => record.id === asset.productId);
  const variants = owner?.catalogue.variants || preparation?.variants || [];
  if (asset.approved && !variants.some(variant => variant.id === asset.variantId)) errors.push(`Approved asset has no confirmed product/colour association: ${asset.id}`);
  const source = resolve(root, `public${asset.src}`);
  if (asset.approved) {
    if (!await exists(source)) errors.push(`Approved source file missing: ${asset.id}`);
    else if (asset.sourceSha256 && createHash('sha256').update(await readFile(source)).digest('hex') !== asset.sourceSha256) errors.push(`Original artwork changed: ${asset.id}. Review before preparing new copies.`);
    for (const derivative of asset.responsive || []) {
      if (!await exists(resolve(root, `public${derivative.src}`))) errors.push(`Responsive copy missing: ${derivative.src}`);
    }
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else if (!records.length) {
  console.error('No matching editorial record.');
  process.exitCode = 1;
} else if (command === 'validate') {
  console.log(`Catalogue valid: ${products.length} unchanged/public records, ${drafts.length} editorial preparations, ${manifest.length} mapped assets.`);
  for (const record of records) console.log(`${record.key}: ${record.editorialStatus}; ${record.missing?.join('; ') || 'no listed gaps'}`);
} else if (command === 'export') {
  const ready = records.filter(record => record.editorialStatus === 'Approved' && record.sourceId !== null || record.editorialStatus === 'Published');
  if (!ready.length || ready.length !== records.length) throw new Error('Select only explicitly Approved existing records or authorised Published new records. No status is changed automatically.');
  integrateReviewedRecords(products, ready);
  await mkdir(outputRoot, { recursive: true });
  await writeFile(resolve(outputRoot, 'reviewed-candidate.json'), `${JSON.stringify(ready, null, 2)}\n`);
  console.log('Review candidate exported outside the app. Nothing was copied into live records or published.');
} else if (command === 'preview') {
  await mkdir(outputRoot, { recursive: true });
  const imageURI = async asset => {
    if (!asset) return '';
    const file = asset.stagedPath ? resolve(root, asset.stagedPath) : resolve(root, `public${asset.src}`);
    if (!file.startsWith(`${root}${sep}`) || !await exists(file)) return '';
    const mime = ({ '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.avif':'image/avif' })[extname(file).toLowerCase()];
    if (!mime) throw new Error('Only supported image files can be included in a review.');
    return `data:${mime};base64,${(await readFile(file)).toString('base64')}`;
  };
  let body = '';
  for (const record of records) {
    const associated = manifest.filter(asset => record.assetIds.includes(asset.id));
    const hero = associated.find(asset => asset.roles.includes('hero'));
    const heroURI = await imageURI(hero);
    const variants = await Promise.all(record.variants.map(async variant => {
      const images = associated.filter(asset => asset.variantId === variant.id);
      const uri = await imageURI(images[0]);
      return `<article class="variant"><h3>${safe(variant.colour)}</h3>${uri ? `<img src="${uri}" alt="${safe(images[0].alt)}"/>` : '<p class="missing">No approved image for this colour.</p>'}<p>SKU: ${safe(variant.sku || 'Not supplied')} · Sizes: ${safe(variant.sizes.join(', ') || 'Not supplied')}</p></article>`;
    }));
    body += `<section class="record"><div>${heroURI ? `<img class="hero" src="${heroURI}" alt="${safe(hero.alt)}"/>` : '<div class="missing hero">Approved hero image needed</div>'}</div><div><p class="eyebrow">${safe(record.editorialStatus)} · READ-ONLY REVIEW · NOT A SALES PAGE</p><h1>${safe(record.name)}</h1><p>Source ID ${safe(record.id ?? 'unassigned')} · ${safe(record.collection || 'Collection to verify')} / ${safe(record.category || 'Category to verify')}</p><p>${safe(record.description || 'No approved description supplied.')}</p><p>${safe(record.specifications || 'Technical specifications not supplied.')}</p><p>Confirmed price: ${record.confirmedPrice === null ? 'Not set' : `£${record.confirmedPrice.toFixed(2)}`} · Purchasing disabled</p><p>Placement: ${safe(JSON.stringify(record.placement))}</p><h2>Missing / awaiting approval</h2><ul>${(record.missing || []).map(text => `<li>${safe(text)}</li>`).join('')}</ul><h2>Asset roles and alt text</h2><ul>${associated.map(asset => `<li>${safe(asset.id)} · ${safe(asset.roles.join(', '))}<br/>${safe(asset.alt)} · ${asset.approved ? 'image approved; not product approval' : 'image awaiting approval'}</li>`).join('') || '<li>No asset mappings.</li>'}</ul></div><div class="variants">${variants.join('') || '<p>Colourways awaiting verification. No variants invented.</p>'}</div></section>`;
  }
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,nofollow"><title>FSD catalogue review</title><style>*{box-sizing:border-box}body{background:#101113;color:#eee9df;font:15px/1.6 system-ui;margin:0;padding:clamp(16px,4vw,60px)}header{border-bottom:1px solid #625235;padding-bottom:24px}h1{font-size:clamp(26px,3vw,44px);line-height:1.15}h2{font-size:18px}.eyebrow{color:#d1b787;font-size:11px;letter-spacing:.12em}.record{display:grid;grid-template-columns:1fr 1fr;gap:30px;border-bottom:1px solid #494035;padding:40px 0}.hero{width:100%;max-height:600px;object-fit:contain}.missing{padding:24px;background:#252525;color:#cfc4af}.variants{grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px}.variant img{width:100%;height:260px;object-fit:contain}.variant{border:1px solid #494035;padding:16px}@media(max-width:700px){.record{grid-template-columns:1fr}.variants{grid-column:auto}}</style><header><p class="eyebrow">FSD / EDITORIAL WORKSPACE PREVIEW</p><h1>Progressive catalogue review</h1><p>Read-only, self-contained proof. Drafts are not added to the storefront. Image approval, content approval, publication and purchasing are separate.</p></header>${body}</html>`;
  await writeFile(resolve(outputRoot, 'index.html'), html);
  console.log(`Read-only preview: ${resolve(outputRoot, 'index.html')}`);
} else throw new Error(`Unknown catalogue command: ${command}`);
