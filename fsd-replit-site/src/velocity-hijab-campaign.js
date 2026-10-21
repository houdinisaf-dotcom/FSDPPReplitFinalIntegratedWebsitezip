import { products } from './catalogue-data.js';
import { velocityHijabMediaPrefix, velocityHijabPreviewPath } from './velocity-hijab-preview-path.js';

export { velocityHijabMediaPrefix, velocityHijabPreviewPath };

const suppliedGalleryAssets = [
  {
    id: 'campaign',
    file: 'attached_assets/Main_product_listing_image_1792424117238.jpg',
    type: 'image/jpeg',
    label: 'Approved campaign image',
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
    label: 'Supplied fabric-panel close-up',
    alt: 'Close view of the supplied fabric-panel photograph; composition and function are not confirmed.',
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
  if (product?.name !== 'FSD Velocity Performance Sports Hijab') {
    throw new Error('The approved FSD Velocity Performance Sports Hijab record is unavailable.');
  }
  if (!product.images.some(image => image.src === '/images/fsd-velocity-performance-sports-hijab.jpg')) {
    throw new Error('The approved Velocity campaign image is not mapped to the existing product record.');
  }

  return Object.freeze({
    path: velocityHijabPreviewPath,
    product,
    colour: 'Black / Champagne Gold',
    description: 'Private review of the supplied model-worn campaign photograph and product details. Product construction, materials and performance properties have not been confirmed.',
    features: Object.freeze([
      Object.freeze({ title: 'Fit and coverage', text: 'Pending sample review.' }),
      Object.freeze({ title: 'Fabric and ventilation', text: 'Composition and function pending verification.' }),
      Object.freeze({ title: 'Performance properties', text: 'Pending product testing and verification.' }),
      Object.freeze({ title: 'Care instructions', text: 'Not supplied; pending confirmation.' }),
    ]),
    gallery: Object.freeze(suppliedGalleryAssets),
    sideViewNote: 'Dedicated side-view photograph: pending. No side-view image was supplied or created.',
  });
}

export const velocityHijabPreviewRecord = createVelocityHijabPreview();
