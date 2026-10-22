import draft from '../content/fsd-breeze-private/draft.json' with { type: 'json' };
import imageManifest from '../content/fsd-breeze-private/image-manifest.json' with { type: 'json' };
import masterProducts from './master-products.json' with { type: 'json' };
import { breezeMediaUrl } from './breeze-preview-path.js';

const expectedViews = ['front', 'side', 'back', 'detail'];
const safeFile = /^(onyx-black|deep-olive|warm-taupe|slate-grey|midnight-navy|deep-burgundy)\/fsd-breeze_(?:onyx-black|deep-olive|warm-taupe|slate-grey|midnight-navy|deep-burgundy)_(?:front|side|back|detail)_DRAFT\.jpg$/;

function assert(condition, message) {
  if (!condition) throw new Error(`Invalid FSD Breeze private draft: ${message}`);
}

export function createBreezeDraftData() {
  assert(draft.status === 'DRAFT', 'the product must remain in draft status');
  assert(draft.visibility === 'development-only', 'the product must stay development-only');
  assert(draft.commercial?.checkoutEnabled === false, 'checkout must stay disabled');
  assert(draft.commercial?.paymentsEnabled === false, 'payments must stay disabled');
  assert(draft.commercial?.published === false, 'publishing must stay disabled');
  assert(draft.collection?.divisionId === 'apparel', 'the product must stay in Apparel');
  assert(draft.collection?.groupId === 'womens-modest-combat', 'the product must stay in Women’s Modest Combat');
  assert(draft.collection?.category === 'Modest Activewear', 'the product must stay in Modest Activewear');

  const masterProduct = masterProducts.find(product => Number(product.id) === Number(draft.masterProductId));
  assert(masterProduct, 'the linked master product must exist');
  assert(masterProduct['Product name'] === 'FSD Women\'s Lightweight Modest Training Overshirt', 'the existing Breeze master record must not be renamed');
  assert(masterProduct['Category'] === 'Modest Activewear', 'the existing master category must remain unchanged');
  assert(masterProduct['Audience'] === 'Women’s', 'the existing master audience must remain unchanged');
  assert(masterProduct['Alias status'] === 'Confirmed' && /FSD BREEZE/i.test(masterProduct['Also appears as'] || ''), 'the draft must link to the confirmed Breeze alias, not create a duplicate product');

  assert(Array.isArray(imageManifest.variants) && imageManifest.variants.length === 6, 'exactly six colour concepts are required');
  const assetIds = new Set();
  const variants = imageManifest.variants.map(variant => {
    assert(Array.isArray(variant.assets) && variant.assets.length === 4, `${variant.id} must have four individual views`);
    const viewIds = variant.assets.map(asset => asset.view).sort();
    assert(JSON.stringify(viewIds) === JSON.stringify([...expectedViews].sort()), `${variant.id} is missing or duplicating a view`);
    const views = variant.assets.map(asset => {
      assert(!assetIds.has(asset.id), `duplicate image id ${asset.id}`);
      assetIds.add(asset.id);
      assert(safeFile.test(asset.file), `unsafe or unexpected asset path ${asset.file}`);
      assert(asset.file.startsWith(`${variant.id}/fsd-breeze_${variant.id}_`), `${asset.id} must use its own colourway source image`);
      assert(/^[a-f0-9]{64}$/.test(asset.sha256), `invalid hash for ${asset.id}`);
      assert(asset.width === 256 && asset.height <= 324, `${asset.id} must remain a native-size source crop`);
      return Object.freeze({
        id: asset.view,
        label: imageManifest.views.find(view => view.id === asset.view)?.label || asset.view,
        assetId: asset.id,
        src: breezeMediaUrl(asset.id),
        width: asset.width,
        height: asset.height,
        approvalStatus: variant.approvalStatus,
        alt: `Draft concept image of the ${variant.label} FSD Breeze overshirt, ${asset.view} view. Source crop is low resolution; garment branding is unverified.`,
      });
    });

    return Object.freeze({
      id: variant.id,
      label: variant.label,
      hex: variant.hex,
      approvalStatus: variant.approvalStatus,
      brandStatus: variant.brandStatus,
      views: Object.freeze(views),
    });
  });
  assert(assetIds.size === 24, 'the draft must map all 24 unique image crops');
  assert(imageManifest.sourceContactSheet?.routeServed === false, 'the contact sheet must remain review-only');
  assert(imageManifest.assetQuality?.upscaled === false, 'source images must not be upscaled');
  assert(draft.imagePolicy?.campaignHeroAsset === null && draft.imagePolicy?.newCampaignBanner === false, 'no unapproved campaign hero or banner may be added');

  const confirmedPrice = Number(masterProduct['Price (£) confirmed']);
  const priceLabel = Number.isFinite(confirmedPrice) && confirmedPrice > 0
    ? `£${confirmedPrice.toFixed(2)}`
    : '';

  return Object.freeze({
    draft,
    masterProduct,
    product: Object.freeze({
      name: draft.name,
      masterProductId: Number(masterProduct.id),
      description: draft.description,
      priceLabel,
      priceNote: priceLabel ? 'Existing catalogue reference only; not an offer to sell.' : '',
      provisionalFeatures: Object.freeze([...draft.provisionalFeatures]),
      brandStatus: draft.imagePolicy.brandStatus,
      draftStatus: 'PRIVATE DRAFT · VISUAL CONCEPT ONLY',
      imageStatus: 'DRAFT CONCEPT CROPS · 256 PX SOURCE · NOT FINAL PHOTOGRAPHY',
      commercialStatus: 'NO CHECKOUT · NO PAYMENTS · NOT PUBLISHED',
    }),
    variants: Object.freeze(variants),
  });
}
