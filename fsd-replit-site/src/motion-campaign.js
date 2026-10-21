import { motionMediaPrefix, motionPreviewPath, motionProductPath } from './motion-preview-path.js';

const archive = 'attached_assets/FSD_MOTION_Individual_Website_Images_1792589173022.zip';
const archiveSha256 = '2cdc9b8abea2c110477d60752e94a5f3bd93061e0fe2dbe5c62426f7c71751fa';
const referenceDirectory = 'attached_assets/fsd-motion-reference/FSD_MOTION_Website_Images/';

const image = (id, fileName, label, role, alt, reviewNote, width, height) => Object.freeze({
  id,
  file: `${referenceDirectory}${fileName}`,
  archive,
  archiveSha256,
  archiveEntry: `FSD_MOTION_Website_Images/${fileName}`,
  label,
  role,
  alt,
  reviewNote,
  width,
  height,
  type: 'image/jpeg',
  status: 'private campaign reference',
  src: `${motionMediaPrefix}${id}`,
});

const assets = Object.freeze([
  image(
    'campaign-hero',
    '01_campaign_hero.jpg',
    'Campaign hero',
    'campaign artwork',
    'Wide FSD MOTION black-and-champagne campaign crop showing athletes in training apparel with the words “REAL MOVEMENT. REAL DATA. A STRONGER YOU.” embedded in the artwork.',
    'Supplied campaign artwork with embedded wording. Use as the collection hero without adding duplicate campaign text over the image.',
    1024, 528,
  ),
  image(
    'women-apparel',
    '02_hero_womens_apparel.jpg',
    'Women’s apparel crop',
    'campaign crop',
    'Campaign crop of a woman wearing black FSD training apparel with champagne-gold details.',
    'Campaign crop, not a clean independent product photograph. The garment’s materials, fit, construction, sizing and capabilities are unverified.',
    340, 528,
  ),
  image(
    'men-apparel',
    '03_hero_mens_apparel.jpg',
    'Men’s apparel crop',
    'campaign crop',
    'Campaign crop of a man wearing black FSD training apparel with champagne-gold details.',
    'Campaign crop, not a clean independent product photograph. The garment’s materials, fit, construction, sizing and capabilities are unverified.',
    239, 528,
  ),
  image(
    'proposed-features',
    '04_proposed_features_strip.jpg',
    'Proposed feature strip',
    'concept illustration',
    'Campaign feature strip containing icons and labels for proposed smart training apparel capabilities.',
    'Concept illustration only. Every depicted technical or performance feature is pending technical verification.',
    1024, 116,
  ),
  image(
    'smart-sensors',
    '05_smart_sensors.jpg',
    'Smart sensor concept',
    'concept detail',
    'Campaign crop illustrating proposed sensor placement on FSD training apparel.',
    'Sensor placement and configuration are illustrative only; no operational hardware has been verified.',
    278, 396,
  ),
  image(
    'adaptive-fabric',
    '06_adaptive_fabric.jpg',
    'Adaptive fabric concept',
    'concept detail',
    'Campaign crop showing a close detail of black apparel fabric with champagne-gold elements.',
    'A campaign illustration only. Fabric composition, integrated components and adaptive behavior are unverified.',
    237, 396,
  ),
  image(
    'app-concept',
    '07_app_concept.jpg',
    'App interface concept',
    'concept illustration',
    'Campaign illustration of a proposed FSD MOTION companion app interface.',
    'Concept screen only; it is not evidence of a functioning application, data service, compatibility or results.',
    242, 396,
  ),
  image(
    'temperature-concept',
    '08_temperature_control.jpg',
    'Temperature-related concept',
    'concept illustration',
    'Campaign crop showing an apparel detail with a temperature-related graphic.',
    'Temperature sensing or regulation is not verified. The image is a concept reference, not a product specification.',
    267, 396,
  ),
  image(
    'lifestyle-gym',
    '09_lifestyle_gym.jpg',
    'At the gym',
    'lifestyle campaign crop',
    'Campaign crop of an athlete wearing FSD apparel while training in a gym.',
    'Lifestyle campaign artwork, not independent product photography or proof of performance.',
    274, 215,
  ),
  image(
    'lifestyle-outdoors',
    '10_lifestyle_outdoors.jpg',
    'Outdoors',
    'lifestyle campaign crop',
    'Campaign crop of a woman running outdoors in black FSD apparel with arm sleeves.',
    'Lifestyle campaign artwork. Garment fit, materials, standalone product identity and performance remain unverified.',
    241, 215,
  ),
  image(
    'lifestyle-self-defence',
    '11_lifestyle_self_defence.jpg',
    'Self defence',
    'lifestyle campaign crop',
    'Campaign crop of an athlete practicing a self-defence movement in FSD apparel.',
    'Lifestyle campaign artwork, not independent product photography or proof of performance.',
    242, 215,
  ),
  image(
    'lifestyle-recovery',
    '12_lifestyle_recovery.jpg',
    'Recovery',
    'lifestyle campaign crop',
    'Campaign crop of an athlete resting after training in FSD apparel.',
    'Lifestyle campaign artwork, not independent product photography or evidence of a recovery benefit.',
    267, 215,
  ),
  image(
    'product-lineup',
    '13_packaging_and_product_lineup.jpg',
    'Packaging and product-lineup concept',
    'lineup concept',
    'Wide FSD MOTION concept image showing a proposed package and coordinated apparel lineup.',
    'Lineup and packaging artwork only. It does not verify final product identities, configurations, manufacturing or packaging.',
    846, 227,
  ),
  image(
    'fabric-closeup',
    '14_fabric_closeup.jpg',
    'Fabric close-up',
    'campaign detail crop',
    'Close campaign crop of black textured apparel material with gold-coloured stitching or trim.',
    'Visual reference only. Fabric composition, stitching, durability and construction are unverified.',
    178, 227,
  ),
  image(
    'full-campaign-reference',
    '15_full_campaign_reference.jpg',
    'Full campaign reference',
    'composite campaign reference',
    'Complete FSD MOTION promotional composition with apparel, lifestyle scenes and proposed smart-technology artwork.',
    'Full campaign composition for reference only. It is not a product photograph and its embedded claims are unverified.',
    1024, 1536,
  ),
]);

