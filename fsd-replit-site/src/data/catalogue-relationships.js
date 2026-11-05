import { products, productImagesForDisplay } from './products.js';
import {
  GARMENT_CATEGORY_DEFINITIONS,
  garmentCategoriesForProduct,
} from './garment-category-map.js';
import { CLOTHING_LINES, productBelongsToLine } from '../clothing-lines.js';
import { deriveTechnicalCollections } from '../catalogue-collections.js';
import { productBrandingAssignmentFor } from '../brand/product-branding.js';

const validGarmentCategories = new Set(GARMENT_CATEGORY_DEFINITIONS.map(category => category.id));

// A read-only derived view: the canonical product object continues to own all
// commercial values, variants, publication status, and descriptions.
export function buildCatalogueRelationshipIndex(records = products) {
  if (!Array.isArray(records)) throw new TypeError('Catalogue records must be an array.');

  const index = new Map();
  for (const product of records) {
    const id = Number(product?.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      throw new TypeError(`Catalogue product has an invalid stable ID: ${product?.id}`);
    }
    if (index.has(id)) throw new Error(`Duplicate catalogue product ID: ${id}`);
    index.set(id, null);
  }

  const technicalMemberships = new Map([...index.keys()].map(id => [id, []]));
  for (const collection of deriveTechnicalCollections(records)) {
    for (const product of collection.products) {
      technicalMemberships.get(Number(product.id))?.push(collection.id);
    }
  }

  for (const product of records) {
    const id = Number(product.id);
    const garmentCategoryIds = garmentCategoriesForProduct(product);
    const invalidCategory = garmentCategoryIds.find(categoryId => !validGarmentCategories.has(categoryId));
    if (invalidCategory) {
      throw new Error(`Product ${id} uses an unknown garment category: ${invalidCategory}`);
    }

    const clothingLineIds = CLOTHING_LINES
      .filter(line => productBelongsToLine(product, line.id))
      .map(line => line.id);
    const technicalCollectionIds = technicalMemberships.get(id) ?? [];
    const declaredCollectionIds = Array.isArray(product.collectionIds) ? product.collectionIds : [];
    const collectionIds = [...new Set([
      ...declaredCollectionIds,
      ...clothingLineIds,
      ...technicalCollectionIds,
    ])];

    index.set(id, Object.freeze({
      product,
      collectionIds: Object.freeze(collectionIds),
      clothingLineIds: Object.freeze(clothingLineIds),
      technicalCollectionIds: Object.freeze([...technicalCollectionIds]),
      garmentCategoryIds: Object.freeze([...garmentCategoryIds]),
      imageReferences: Object.freeze(productImagesForDisplay(product)),
      brandingAssignment: productBrandingAssignmentFor(product),
    }));
  }

  return index;
}

const canonicalIndex = buildCatalogueRelationshipIndex();

export const catalogueRelationships = Object.freeze([...canonicalIndex.values()]);

export function catalogueRelationshipFor(product) {
  if (!product || typeof product !== 'object') return null;
  const id = Number(product.id);
  const canonical = canonicalIndex.get(id);
  if (canonical?.product === product) return canonical;
  return buildCatalogueRelationshipIndex([product]).get(id) ?? null;
}

export function catalogueRelationshipForId(id) {
  return canonicalIndex.get(Number(id)) ?? null;
}
