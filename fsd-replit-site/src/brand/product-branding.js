export const WOMENS_BRANDING_ASSIGNMENT_STATUS = 'BRANDING ASSIGNMENT PENDING';

// These are pending product-level approvals, not mark assignments. In
// particular, product 18 remains unisex and is only cross-listed for women.
export const WOMENS_BRANDING_PENDING_PRODUCT_IDS = Object.freeze([
  18, 33, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 56, 57, 73, 74, 75,
]);

export const WOMENS_PRODUCT_BRANDING_ASSIGNMENTS = Object.freeze(
  Object.fromEntries(WOMENS_BRANDING_PENDING_PRODUCT_IDS.map(id => [
    id,
    Object.freeze({
      concept: null,
      status: WOMENS_BRANDING_ASSIGNMENT_STATUS,
    }),
  ])),
);

// These series products retain their approved photographic patch references,
// but neither product has an approved standalone mark assignment.
export const SERIES_BRANDING_PENDING_PRODUCT_IDS = Object.freeze([27, 77]);

const seriesPendingAssignments = Object.fromEntries(SERIES_BRANDING_PENDING_PRODUCT_IDS.map(id => [
  id,
  Object.freeze({
    concept: null,
    status: WOMENS_BRANDING_ASSIGNMENT_STATUS,
  }),
]));

export function productBrandingAssignmentFor(product) {
  const id = Number(product?.id);
  if (!Number.isSafeInteger(id)) return null;
  return WOMENS_PRODUCT_BRANDING_ASSIGNMENTS[id] ?? seriesPendingAssignments[id] ?? null;
}