const product = (slug, name, audience, mainAssetId, galleryAssetIds, description, visualSupport, missingPhotographs) =>
  Object.freeze({
    slug,
    path: motionProductPath(slug),
    name,
    audience,
    category: audience,
    subtitle: 'Visual concept only · clean product photography pending',
    status: 'DRAFT / PENDING APPROVAL',
    mainAssetId,
    assetIds: Object.freeze(galleryAssetIds),
    galleryAssetIds: Object.freeze(galleryAssetIds),
    price: null,
    description,
    visualSupport,
    missingPhotographs: Object.freeze(missingPhotographs),
    technicalStatus: 'PENDING TECHNICAL VERIFICATION',
  });

const products = Object.freeze([
  product(
    'mens-performance-training-top',
    'FSD MOTION Men’s Performance Training Top',
    'Men’s apparel concept',
    'men-apparel',
    ['men-apparel', 'lifestyle-gym', 'lifestyle-self-defence', 'product-lineup'],
    'A men’s training-top concept shown in the supplied FSD MOTION campaign. This private visual preview does not confirm materials, fit, construction, sizing, performance or connected functions.',
    'A men’s training top is visible in the campaign crop and lifestyle references; clean standalone garment photography has not been supplied.',
    ['Clean standalone front, rear and side photographs.', 'Detail photographs of seams, closures and any proposed components.'],
  ),
  product(
    'womens-performance-sports-bra',
    'FSD MOTION Women’s Performance Sports Bra',
    'Women’s apparel concept',
    'women-apparel',
    ['women-apparel', 'lifestyle-outdoors', 'lifestyle-recovery', 'product-lineup'],
    'A women’s sports-bra concept shown in the supplied FSD MOTION campaign. This private visual preview does not confirm materials, fit, construction, sizing, performance or connected functions.',
    'A sports-bra silhouette is visible in the campaign crop and lifestyle references; clean standalone garment photography has not been supplied.',
    ['Clean standalone front and rear photographs.', 'Detail photographs of straps, seams and any proposed components.'],
  ),
  product(
    'performance-training-shorts',
    'FSD MOTION Performance Training Shorts',
    'Training apparel concept',
    'product-lineup',
    ['product-lineup', 'lifestyle-outdoors', 'lifestyle-recovery', 'lifestyle-gym'],
    'Training shorts appear in the supplied FSD MOTION range artwork. This private visual preview does not confirm a final garment, materials, fit, construction, sizing, performance or connected functions.',
    'Shorts are depicted within the campaign lineup and lifestyle artwork; no clean standalone shorts photograph has been supplied.',
    ['Clean standalone front, rear and side photographs.', 'Detail photographs of the waistband, seams and any proposed components.'],
  ),
  product(
    'smart-training-arm-sleeves',
    'FSD MOTION Smart Training Arm Sleeves',
    'Training accessory concept',
    'lifestyle-outdoors',
    ['lifestyle-outdoors', 'women-apparel', 'lifestyle-self-defence', 'product-lineup'],
    'Arm sleeves are depicted in the supplied FSD MOTION campaign. This private visual preview does not confirm a final item, material, fit, sizing, performance or sensor configuration.',
    'Arm sleeves are visible in lifestyle and lineup artwork; there are no clean standalone sleeve photographs or verified sensor-placement details.',
    ['Clean standalone sleeve photographs showing each side and length.', 'Approved details confirming whether any sensor configuration is intended.'],
  ),
]);

