import { nexusMediaPrefix, nexusPreviewPath } from './nexus-preview-path.js';

const archive = 'attached_assets/FSD_NEXUS_Private_Website_Asset_Pack_1792589722120.zip';
const previousArchive = 'attached_assets/FSD_NEXUS_Private_Website_Asset_Pack_1792589619549.zip';
const archiveSha256 = '297b77067ec057ddc7b4c402dc9c4cd9091ce5cf6db16ed3b353241d6a7981c0';
const approvedDirectory = 'attached_assets/fsd-nexus-approved/';
const auditDirectory = 'attached_assets/fsd-nexus-audit/';

const image = (id, fileName, label, alt, reviewNote, width, height, type, status) => Object.freeze({
  id,
  file: `${approvedDirectory}${fileName}`,
  label,
  alt,
  reviewNote,
  width,
  height,
  type,
  status,
  src: `${nexusMediaPrefix}${id}`,
});

const auditImage = (id, fileName, label, alt, finding, width, height, status) => Object.freeze({
  id,
  file: `${auditDirectory}${fileName}`,
  label,
  alt,
  finding,
  width,
  height,
  type: 'image/jpeg',
  status,
  src: `${nexusMediaPrefix}audit/${id}`,
});

const assets = Object.freeze([
  image(
    'app-interface',
    '06_app_interface-logo-approved.png',
    'Companion app interface concept',
    'Static FSD NEXUS app interface concept with the approved website logo applied. The displayed readiness score is illustrative, not live data.',
    'Approved image correction only. Static screen concept; the displayed score and all interface labels are not verified measurements or product capabilities.',
    375,
    282,
    'image/png',
    'approved corrected image candidate',
  ),
  image(
    'proposed-features',
    '09_feature_icons.jpg',
    'Proposed feature concepts',
    'Unbranded concept graphic describing proposed heart-rate, sleep and recovery, activity, readiness, and trend features.',
    'Unbranded campaign artwork. Every feature and benefit shown is proposed and pending technical validation.',
    221,
    500,
    'image/jpeg',
    'unbranded concept reference',
  ),
  image(
    'progression-conditions',
    '11_conditions_before_progression.jpg',
    'Conditions before progression',
    'Unbranded checklist concept covering technical testing, data and security review, manufacturing feasibility, regulatory approvals, and commercial validation.',
    'Unbranded checklist artwork, not evidence that any validation, compliance, manufacturing, or commercial gate has been completed.',
    580,
    175,
    'image/jpeg',
    'unbranded concept reference',
  ),
]);

const auditAssets = Object.freeze([
  auditImage(
    'full-campaign-reference',
    '01_full_campaign_reference.jpg',
    '01 · Full campaign composite',
    'Original composite reference board showing the NEXUS ring and campaign imagery. Embedded marks do not match the approved master.',
    'Composite reference only. Multiple embedded ring and apparel marks require correction; this is not standalone product photography.',
    1536,
    1024,
    'REFERENCE ONLY · BRAND CORRECTION REQUIRED',
  ),
  auditImage(
    'hero-athlete-ring',
    '02_hero_athlete_and_ring.jpg',
    '02 · Athlete and ring campaign crop',
    'Campaign crop of an athlete holding the NEXUS concept ring with embedded FSD marks requiring correction.',
    'Ring and garment marks differ from the approved website master. Campaign crop, not a standalone professional product photograph.',
    940,
    500,
    'BRAND CORRECTION REQUIRED',
  ),
  auditImage(
    'ring-product-closeup',
    '03_ring_product_closeup.jpg',
    '03 · Ring product close-up crop',
    'Campaign crop of a smart-ring product close-up with an embedded mark requiring correction.',
    'Embedded ring emblem differs from the approved website master. Campaign crop, not a standalone product photograph.',
    345,
    405,
    'BRAND CORRECTION REQUIRED',
  ),
  auditImage(
    'fitness-lifestyle',
    '04_fitness_lifestyle.jpg',
    '04 · Fitness lifestyle crop',
    'Fitness lifestyle campaign crop showing the ring; the embedded ring mark requires correction.',
    'Embedded ring mark differs from the approved website master. Campaign crop, not a standalone professional photograph.',
    330,
    282,
    'BRAND CORRECTION REQUIRED',
  ),
  auditImage(
    'sleep-recovery-lifestyle',
    '05_sleep_recovery_lifestyle.jpg',
    '05 · Sleep and recovery lifestyle crop',
    'Sleep and recovery lifestyle campaign crop with an embedded wearable mark requiring correction.',
    'Embedded wearable mark differs from the approved website master. Campaign crop, not a standalone professional photograph.',
    380,
    282,
    'BRAND CORRECTION REQUIRED',
  ),
  auditImage(
    'app-interface-original',
    '06_app_interface_concept.jpg',
    '06 · Original app interface crop',
    'Original app interface campaign crop with the embedded wordmark flagged against the approved website master.',
    'Original crop is flagged. The separately supplied corrected app-screen candidate is approved as an image only.',
    375,
    282,
    'ORIGINAL FLAGGED · CORRECTED CANDIDATE APPROVED FOR IMAGE ONLY',
  ),
  auditImage(
    'ring-charging-case',
    '07_ring_charging_case.jpg',
    '07 · Ring and charging case crop',
    'Campaign crop showing the ring and charging case with embedded marks requiring correction.',
    'Ring and case marks differ from the approved website master. Campaign crop, not a standalone product photograph.',
    451,
    282,
    'BRAND CORRECTION REQUIRED',
  ),
  auditImage(
    'ring-macro-detail',
    '08_ring_macro_detail.jpg',
    '08 · Ring macro detail crop',
    'Macro campaign crop of the ring showing an embedded shield and wordmark requiring correction.',
    'Embedded ring shield and wordmark differ from the approved website master. Campaign crop, not a standalone product photograph.',
    335,
    179,
    'BRAND CORRECTION REQUIRED',
  ),
]);

