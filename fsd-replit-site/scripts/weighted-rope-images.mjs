import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const workspaceRoot = resolve(appRoot, '..');
export const ropeOutput = resolve(workspaceRoot, 'generated-artifacts/fsd-weighted-rope');
export const mediaPrefix = '/__catalogue-media/weighted-rope/';
export const readRopeRecipe = async () => JSON.parse(await readFile(resolve(appRoot, 'content/weighted-skipping-rope-images.json'), 'utf8'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const fileExists = async path => { try { return (await stat(path)).isFile(); } catch { return false; } };
const identify = path => execFileSync('magick', ['identify', '-format', '%w %h', path], { encoding:'utf8' }).trim().split(' ').map(Number);
const sourcePath = file => {
  if (!/^attached_assets\/[a-zA-Z0-9_-]+\.png$/.test(file)) throw new Error('Only supplied PNG attachments can be crop sources.');
  return resolve(workspaceRoot, file);
};

export function plannedRopeAssets(recipe) {
  if (recipe.productKey !== 'weighted-skipping-rope' || recipe.variants.length !== 8 || recipe.panels.length !== 4) throw new Error('Expected one rope, eight editions and four panels.');
  const result = [{ id:recipe.campaign.id, productKey:recipe.productKey, productId:null, variantId:null, private:true, approved:true, approval:recipe.approval, roles:['hero','lifestyle'], file:recipe.campaign.file }];
  const ids = new Set();
  for (const variant of recipe.variants) {
    if (!/^[a-z0-9-]+$/.test(variant.id) || ids.has(variant.id)) throw new Error('Duplicate or unsafe colour edition ID.');
    ids.add(variant.id);
    sourcePath(variant.file);
    for (const panel of recipe.panels) result.push({
      id:`weighted-rope-${variant.id}-${panel.key}`, productKey:recipe.productKey,
      productId:null, variantId:variant.id, private:true, approved:true, approval:recipe.approval,
      roles:[panel.role], label:panel.label, file:variant.file,
    });
  }
  return result;
}

export async function prepareRopeImages() {
  const recipe = await readRopeRecipe();
  plannedRopeAssets(recipe);
  await mkdir(ropeOutput, { recursive:true });
  const hashFiles = [recipe.campaign.file, ...recipe.variants.map(variant => variant.file)];
  const hashes = Object.fromEntries(await Promise.all(hashFiles.map(async file => [file, digest(await readFile(sourcePath(file)))])));
  const recipeHash = digest(JSON.stringify(recipe));
  const manifestPath = resolve(ropeOutput, 'manifest.json');
  if (await fileExists(manifestPath)) {
    const existing = JSON.parse(await readFile(manifestPath, 'utf8'));
    if (existing.recipeHash === recipeHash && JSON.stringify(existing.sourceHashes) === JSON.stringify(hashes)
      && (await Promise.all(existing.files.map(file => fileExists(resolve(workspaceRoot, file.file))))).every(Boolean)) {
      return existing;
    }
  }
  const files = [];
  const generatedFiles = [];
  const makeImage = (id, file, width, height, metadata) => {
    const name = file.split('/').at(-1);
    const asset = { id, src:`${mediaPrefix}${name}`, width, height, ...metadata, responsive:[] };
    files.push({ src:asset.src, file, mime:'image/png' });
    generatedFiles.push(asset);
    return asset;
  };
  const responsiveCopies = async (asset, input, widths) => {
    for (const width of widths) {
      if (width > asset.width) continue;
      const name = `${asset.id}-${width}.webp`;
      const destination = resolve(ropeOutput, name);
      execFileSync('magick', [input, '-resize', `${width}x>`, '-quality', '92', destination]);
      const [w,h] = identify(destination);
      const src = `${mediaPrefix}${name}`;
      files.push({ src, file:`generated-artifacts/fsd-weighted-rope/${name}`, mime:'image/webp' });
      asset.responsive.push({ src, width:w, height:h });
    }
    asset.srcset = asset.responsive.map(image => `${image.src} ${image.width}w`).join(', ');
  };
  const campaignFile = sourcePath(recipe.campaign.file);
  const [campaignWidth,campaignHeight] = identify(campaignFile);
  const campaignHero = makeImage(recipe.campaign.id, recipe.campaign.file, campaignWidth, campaignHeight, {
    label:'Athlete campaign', alt:recipe.campaign.alt, roles:['hero','lifestyle'], role:'hero',
    approved:true, approval:recipe.approval, productKey:recipe.productKey, variantId:null,
  });
  await responsiveCopies(campaignHero, campaignFile, [640, 1200, campaignWidth]);
  const images = [], sourceBoards = [];
  for (const variant of recipe.variants) {
    const source = sourcePath(variant.file);
    const [width,height] = identify(source);
    if (width !== recipe.boardSize.width || height !== recipe.boardSize.height) throw new Error(`Board dimensions changed; review crop coordinates: ${variant.colour}`);
    sourceBoards.push(makeImage(`weighted-rope-${variant.id}-source-board`, variant.file, width, height, {
      variantId:variant.id, label:`${variant.colour} — original four-panel board`,
      alt:`FSD Weighted Skipping Rope ${variant.colour}: original approved four-panel product board.`,
      roles:['lineup'], approved:true, approval:recipe.approval,
    }));
    for (const panel of recipe.panels) {
      const id = `weighted-rope-${variant.id}-${panel.key}`;
      const name = `${id}.png`;
      const destination = resolve(ropeOutput, name);
      const geometry = `${panel.width}x${panel.height}+${panel.x}+${panel.y}`;
      // Lossless rectangular extraction only. No resize, recolour, sharpening,
      // shield alteration, upscaling or image synthesis. Only divider pixels omitted.
      execFileSync('magick', [source, '-crop', geometry, '+repage', destination]);
      const asset = makeImage(id, `generated-artifacts/fsd-weighted-rope/${name}`, panel.width, panel.height, {
        variantId:variant.id, productKey:recipe.productKey,
        label:`${variant.colour} · ${panel.label}`,
        alt:`FSD Weighted Skipping Rope, ${variant.colour} edition — ${panel.label.toLowerCase()}.`,
        roles:[panel.role], role:panel.role, approved:true, approval:recipe.approval,
        sourceBoard:variant.file, crop:{x:panel.x,y:panel.y,width:panel.width,height:panel.height},
      });
      await responsiveCopies(asset, destination, [280, panel.width]);
      images.push(asset);
    }
  }
  for (const [file,hash] of Object.entries(hashes)) {
    if (digest(await readFile(sourcePath(file))) !== hash) throw new Error(`Original was changed while preparing crops: ${file}`);
  }
  const manifest = { productKey:recipe.productKey, recipeHash, sourceHashes:hashes, campaignHero, images, sourceBoards, files };
  await writeFile(manifestPath, `${JSON.stringify(manifest,null,2)}\n`);
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await prepareRopeImages();
  console.log(`Draft-only rope assets: ${result.images.length} lossless panel crops, ${result.sourceBoards.length} intact source boards, one independent campaign hero. All nine source hashes unchanged.`);
}