const stories = Object.freeze([
  Object.freeze({ title: 'At the gym', imageId: 'lifestyle-gym', copy: 'A campaign study of FSD MOTION apparel in a gym-training setting.' }),
  Object.freeze({ title: 'Outdoors', imageId: 'lifestyle-outdoors', copy: 'A campaign study of FSD MOTION apparel in an outdoor movement setting.' }),
  Object.freeze({ title: 'Self defence', imageId: 'lifestyle-self-defence', copy: 'A campaign study of FSD MOTION apparel during a self-defence movement.' }),
  Object.freeze({ title: 'Recovery', imageId: 'lifestyle-recovery', copy: 'A campaign study of FSD MOTION apparel in a post-training moment.' }),
]);

const pendingFeatures = Object.freeze([
  'Movement tracking',
  'Heart-rate monitoring',
  'Performance analysis',
  'Temperature sensing',
  'Breathability and comfort',
  'Durable, flexible construction',
  'Companion app connectivity',
  'Integrated smart sensors',
].map(label => Object.freeze({ label, status: 'PENDING TECHNICAL VERIFICATION' })));

const pendingSpecifications = Object.freeze([
  'Materials, fabric composition and construction',
  'Sizing, fit and available variants',
  'Technical components and sensor configuration',
  'App availability, compatibility and functionality',
  'Performance testing, accuracy and certifications',
  'Pricing, stock, production status and availability',
]);

const missingPhotographs = Object.freeze([
  'Clean independent front, rear and side photographs for each proposed garment.',
  'Product-specific close-ups of seams, trims, closures and any connected components.',
  'Standalone arm-sleeve images and confirmation of whether sleeves include any sensors.',
  'Independent product images; all current files are crops or a composite from one campaign artwork.',
]);

export function createMotionPreview(productSlug = null) {
  const selectedProduct = productSlug
    ? products.find(item => item.slug === productSlug) || null
    : null;
  if (productSlug && !selectedProduct) return null;
  return Object.freeze({
    path: motionPreviewPath,
    collection: Object.freeze({
      name: 'FSD MOTION',
      subtitle: 'Smart Training Apparel',
      status: 'DRAFT / PENDING APPROVAL',
      headline: 'REAL MOVEMENT. REAL DATA. A STRONGER YOU.',
      supportingMessage: 'TRAIN SMARTER. MOVE BETTER. GO FURTHER.',
      introduction: 'Discover FSD MOTION, a performance apparel concept bringing together sculpted athletic silhouettes, distinctive FSD styling and an exploration of connected training technology. Designed to express the next generation of movement-focused apparel.',
      hero: assets.find(asset => asset.id === 'campaign-hero'),
      heroAssetId: 'campaign-hero',
      heroTextEmbedded: true,
      price: null,
      seoDraft: Object.freeze({
        title: 'FSD MOTION Smart Training Apparel | FSD Fitness & Self Defence',
        description: 'Explore FSD MOTION, a premium smart training apparel concept combining signature black-and-gold performance styling with a vision for connected movement.',
      }),
    }),
    product: selectedProduct,
    products,
    assets,
    stories,
    pendingFeatures,
    pendingSpecifications,
    missingPhotographs,
    sourceArchive: archive,
    sourceArchiveSha256: archiveSha256,
    sourceImageCount: assets.length,
    reviewBoundary: 'Private collection concept only. All supplied files are campaign crops or a composite, not independent studio photographs. Embedded technology and performance claims are unverified.',
  });
}

export const motionPreviewManifest = createMotionPreview();
