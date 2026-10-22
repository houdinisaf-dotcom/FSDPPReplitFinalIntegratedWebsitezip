import draft from '../content/modest-flow-private/draft.json' with { type: 'json' };
import imageManifest from '../content/modest-flow-private/image-manifest.json' with { type: 'json' };
import { modestFlowMediaPath } from './modest-flow-preview-path.js';

export const modestFlowDraftRecord = draft;
export const modestFlowImageManifest = imageManifest;

const expectedVariants = [
  ['onyx-black-core', 'Onyx Black (Core)', '#0D0D0D'],
  ['deep-olive-earth', 'Deep Olive (Earth)', '#2B3227'],
  ['warm-taupe-modest', 'Warm Taupe (Modest)', '#8A7B70'],
  ['slate-grey-tech', 'Slate Grey (Tech)', '#666B70'],
  ['midnight-navy-performance', 'Midnight Navy (Performance)', '#1B2432'],
  ['deep-burgundy-combat', 'Deep Burgundy (Combat)', '#4A1521'],
];

function validate(record, manifest) {
  const variants = record?.product?.variants;
  const assets = manifest?.assets;
  if (record?.schemaVersion !== 1
    || record.collection?.status !== 'Draft'
    || record.collection?.purchaseEnabled !== false
    || record.collection?.publicationAuthorized !== false
    || record.product?.editorialStatus !== 'Draft'
    || record.product?.purchaseEnabled !== false
    || record.product?.publicationAuthorized !== false
    || record.product?.priceGbp !== null
    || record.product?.inventory !== null
    || record.product?.sku !== null
    || !Array.isArray(variants)
    || variants.length !== expectedVariants.length
    || !Array.isArray(assets)
    || assets.length !== expectedVariants.length + 1) {
    throw new TypeError('FSD Modest Flow must remain a six-colour unpublished draft with no price or purchase data.');
  }

  const assetsById = new Map(assets.map(asset => [asset.id, asset]));
  if (assetsById.size !== assets.length) {
    throw new TypeError('FSD Modest Flow image asset IDs must be unique.');
  }
  const hero = assetsById.get(record.collection.heroAssetId);
  if (!hero || variants.some(variant => variant.assetId === hero.id)) {
    throw new TypeError('FSD Modest Flow needs a fixed campaign hero separate from the six selectable colour images.');
  }

  const mappedVariants = variants.map((variant, index) => {
    const [id, colour, swatch] = expectedVariants[index];
    const asset = assetsById.get(variant.assetId);
    if (variant.id !== id
      || variant.colour !== colour
      || variant.swatch !== swatch
      || variant.approvalStatus !== 'Approved source image; product remains draft'
      || !asset
      || asset.role !== `${colour} individual colour image`
      || !/^[a-f0-9]{64}$/.test(asset.sha256)
      || asset.width !== 1122
      || asset.height !== 1402) {
      throw new TypeError(`FSD Modest Flow source image mapping is invalid for ${colour}.`);
    }
    return Object.freeze({
      ...variant,
      asset: Object.freeze({ ...asset }),
      imageSrc: modestFlowMediaPath(asset.id),
      imageAlt: `${colour} FSD Modest Flow coordinated outfit campaign image.`,
    });
  });

  const referencedAssets = new Set([hero.id, ...mappedVariants.map(variant => variant.assetId)]);
  if (referencedAssets.size !== assets.length || assets.some(asset => !referencedAssets.has(asset.id))) {
    throw new TypeError('Every supplied FSD Modest Flow image must be mapped exactly once.');
  }

  return { assetsById, hero, variants: mappedVariants };
}

export function createModestFlowDraftData(record = draft, manifest = imageManifest) {
  const { hero, variants } = validate(record, manifest);
  return Object.freeze({
    collection: Object.freeze({
      ...record.collection,
      hero: Object.freeze({
        ...hero,
        src: modestFlowMediaPath(hero.id),
        alt: 'FSD Modest Flow Deep Burgundy campaign image in a warm architectural training space.',
      }),
    }),
    product: Object.freeze({
      ...record.product,
      variants: Object.freeze(variants),
    }),
  });
}
