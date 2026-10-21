import test from 'node:test';
import assert from 'node:assert/strict';
import { collectionDivisions } from '../src/collection-divisions.js';
import { categories, products } from '../src/catalogue-data.js';
import { createNavigationModel, getNavigationFeature, primaryNavigation } from '../src/site-navigation.js';

const menu = createNavigationModel();

test('primary navigation matches the five approved sections', () => {
  assert.deepEqual(primaryNavigation.map(item => item.label), [
    'COLLECTIONS',
    'BIO-LAB™',
    'HARDWARE',
    'THE HOUSE',
    'PRIVATE ACCESS',
  ]);
  assert.deepEqual(menu.map(item => item.id), [
    'collections',
    'bio-lab',
    'hardware',
    'house',
    'private-access',
  ]);
});

test('Collections reproduces the reference groups and uses existing subcategories', () => {
  const collections = menu[0];
  assert.deepEqual(collections.groups.map(group => group.title), [
    'MEN’S LUXURY PERFORMANCE',
    'WOMEN’S MODEST COMBAT',
    'LIMITED COLLECTIONS',
    'NEW & FEATURED CONCEPTS',
  ]);

  const men = collections.groups[0];
  assert.equal(men.items[1].title, '2-in-1 Combat Training Shorts & Tanks');
  assert.equal(men.items[1].kind, 'subcategory');
  assert.equal(men.items[1].sourceSubcategoryIndex, 1);
  assert.ok(men.items.some(item => item.title === 'Training Sets'));
  assert.ok(collections.groups[2].items.some(item => item.title === 'Volcanic Amber Capsule'));
  assert.ok(collections.groups[2].items.some(item => item.title === 'Vector Camo Capsule'));
  assert.equal(collections.groups[2].navigationUnavailable, true);
  assert.equal(collections.groups[3].navigationUnavailable, true);
});

test('category menu items use exact existing catalogue categories', () => {
  const categoryItems = menu.flatMap(section => section.groups.flatMap(group => group.items))
    .filter(item => item.kind === 'category');
  assert.ok(categoryItems.length > 0);
  for (const item of categoryItems) {
    assert.ok(categories.includes(item.source?.categories?.[0]), `${item.title} must match a catalogue category`);
  }
});

test('feature images remain mapped to the selected collection instead of borrowing unrelated artwork', () => {
  const conceptFeature = getNavigationFeature(menu[0], 0, 1);
  assert.equal(conceptFeature.item, '2-in-1 Combat Training Shorts & Tanks');
  assert.deepEqual(conceptFeature.imageSources, []);

  const women = menu[0].groups[1];
  const hijabIndex = women.items.findIndex(item => item.title === 'Performance Hijabs');
  const hijabFeature = getNavigationFeature(menu[0], 1, hijabIndex);
  assert.ok(hijabFeature.imageSources.includes('/images/fsd-velocity-performance-sports-hijab.jpg'));
  for (const imagePath of hijabFeature.imageSources) {
    assert.ok(products.some(product => product.images?.some(image => image.src === imagePath)));
  }

  assert.ok(women.items.some(item => item.title === 'Performance Hijabs'));
  assert.ok(women.items.some(item => item.title === 'Sports Hijabs'));
});

test('Bio-Lab and Hardware reuse current division groups and product records', () => {
  assert.deepEqual(menu[1].groups.map(group => group.title), ['WEARABLE TECHNOLOGY & CONCEPTS']);
  assert.ok(menu[1].groups[0].items.length > 0);
  assert.deepEqual(menu[2].groups.map(group => group.title), collectionDivisions
    .find(division => division.id === 'hardware').groups.map(group => group.title));
  assert.ok(menu[2].groups[0].items.some(item => item.record?.name));
});

test('weighted rope is an opt-in Hardware draft preview, not a published catalogue record', () => {
  const publicHardware = menu.find(section => section.id === 'hardware');
  const strengthGroup = publicHardware.groups.find(group => group.title === 'STRENGTH EQUIPMENT');
  assert.ok(strengthGroup);
  assert.equal(strengthGroup.items.some(item => item.title === 'FSD Weighted Skipping Rope'), false);

  const previewMenu = createNavigationModel({ includeDraftPreviews: true });
  const previewHardware = previewMenu.find(section => section.id === 'hardware');
  const previewGroup = previewHardware.groups.find(group => group.title === 'STRENGTH EQUIPMENT');
  const ropeIndex = previewGroup.items.findIndex(item => item.title === 'FSD Weighted Skipping Rope');
  const rope = previewGroup.items[ropeIndex];
  assert.ok(rope);
  assert.equal(rope.kind, 'draft-product');
  assert.equal(rope.previewOnly, true);
  assert.equal(rope.href, '/__catalogue-preview/weighted-skipping-rope/');
  assert.equal(rope.featureImageSrc, `${rope.href}media/weighted-rope-campaign`);
  assert.match(rope.description, /not for sale/i);
  assert.equal(rope.productId, undefined);
  assert.equal(products.some(product => product.name === rope.title), false);
  assert.deepEqual(getNavigationFeature(previewHardware, 0, ropeIndex).imageSources, [rope.featureImageSrc]);
});

test('House destinations remain existing anchors and do not claim proposed locations are live', () => {
  const house = menu.find(item => item.id === 'house');
  assert.deepEqual(house.groups.map(group => group.title), [
    'OUR STORY',
    'FLAGSHIPS',
    'FIGHT PROMOTIONS',
    'GLOBAL VISION',
    'INVESTOR RELATIONS',
  ]);
  assert.ok(house.groups.filter(group => group.href).every(group =>
    ['#philosophy', '#fsd-division-global'].includes(group.href)));
  assert.ok(house.groups[1].items.every(item => /no location or service is represented as operational/i.test(item.description)));
  assert.equal(house.groups[1].href, '');
  assert.equal(house.groups[1].sourceDivisionId, 'global');
  assert.equal(house.groups[1].sourceGroupIndex, 0);
  assert.equal(house.groups[2].href, '');
  assert.equal(house.groups[2].sourceGroupIndex, 1);
  assert.equal(house.groups[4].navigationUnavailable, true);
});

test('Private Access remains informational and collects no sign-ups', () => {
  const access = menu.find(item => item.id === 'private-access');
  assert.equal(access.groups.length, 3);
  assert.ok(access.description.includes('deferred'));
  assert.ok(access.groups[0].description.includes('not collecting sign-ups'));
  assert.equal(access.groups[0].href, '');
  assert.equal(access.groups[0].navigationUnavailable, true);
  assert.equal(access.groups[1].href, '#contact');
  assert.equal(access.groups[2].href, '');
  assert.equal(access.groups[2].navigationUnavailable, true);
  assert.ok(access.groups.every(group => group.items.every(item => !item.record)));
});

test('building the navigation model does not mutate product or division data', () => {
  const beforeDivisions = structuredClone(collectionDivisions);
  const beforeProducts = structuredClone(products);
  createNavigationModel();
  assert.deepEqual(collectionDivisions, beforeDivisions);
  assert.deepEqual(products, beforeProducts);
});