const brandAudit = Object.freeze([
  { assetId: '01_full_campaign_reference', file: '01_full_campaign_reference.jpg', finding: 'Multiple embedded marks on ring and apparel differ from the approved master; full composite is reference only.', status: 'REFERENCE ONLY · BRAND CORRECTION REQUIRED' },
  { assetId: '02_hero_athlete_and_ring', file: '02_hero_athlete_and_ring.jpg', finding: 'Embedded ring and garment marks differ from the approved master.', status: 'BRAND CORRECTION REQUIRED' },
  { assetId: '03_ring_product_closeup', file: '03_ring_product_closeup.jpg', finding: 'Embedded ring emblem differs from the approved master.', status: 'BRAND CORRECTION REQUIRED' },
  { assetId: '04_fitness_lifestyle', file: '04_fitness_lifestyle.jpg', finding: 'Embedded ring mark differs from the approved master.', status: 'BRAND CORRECTION REQUIRED' },
  { assetId: '05_sleep_recovery_lifestyle', file: '05_sleep_recovery_lifestyle.jpg', finding: 'Embedded wearable mark differs from the approved master.', status: 'BRAND CORRECTION REQUIRED' },
  { assetId: '06_app_interface_concept', file: '06_app_interface_concept.jpg', finding: 'Original embedded wordmark is flagged; the separately corrected candidate was approved as an image only.', status: 'ORIGINAL FLAGGED · CORRECTED CANDIDATE APPROVED FOR IMAGE ONLY' },
  { assetId: '07_ring_charging_case', file: '07_ring_charging_case.jpg', finding: 'Embedded ring and case marks differ from the approved master.', status: 'BRAND CORRECTION REQUIRED' },
  { assetId: '08_ring_macro_detail', file: '08_ring_macro_detail.jpg', finding: 'Embedded ring shield and wordmark differ from the approved master.', status: 'BRAND CORRECTION REQUIRED' },
  { assetId: '09_feature_icons', file: '09_feature_icons.jpg', finding: 'No embedded logo identified. Capability names and outcomes remain unverified.', status: 'NO LOGO IDENTIFIED · CLAIMS PENDING' },
  { assetId: '10_strategic_value_concept', file: '10_strategic_value_concept.jpg', finding: 'No embedded logo identified. Strategic and commercial statements are unverified; image is excluded.', status: 'NO LOGO IDENTIFIED · EXCLUDED' },
  { assetId: '11_conditions_before_progression', file: '11_conditions_before_progression.jpg', finding: 'No embedded logo identified. Checklist is not evidence that any gate has been completed.', status: 'NO LOGO IDENTIFIED · CHECKLIST NOT EVIDENCE' },
].map(entry => Object.freeze(entry)));

const proposedFeatures = Object.freeze([
  'Heart-rate monitoring',
  'Sleep and recovery insights',
  'Activity tracking',
  'Readiness scoring',
  'Long-term trends',
  'App connectivity',
  'Integrated sensors',
].map(name => Object.freeze({
  name,
  status: 'PROPOSED — PENDING TECHNICAL VALIDATION',
})));

