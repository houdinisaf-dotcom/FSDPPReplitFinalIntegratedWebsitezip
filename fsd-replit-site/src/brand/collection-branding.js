import { COLLECTION_IMAGE_ASSETS } from '../collection-image-config.js';
import { MARK_NAMES, WOMENS_LINES, WOMENS_PRIMARY_MARK } from './tokens.js';
import { OFFICIAL_LOGO_FILES } from './logo-assets.js';
import { WOMENS_BRANDING_ASSIGNMENT_STATUS } from './product-branding.js';

const womensLines = new Map(WOMENS_LINES
  .filter(line => line.id !== 'all')
  .map(line => [line.id, line]));
const animalSeries = new Set(['tiger-series', 'scorpion-series']);

// This resolves collection-level concept references only. It never assigns a
// mark to a garment. The animal patch images remain photographic references,
// not official standalone logo artwork.
export function resolveCollectionBranding(collectionId) {
  const line = womensLines.get(collectionId);
  if (line) {
    const companionMark = line.companion;
    const requiredMarks = [WOMENS_PRIMARY_MARK, companionMark].filter(Boolean);
    const missingOfficialMarks = requiredMarks.filter(mark => !OFFICIAL_LOGO_FILES[mark]);

    return Object.freeze({
      collectionId,
      scope: 'collection-reference-only',
      primaryMark: WOMENS_PRIMARY_MARK,
      primaryName: MARK_NAMES[WOMENS_PRIMARY_MARK],
      primaryAsset: OFFICIAL_LOGO_FILES[WOMENS_PRIMARY_MARK],
      companionMark,
      companionName: companionMark ? MARK_NAMES[companionMark] : null,
      companionAsset: companionMark ? OFFICIAL_LOGO_FILES[companionMark] : null,
      missingOfficialMarks: Object.freeze(missingOfficialMarks),
      productAssignmentStatus: WOMENS_BRANDING_ASSIGNMENT_STATUS,
      status: WOMENS_BRANDING_ASSIGNMENT_STATUS,
    });
  }

  if (animalSeries.has(collectionId)) {
    return Object.freeze({
      collectionId,
      scope: 'photographic-reference-only',
      officialAsset: null,
      photographicPatchReference: COLLECTION_IMAGE_ASSETS[collectionId]?.logo ?? null,
      productAssignmentStatus: WOMENS_BRANDING_ASSIGNMENT_STATUS,
      status: WOMENS_BRANDING_ASSIGNMENT_STATUS,
    });
  }

  return null;
}
