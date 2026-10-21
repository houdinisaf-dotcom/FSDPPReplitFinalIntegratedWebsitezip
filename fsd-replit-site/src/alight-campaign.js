import { alightMediaPrefix, alightPreviewPath } from './alight-preview-path.js';

const archive = 'attached_assets/FSD_ALIGHT_Individual_Website_Images_1792577700084.zip';
const archiveSha256 = '521f08e9c0ee7933070ca6f4dd2ba98cf9b53074e93c760de6b932d8c80e2779';
const referenceDirectory = 'attached_assets/fsd-alight-reference/';

const image = (id, file, label, role, alt, reviewNote, width, height, sourceSha256) => Object.freeze({
  id,
  file: `${referenceDirectory}${file}`,
  archive,
  archiveSha256,
  archiveEntry: file,
  label,
  role,
  alt,
  reviewNote,
  width,
  height,
  sourceSha256,
  type: 'image/jpeg',
  status: 'private visual reference',
  src: `${alightMediaPrefix}${id}`,
});

const gallery = Object.freeze([
  image(
    'full-campaign-reference',
    '00_full_campaign_reference.jpg',
    'Complete campaign reference',
    'composite campaign reference',
    'Complete FSD ALIGHT concept campaign board with wearable artwork, proposed feature icons, lifestyle panels and packaging concept.',
    'Full composite reference only. Embedded technical and performance statements are unverified and are not product facts.',
    1024, 1536, '1ec869628bb27cea964fb5e5634906f6adebff12fd081ac53d8b6e4a58b94e97',
  ),
  image(
    'campaign-hero',
    '01_campaign_hero.jpg',
    'Campaign hero crop',
    'campaign hero',
    'FSD ALIGHT black-and-gold wearable concept campaign crop with the device, campaign title and proposed posture-awareness message.',
    'Campaign artwork crop with embedded wording. Concept visual only; capabilities and availability are pending verification.',
    1024, 565, 'd5ddeaf7d31d0d925524b8160404580c8441b9d86b76a03928dedd8384fc067e',
  ),
  image(
    'product-hero-crop',
    '02_product_hero_crop.jpg',
    'Product-focused campaign crop',
    'product-focused visual',
    'Product-focused campaign crop showing the black FSD ALIGHT wearable concept with champagne-gold details.',
    'Supplied campaign crop, not an independent or standalone product photograph. Product appearance and construction remain pending review.',
    634, 565, 'a667ce159937b2b7d104b584c2ebbb1606bd058ea73891a074bf37fa814f1044',
  ),
  image(
    'feature-strip',
    '03_feature_strip.jpg',
    'Proposed feature strip',
    'feature illustration',
    'FSD ALIGHT campaign feature-strip crop with proposed posture, alert, progress, battery and connectivity icons.',
    'Illustrated proposals only. Every capability shown in this crop is pending technical verification.',
    1024, 128, '99b3d57a4151ae31a93b49cb6e3c3f457995f8dd37436715935a9441afbfae7f',
  ),
  image(
    'lifestyle-woman',
    '04_lifestyle_woman.jpg',
    'Woman lifestyle concept',
    'lifestyle illustration',
    'FSD ALIGHT campaign crop showing a woman wearing the posture-awareness wearable concept.',
    'Lifestyle concept artwork only; it does not verify device performance, comfort, fit or outcomes.',
    512, 285, '8aa1d61561739f9715011f4a8b69ee84ebcedb4fc67fa0a2a09d125362cbf916',
  ),
  image(
    'lifestyle-man',
    '05_lifestyle_man.jpg',
    'Man lifestyle concept',
    'lifestyle illustration',
    'FSD ALIGHT campaign crop showing a man wearing the posture-awareness wearable concept.',
    'Lifestyle concept artwork only; it does not verify device performance, comfort, fit or outcomes.',
    512, 285, '118210497c0e2d86020abbd64fc85579326bff89d0c45d8dfd6906852836f2c2',
  ),
  image(
    'premium-design-detail',
    '06_premium_design_detail.jpg',
    'Premium design detail concept',
    'design detail illustration',
    'Close-up campaign crop of the FSD ALIGHT wearable concept and its visible finish.',
    'Detail crop from concept artwork. Materials, finish and manufacturing are not verified.',
    350, 262, 'ea7b9de13838ee6bec8f7643e953bee1668c6bff8f77f6ff4cfd165920f1c3fa',
  ),
  image(
    'indicator-detail',
    '07_indicator_detail.jpg',
    'Indicator detail concept',
    'indicator illustration',
    'Campaign crop showing the visible status indicator on the FSD ALIGHT wearable concept.',
    'Illustrative indicator only. Its operation and meaning are pending technical verification.',
    325, 262, '9f407917972ffd63f754ffd8a5c4d3db7a9666d60d141d5662a8b600213d2ab9',
  ),
  image(
    'comfort-fit-detail',
    '08_comfort_fit_detail.jpg',
    'Fit detail concept',
    'fit and construction illustration',
    'Campaign crop showing the strap and body of the FSD ALIGHT wearable concept.',
    'Visual reference only. Fit, comfort, materials and construction are not verified.',
    349, 262, '8259fba19169d93676e578f2e2c3eab9f3761db03bd611f5cadeae3b653e459c',
  ),
  image(
    'at-work',
    '09_at_work.jpg',
    'At-work lifestyle concept',
    'work lifestyle illustration',
    'FSD ALIGHT campaign crop showing a woman at work with the wearable concept.',
    'Lifestyle concept artwork only; it does not establish a verified work or health benefit.',
    295, 296, '0bb274ed0a371e77ce05f39e6d4970ae148d98ed6e08d1b4c88e50a23782640b',
  ),
  image(
    'packaging-concept',
    '10_packaging_concept.jpg',
    'Packaging concept',
    'packaging illustration',
    'FSD ALIGHT campaign crop showing a proposed presentation box and wearable concept.',
    'Packaging concept artwork only. This is not evidence of manufactured or approved packaging.',
    447, 296, '24ea88f9424f69cccbf13e9f8c43e7538574b266aaf47fde69bd86348c2b84d6',
  ),
  image(
    'in-training',
    '11_in_training.jpg',
    'In-training lifestyle concept',
    'training lifestyle illustration',
    'FSD ALIGHT campaign crop showing a man training while wearing the wearable concept.',
    'Lifestyle concept artwork only; it does not establish verified athletic performance or injury prevention.',
    282, 296, '62dbc16714307f4ca8ee981ce414f47a7fa5e1c6341d8e8f48ff5cd42ad2149e',
  ),
]);