const progressionConditions = Object.freeze([
  'Technical validation and testing',
  'Data privacy and security review',
  'Manufacturing feasibility',
  'Regulatory approvals, where required',
  'Commercial viability',
].map(name => Object.freeze({
  name,
  status: 'NOT VERIFIED',
})));

export const nexusPreviewManifest = Object.freeze({
  sourceArchive: archive,
  sourceArchiveSha256: archiveSha256,
  name: 'FSD NEXUS',
  category: 'WEARABLE TECHNOLOGY / SMART RING CONCEPT',
  headline: 'DISCREET TECHNOLOGY. DEEPER INSIGHTS.',
  campaignMessage: 'TRAIN. RECOVER. BALANCE. PERFORM. LIVE BETTER.',
  description: 'FSD NEXUS explores the potential of a discreet premium smart ring designed around training, recovery and everyday wellbeing. Its black-and-gold concept design reflects the signature FSD identity, bringing performance-inspired styling to the vision of connected wearable technology.',
  status: 'CONCEPT FOR EXPLORATION — NOT A CURRENT PRODUCT OR COMMITMENT.',
  draftStatus: 'PRIVATE CONCEPT · DRAFT / PENDING APPROVAL',
  imageBoundary: 'The approved concept gallery contains only the corrected app-screen candidate and unbranded references. Unmodified branded crops appear only in the private audit gallery, clearly flagged and excluded from product presentation.',
  productPhotographyStatus: 'SUPPLIED RING, CASE AND LIFESTYLE CROPS — PRIVATE AUDIT REFERENCES ONLY · BRAND CORRECTION REQUIRED.',
  staticImageStatus: 'STATIC CONCEPT IMAGE — NO LIVE DATA OR FUNCTIONAL DASHBOARD.',
  price: null,
  availability: null,
  checkoutEnabled: false,
  route: nexusPreviewPath,
  assets,
  auditAssets,
  brandAudit,
  proposedFeatures,
  progressionConditions,
  excludedAssetIds: Object.freeze([
    '01_full_campaign_reference',
    '02_hero_athlete_and_ring',
    '03_ring_product_closeup',
    '04_fitness_lifestyle',
    '05_sleep_recovery_lifestyle',
    '06_app_interface_concept',
    '07_ring_charging_case',
    '08_ring_macro_detail',
    '10_strategic_value_concept',
  ]),
  reviewBoundary: 'This private concept does not confirm product design, manufacturing, any sensor or software capability, health or recovery outcomes, regulatory status, data security, pricing, availability, or commercial commitment.',
});

export function createNexusPreview() {
  return {
    name: nexusPreviewManifest.name,
    category: nexusPreviewManifest.category,
    headline: nexusPreviewManifest.headline,
    campaignMessage: nexusPreviewManifest.campaignMessage,
    description: nexusPreviewManifest.description,
    status: nexusPreviewManifest.status,
    draftStatus: nexusPreviewManifest.draftStatus,
    imageBoundary: nexusPreviewManifest.imageBoundary,
    productPhotographyStatus: nexusPreviewManifest.productPhotographyStatus,
    staticImageStatus: nexusPreviewManifest.staticImageStatus,
    price: null,
    availability: null,
    checkoutEnabled: false,
    route: nexusPreviewManifest.route,
    assets: [...nexusPreviewManifest.assets],
    auditAssets: [...nexusPreviewManifest.auditAssets],
    brandAudit: [...nexusPreviewManifest.brandAudit],
    proposedFeatures: [...nexusPreviewManifest.proposedFeatures],
    progressionConditions: [...nexusPreviewManifest.progressionConditions],
    excludedAssetIds: [...nexusPreviewManifest.excludedAssetIds],
    reviewBoundary: nexusPreviewManifest.reviewBoundary,
  };
}

export function getNexusPreviewAsset(id) {
  return nexusPreviewManifest.assets.find(asset => asset.id === id) || null;
}

export function getNexusAuditAsset(id) {
  return nexusPreviewManifest.auditAssets.find(asset => asset.id === id) || null;
}

export function getNexusSourceIntegrity() {
  return {
    archive: nexusPreviewManifest.sourceArchive,
    previousArchive,
    sha256: nexusPreviewManifest.sourceArchiveSha256,
  };
}
