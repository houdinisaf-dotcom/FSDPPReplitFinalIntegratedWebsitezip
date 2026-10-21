import { products } from './catalogue-data.js';
import { aegisGiletMediaPrefix, aegisGiletPreviewPath } from './aegis-gilet-preview-path.js';

const sourceFile = 'attached_assets/image_1792573479758.png';

export const aegisGiletSource = Object.freeze({
  file: sourceFile,
  sha256: '6eadfdde716112b1cdfd3634223271a462b62ff130878fd69f2e0e355907c8d7',
  width: 1536,
  height: 1024,
  type: 'image/png',
});

const image = (id, label, alt, file, width, height, crop, reviewNote) => Object.freeze({
  id,
  label,
  alt,
  file,
  width,
  height,
  crop: Object.freeze(crop),
  src: `${aegisGiletMediaPrefix}${id}`,
  type: 'image/webp',
  reviewNote,
});

const derived = 'attached_assets/aegis-gilet-derived/';
const visualNote = 'Supplied visual reference only; final garment construction and specifications are not verified.';

const gallery = Object.freeze([
  image(
    'front-three-quarter',
    'Front three-quarter view',
    'Supplied visual reference showing a woman in a black FSD gilet from the front three-quarter angle.',
    `${derived}front-three-quarter.webp`,
    491,
    705,
    { x: 0, y: 0, width: 491, height: 705 },
    'Front view cropped from the supplied multi-view board. It is a visual reference, not verified product construction.',
  ),
  image(
    'side-profile',
    'Side profile',
    'Supplied visual reference showing a woman in a black gilet in side profile.',
    `${derived}side-profile.webp`,
    307,
    705,
    { x: 499, y: 0, width: 307, height: 705 },
    'Side-profile crop from the supplied board; fit, panel function, and final garment construction remain unverified.',
  ),
  image(
    'full-rear',
    'Full back view',
    'Supplied visual reference showing the back of a black gilet worn by a model.',
    `${derived}full-rear.webp`,
    374,
    705,
    { x: 813, y: 0, width: 374, height: 705 },
    'Back view supplied for review. Its central mesh-like panel has not been verified against a final garment sample.',
  ),
  image(
    'rear-three-quarter',
    'Rear three-quarter view',
    'Supplied visual reference showing a woman in a black gilet from the rear three-quarter angle.',
    `${derived}rear-three-quarter.webp`,
    342,
    705,
    { x: 1194, y: 0, width: 342, height: 705 },
    'Rear three-quarter crop supplied for review; final garment consistency is pending confirmation.',
  ),
  image(
    'zipper-pull',
    'Zipper pull detail',
    'Close-up visual reference of gold-tone zipper hardware on a black garment.',
    `${derived}zipper-pull.webp`,
    239,
    311,
    { x: 0, y: 713, width: 239, height: 311 },
    visualNote,
  ),
  image(
    'mesh-panel',
    'Panel detail',
    'Close-up visual reference of a perforated-looking black garment panel.',
    `${derived}mesh-panel.webp`,
    244,
    311,
    { x: 247, y: 713, width: 244, height: 311 },
    'Visual panel detail only; material composition and function are not verified.',
  ),
  image(
    'waist-adjuster',
    'Waist adjustment detail',
    'Close-up visual reference of a waist adjustment detail with gold-tone hardware.',
    `${derived}waist-adjuster.webp`,
    253,
    311,
    { x: 499, y: 713, width: 253, height: 311 },
    visualNote,
  ),
  image(
    'zipper-detail',
    'Zipper hardware detail',
    'Close-up visual reference of a zipper and gold-tone pull on black fabric.',
    `${derived}zipper-detail.webp`,
    238,
    311,
    { x: 760, y: 713, width: 238, height: 311 },
    visualNote,
  ),
  image(
    'chest-shield',
    'Chest shield detail',
    'Close-up visual reference of an FSD shield emblem on black fabric.',
    `${derived}chest-shield.webp`,
    276,
    311,
    { x: 1006, y: 713, width: 276, height: 311 },
    'Branding appearance shown for visual review; final placement and manufacture are not verified.',
  ),
  image(
    'sleeve-emblem',
    'Sleeve emblem detail',
    'Close-up visual reference of an FSD shield emblem on a black sleeve.',
    `${derived}sleeve-emblem.webp`,
    246,
    311,
    { x: 1290, y: 713, width: 246, height: 311 },
    'Branding appearance shown for visual review; final placement and manufacture are not verified.',
  ),
]);

export function createAegisGiletPreview() {
  const product = products.find(candidate => candidate.id === 46);
  if (product?.name !== 'FSD Aegis Modest Performance Gilet') {
    throw new Error('The existing FSD Aegis Modest Performance Gilet record is unavailable.');
  }
  return Object.freeze({
    path: aegisGiletPreviewPath,
    product,
    campaign: gallery[0],
    gallery,
    description: 'Private visual review of the supplied Aegis gilet image set. Materials, sizing, performance, and final garment construction have not been verified.',
    reviewNote: 'The photographs are cropped from the supplied multi-view board. Back-panel construction and all product specifications remain pending review against the final garment.',
  });
}

export const aegisGiletPreviewRecord = createAegisGiletPreview();