const pendingFeatures = Object.freeze([
  'Posture awareness',
  'Gentle vibration alerts',
  'Progress tracking',
  'Lightweight construction',
  'Long-lasting battery',
  'App connectivity',
  'Visual status indicator',
].map(label => Object.freeze({ label, status: 'Pending Technical Verification' })));

const editorialStories = Object.freeze([
  Object.freeze({
    title: 'Build Better Habits',
    copy: 'Explore greater awareness of your posture throughout your everyday routine.',
    imageId: 'lifestyle-woman',
  }),
  Object.freeze({
    title: 'Discreet & Versatile',
    copy: 'A refined wearable concept intended to fit naturally into work, movement and training.',
    imageId: 'lifestyle-man',
  }),
  Object.freeze({
    title: 'Premium Design',
    copy: 'An understated black finish, sculpted form and distinctive FSD visual identity.',
    imageId: 'premium-design-detail',
  }),
  Object.freeze({
    title: 'At Work',
    copy: 'Explore a more posture-conscious approach to desk-based routines.',
    imageId: 'at-work',
  }),
  Object.freeze({
    title: 'In Training',
    copy: 'Stay mindful of movement as part of a purposeful performance lifestyle.',
    imageId: 'in-training',
  }),
]);

export function createAlightPreview() {
  return Object.freeze({
    path: alightPreviewPath,
    product: Object.freeze({
      name: 'FSD ALIGHT',
      subtitle: 'Posture Awareness Wearable',
      category: 'Bio-Lab / Wearable Technology',
      colour: 'Black / Champagne Gold (as depicted)',
      status: 'COMING SOON · PENDING APPROVAL',
      price: null,
      description: 'Meet FSD ALIGHT, a premium posture-awareness wearable concept designed around mindful movement, everyday comfort and purposeful performance. Created to complement your routine from work to training, ALIGHT brings refined design to the idea of greater body awareness.',
    }),
    gallery,
    productVisual: gallery.find(item => item.id === 'product-hero-crop'),
    referenceBoard: gallery.find(item => item.id === 'full-campaign-reference'),
    pendingFeatures,
    editorialStories,
    missingPhotography: Object.freeze([
      'Clean standalone front product photograph — pending asset approval.',
      'Clean standalone rear product photograph — pending asset approval.',
      'Clean standalone side product photograph — pending asset approval.',
    ]),
    pendingSpecifications: Object.freeze([
      'Materials, construction and dimensions',
      'Weight, battery capacity and battery life',
      'Alert behaviour and progress tracking',
      'App availability and compatibility',
      'Manufacturing, certifications, pricing and availability',
    ]),
    campaign: gallery.find(item => item.id === 'campaign-hero'),
    campaignMessage: 'BETTER POSTURE. GREATER AWARENESS. A STRONGER YOU.',
    seoDraft: Object.freeze({
      title: 'FSD ALIGHT Posture Awareness Wearable | FSD',
      description: 'Explore FSD ALIGHT, a premium posture-awareness wearable concept combining refined design with a focus on mindful movement and everyday performance.',
    }),
    sourceArchive: archive,
    sourceArchiveSha256: archiveSha256,
    sourceImageCount: gallery.length,
    reviewBoundary: 'Private visual concept only. Supplied images are crops or a composite campaign export, not independent product photographs. Do not treat embedded claims as verified product facts.',
    campaignSupport: 'The supplied FSD ALIGHT campaign presents a concept-stage product vision. Every capability shown in the artwork remains pending technical verification.',
  });
}

export const alightPreviewRecord = createAlightPreview();
