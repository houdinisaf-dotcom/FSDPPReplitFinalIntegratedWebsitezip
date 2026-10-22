import test from 'node:test';
import assert from 'node:assert/strict';
import { collectionDivisions } from '../src/collection-divisions.js';
import { categories, filterProducts, products } from '../src/catalogue-data.js';
import { createNavigationModel, getNavigationFeature, primaryNavigation } from '../src/site-navigation.js';

const menu = createNavigationModel();

test('primary navigation makes Shop and the FSD Universe clear destinations', () => {
  assert.deepEqual(primaryNavigation.map(item => item.label), [
    'SHOP',
    'UNIVERSE',
    'BIO-LAB™',
    'HARDWARE',
    'THE HOUSE',
    'PRIVATE ACCESS',
  ]);
  assert.deepEqual(menu.map(item => item.id), [
    'collections',
    'universe',
    'bio-lab',
    'hardware',
    'house',
    'private-access',
  ]);
});

test('Shop exposes All Products and keeps the existing apparel groups and subcategories', () => {
  const collections = menu[0];
  assert.deepEqual(collections.groups.map(group => group.title), [
    'MEN’S LUXURY PERFORMANCE',
    'WOMEN’S MODEST COMBAT',
    'LIMITED COLLECTIONS',
    'NEW & FEATURED CONCEPTS',
    'ALL PRODUCTS',
  ]);

  const allProducts = collections.groups.find(group => group.id === 'shop-all-products');
  assert.equal(allProducts.href, '#products');
  assert.equal(allProducts.items[0].kind, 'shop-all');
  const men = collections.groups.find(group => group.id === 'mens-luxury-performance');
  assert.equal(men.items[1].title, '2-in-1 Combat Training Shorts & Tanks');
  assert.equal(men.items[1].kind, 'subcategory');
  assert.equal(men.items[1].sourceSubcategoryIndex, 1);
  assert.ok(men.items.some(item => item.title === 'Training Sets'));
  const limited = collections.groups.find(group => group.id === 'limited-collections');
  const featured = collections.groups.find(group => group.id === 'new-featured-concepts');
  assert.ok(limited.items.some(item => item.title === 'Volcanic Amber Capsule'));
  assert.ok(limited.items.some(item => item.title === 'Vector Camo Capsule'));
  assert.equal(limited.navigationUnavailable, true);
  assert.equal(featured.navigationUnavailable, true);
});

test('Shop collection filters contain current products and preserve audience scope', () => {
  const mens = filterProducts('All', '', 'All', 'mens-luxury-performance');
  const womens = filterProducts('All', '', 'All', 'womens-modest-combat');
  assert.ok(mens.length > 0);
  assert.ok(womens.length > 0);
  assert.ok(womens.every(product => product.audience === 'Women’s'));
});

test('Universe links to all four existing divisions without adding product records', () => {
  const universe = menu.find(item => item.id === 'universe');
  assert.deepEqual(universe.groups.map(group => group.sourceDivisionId), ['apparel', 'bio-lab', 'hardware', 'global']);
  assert.deepEqual(universe.groups.map(group => group.items[0].kind), Array(4).fill('universe-division'));
  assert.ok(universe.groups.every(group => group.navigationUnavailable === true));
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
  const mensIndex = menu[0].groups.findIndex(group => group.id === 'mens-luxury-performance');
  const conceptFeature = getNavigationFeature(menu[0], mensIndex, 1);
  assert.equal(conceptFeature.item, '2-in-1 Combat Training Shorts & Tanks');
  assert.deepEqual(conceptFeature.imageSources, []);

  const women = menu[0].groups.find(group => group.id === 'womens-modest-combat');
  const hijabIndex = women.items.findIndex(item => item.title === 'Performance Hijabs');
  const womenIndex = menu[0].groups.indexOf(women);
  const hijabFeature = getNavigationFeature(menu[0], womenIndex, hijabIndex);
  assert.ok(hijabFeature.imageSources.includes('/images/fsd-velocity-performance-sports-hijab.jpg'));
  for (const imagePath of hijabFeature.imageSources) {
    assert.ok(products.some(product => product.images?.some(image => image.src === imagePath)));
  }

  assert.ok(women.items.some(item => item.title === 'Performance Hijabs'));
  assert.ok(women.items.some(item => item.title === 'Sports Hijabs'));
});

test('Bio-Lab and Hardware reuse current division groups and product records', () => {
  const bioLab = menu.find(item => item.id === 'bio-lab');
  const hardware = menu.find(item => item.id === 'hardware');
  assert.deepEqual(bioLab.groups.map(group => group.title), ['WEARABLE TECHNOLOGY & CONCEPTS']);
  assert.ok(bioLab.groups[0].items.length > 0);
  assert.deepEqual(hardware.groups.map(group => group.title), collectionDivisions
    .find(division => division.id === 'hardware').groups.map(group => group.title));
  assert.ok(hardware.groups[0].items.some(item => item.record?.name));
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
  assert.match(rope.description, /Eight colour editions in the FSD performance training collection/i);
  assert.equal(rope.productId, undefined);
  assert.equal(products.some(product => product.name === rope.title), false);
  assert.deepEqual(getNavigationFeature(previewHardware, 0, ropeIndex).imageSources, [rope.featureImageSrc]);
});

test('the hooded-shell campaign proof is available only in the development preview menu', () => {
  const publicCollections = menu.find(section => section.id === 'collections');
  const publicMens = publicCollections.groups.find(group => group.id === 'mens-luxury-performance');
  assert.equal(publicMens.items.some(item => item.title === 'FSD Hooded Running Shell'), false);

  const previewMenu = createNavigationModel({ includeDraftPreviews: true });
  const previewCollections = previewMenu.find(section => section.id === 'collections');
  const previewMens = previewCollections.groups.find(group => group.id === 'mens-luxury-performance');
  const shellIndex = previewMens.items.findIndex(item => item.title === 'FSD Hooded Running Shell');
  const shell = previewMens.items[shellIndex];

  assert.ok(shell);
  assert.equal(shell.kind, 'draft-product');
  assert.equal(shell.previewOnly, true);
  assert.equal(shell.href, '/__catalogue-preview/hooded-running-shell/');
  assert.equal(shell.featureImageSrc, `${shell.href}media/hooded-shell-campaign`);
  assert.equal(shell.previewKicker, 'FSD / CAMPAIGN');
  assert.equal(shell.previewActionLabel, 'VIEW CAMPAIGN');
  assert.match(shell.description, /Campaign imagery for the FSD Hooded Running Shell/i);
  assert.equal(shell.record, undefined);
  assert.equal(shell.productId, undefined);
  assert.deepEqual(getNavigationFeature(previewCollections, previewCollections.groups.indexOf(previewMens), shellIndex).imageSources, [shell.featureImageSrc]);
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
