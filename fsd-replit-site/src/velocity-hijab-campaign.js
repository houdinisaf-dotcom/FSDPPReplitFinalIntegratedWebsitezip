import { products } from './catalogue-data.js';
import { velocityHijabMediaPrefix, velocityHijabPreviewPath } from './velocity-hijab-preview-path.js';

export { velocityHijabMediaPrefix, velocityHijabPreviewPath };

const suppliedGalleryAssets = [
  {
    id: 'campaign',
    file: 'attached_assets/Main_product_listing_image_1792424117238.jpg',
    type: 'image/jpeg',
    label: 'Campaign image',
    alt: 'Woman wearing the black FSD Velocity Performance Sports Hijab in a training setting.',
  },
  {
    id: 'front-detail',
    file: 'attached_assets/Image_1_—_Front_hero_detail_1792424767570.png',
    type: 'image/png',
    label: 'Front hero detail',
    alt: 'Close view of a woman wearing the black sports hijab with gold FSD branding.',
  },
  {
    id: 'rear-view',
    file: 'attached_assets/Image_2_—_Rear_view_1792424767570.png',
    type: 'image/png',
    label: 'Rear view',
    alt: 'Rear view of the black sports hijab and its panel construction.',
  },
  {
    id: 'fabric-detail',
    file: 'attached_assets/Image_3_—_Fabric_and_ventilation_1792424767570.png',
    type: 'image/png',
    label: 'Fabric detail',
    alt: 'Close-up view of a fabric panel.',
  },
  {
    id: 'branding-detail',
    file: 'attached_assets/Image_4_—_Branding_detail_1792424767570.png',
    type: 'image/png',
    label: 'FSD branding detail',
    alt: 'Close view of the gold FSD shield and wordmark on the sports hijab.',
  },
].map(asset => Object.freeze({ ...asset, src: `${velocityHijabMediaPrefix}${asset.id}` }));

export function createVelocityHijabPreview() {
  const product = products.find(candidate => candidate.id === 43);
  if (product?.name !== 'FSD Velocity Sports Hijab') {
    throw new Error('The approved FSD Velocity Sports Hijab record is unavailable.');
  }
  if (!product.images.some(image => image.src === '/assets/products/velocity-hijab-main-listing.jpg')) {
    throw new Error('The current Velocity listing hero is not mapped to the existing product record.');
  }

  return Object.freeze({
    path: velocityHijabPreviewPath,
    product,
    colour: 'Black / Gold',
    description: product.description,
    features: Object.freeze(product.features.map((text, index) =>
      Object.freeze({ title: `Performance feature ${index + 1}`, text }))),
    gallery: Object.freeze(suppliedGalleryAssets),
    sideViewNote: 'The current listing uses the newer product photo set; this archived campaign gallery remains separate.',
  });
}

export const velocityHijabPreviewRecord = createVelocityHijabPreview();
