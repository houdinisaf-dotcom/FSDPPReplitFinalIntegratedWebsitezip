import draft from '../content/aeroforge-private/draft.json' with { type: 'json' };
import imageManifest from '../content/aeroforge-private/image-manifest.json' with { type: 'json' };
import {
  aeroforgeMediaPrefix,
} from './aeroforge-preview-path.js';

export const aeroforgeDraftRecord = draft;
export const aeroforgeImageManifest = imageManifest;

const expectedColours = ['Black', 'Grey', 'Navy', 'Olive', 'Mauve', 'White'];

export function createAeroForgeDraftData(record = draft, manifest = imageManifest) {
  if (record.collection?.editorialStatus !== 'Draft'
    || record.collection?.approvalStatus !== 'Pending approval'
    || record.collection?.purchaseEnabled !== false
    || record.collection?.publicationAuthorized !== false
    || record.collection?.priceGbp !== null
    || !Array.isArray(record.products)
    || record.products.length !== 2
    || record.products.some(product => product.editorialStatus !== 'Draft'
      || product.id !== null
      || product.purchaseEnabled !== false
      || product.publicationAuthorized !== false
      || product.priceGbp !== null
      || product.inventory !== null
      || product.sku !== null)) {
    throw new Error('AeroForge must remain a two-product, unpublished draft with purchasing and pricing disabled.');
  }

  const assets = new Map((manifest.assets || []).map(asset => [asset.id, asset]));
  if (!manifest.sourceArchive?.sha256
    || assets.size !== 13
    || !assets.has(record.collection.heroAssetId)) {
    throw new Error('The AeroForge image manifest is incomplete.');
  }

  const products = record.products.map(product => {
    if (!Array.isArray(product.variants)
      || product.variants.length !== expectedColours.length
      || product.variants.map(variant => variant.colour).join('|') !== expectedColours.join('|')) {
      throw new Error(`AeroForge ${product.name} must retain the six supplied colourways in their approved order.`);
    }

    const variants = product.variants.map(variant => {
      const asset = assets.get(variant.assetId);
      if (!asset || !/^[a-f0-9]{64}$/.test(asset.sha256)) {
        throw new Error(`Missing source image for the ${variant.colour} AeroForge reference.`);
      }
      return {
        ...variant,
        src: `${aeroforgeMediaPrefix}${asset.id}`,
        alt: `${variant.colour} AeroForge coordinated outfit reference, supplied as a crop from the original composite.`,
        width: asset.width,
        height: asset.height,
      };
    });

    const details = product.details.map(detail => {
      const asset = assets.get(detail.assetId);
      if (!asset) throw new Error(`Missing supplied AeroForge detail image: ${detail.id}.`);
      return {
        ...detail,
        src: `${aeroforgeMediaPrefix}${asset.id}`,
        alt: `${detail.label} detail reference, cropped from the supplied AeroForge composite.`,
        width: asset.width,
        height: asset.height,
      };
    });

    return { ...product, variants, details };
  });

  const heroAsset = assets.get(record.collection.heroAssetId);
  const imageNotes = [
    'The collection hero and colour outfit/detail images are crops from the supplied composite, not independent original photographs.',
    'The garment marks visible in the supplied images are plain FSD text, not the approved website shield lockup. No artwork was altered; branding review is pending.',
    'Image crops are retained at their supplied dimensions and are not enlarged beyond their source resolution.',
  ];
  const missingViews = [...new Set(products.flatMap(product => product.missingViews))];

  return {
    collection: {
      ...record.collection,
      status: 'DRAFT · PENDING APPROVAL',
      hero: {
        src: `${aeroforgeMediaPrefix}${heroAsset.id}`,
        alt: 'FSD AeroForge six-colour coordinated outfit campaign image, supplied as a fixed collection reference.',
        width: heroAsset.width,
        height: heroAsset.height,
      },
    },
    products,
    imageNotes,
    missingViews,
    catalogueNote: record.catalogueNote,
    specificationNotes: [
      'Material composition, measurements and sizing, care instructions, fit, performance and certification claims are pending verification.',
      'Price, inventory and SKU have not been assigned to either draft product.',
    ],
    assetManifest: manifest.assets,
  };
}
