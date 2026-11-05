import test from 'node:test';
import assert from 'node:assert/strict';
import { products, productImagesForDisplay } from '../src/data/products.js';
import {
  buildCatalogueRelationshipIndex,
  catalogueRelationshipFor,
  catalogueRelationshipForId,
  catalogueRelationships,
} from '../src/data/catalogue-relationships.js';
import { CLOTHING_LINES, productBelongsToLine } from '../src/clothing-lines.js';
import {
  GARMENT_CATEGORY_DEFINITIONS,
  garmentCategoriesForProduct,
  garmentCategoryOptions,
} from '../src/data/garment-category-map.js';
import { deriveTechnicalCollections } from '../src/catalogue-collections.js';

const stableProductValues = product => ({
  id: product.id,
  name: product.name,
  audience: product.audience,
  category: product.category,
  collection: product.collection,
  collectionLine: product.collectionLine,
  colourways: product.colourways,
  sizes: product.sizes,
  publicationStatus: product.publicationStatus,
  confirmedPrice: product.confirmedPrice,
  sku: product.sku,
  options: product.options,
  imageStatus: product.imageStatus,
  images: product.images,
});

test('relationship index joins existing product records without copying or changing their values', () => {
  const before = structuredClone(products.map(stableProductValues));

  assert.equal(catalogueRelationships.length, products.length);
  assert.equal(new Set(products.map(product => product.id)).size, products.length);

  for (const product of products) {
    const relationship = catalogueRelationshipForId(product.id);
    assert.ok(relationship);
    assert.equal(relationship.product, product, 'relationship points to the canonical product object');
    assert.equal(catalogueRelationshipFor(product), relationship);
    assert.equal(relationship.product.confirmedPrice, product.confirmedPrice);
    assert.equal(relationship.product.publicationStatus, product.publicationStatus);
    assert.equal(relationship.product.sku, product.sku);
    assert.equal(relationship.product.options, product.options);
    assert.equal(relationship.product.sizes, product.sizes);
    assert.deepEqual(relationship.imageReferences, productImagesForDisplay(product));
    assert.deepEqual(relationship.garmentCategoryIds, garmentCategoriesForProduct(product));
    assert.ok(relationship.garmentCategoryIds.every(id =>
      GARMENT_CATEGORY_DEFINITIONS.some(category => category.id === id)));
    assert.deepEqual(
      relationship.clothingLineIds,
      CLOTHING_LINES.filter(line => productBelongsToLine(product, line.id)).map(line => line.id),
    );
  }

  assert.deepEqual(products.map(stableProductValues), before);
  assert.throws(() => buildCatalogueRelationshipIndex([
    products[0],
    { ...products[0] },
  ]), /Duplicate catalogue product ID/);
});

test('existing clothing-line and technical collection membership stays connected to the same records', () => {
  const expectedWomen = {
    aeroforge: [18, 38, 39, 51],
    combat: [33, 41],
    flex: [75],
    breeze: [73],
    'modest-flow': [50],
  };
  for (const [lineId, ids] of Object.entries(expectedWomen)) {
    assert.deepEqual(
      catalogueRelationships
        .filter(relationship => relationship.clothingLineIds.includes(lineId))
        .map(relationship => relationship.product.id),
      ids,
    );
  }

  const aeroforgeCrossListing = catalogueRelationshipForId(18);
  assert.equal(aeroforgeCrossListing.product.audience, 'Unisex');
  assert.ok(aeroforgeCrossListing.product.alsoShowIn.includes('Women’s Performance'));
  assert.ok(aeroforgeCrossListing.clothingLineIds.includes('aeroforge'));

  const technical = deriveTechnicalCollections(products);
  for (const collection of technical) {
    const indexedIds = catalogueRelationships
      .filter(relationship => relationship.technicalCollectionIds.includes(collection.id))
      .map(relationship => relationship.product.id);
    assert.deepEqual(indexedIds, collection.products.map(product => product.id));
    assert.equal(new Set(indexedIds).size, indexedIds.length);
  }
});

test('garment-category tabs omit empty categories in each audience scope', () => {
  for (const audience of ['Men’s', 'Unisex', 'Women’s']) {
    const scopedProducts = products.filter(product => product.audience === audience);
    const tabs = garmentCategoryOptions(scopedProducts);
    assert.equal(tabs[0].count, scopedProducts.length);
    assert.ok(tabs.slice(1).every(tab => tab.count > 0));
  }
});
