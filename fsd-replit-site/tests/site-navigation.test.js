import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
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

test('Shop foregrounds collection groups and removes the redundant All Products group', () => {
  const collections = menu[0];
  assert.deepEqual(collections.groups.map(group => group.title), [
    'MEN’S LUXURY PERFORMANCE',
    'WOMEN’S MODEST COMBAT',
    'LIMITED COLLECTIONS',
    'NEW & FEATURED',
  ]);

  assert.equal(collections.groups.some(group => group.id === 'shop-all-products'), false);
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
  assert.equal(womens.length, 18);
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

test('mega-menu image previews use only explicit single-image bindings', () => {
  const mensIndex = menu[0].groups.findIndex(group => group.id === 'mens-luxury-performance');
  const conceptFeature = getNavigationFeature(menu[0], mensIndex, 1);
  assert.equal(conceptFeature.item, '2-in-1 Combat Training Shorts & Tanks');
  assert.deepEqual(conceptFeature.imageSources, ['/fsd-assets/8ffe2fd45a06.webp']);

  const women = menu[0].groups.find(group => group.id === 'womens-modest-combat');
  const hijabIndex = women.items.findIndex(item => item.title === 'Performance Hijabs');
  const womenIndex = menu[0].groups.indexOf(women);
  const hijabFeature = getNavigationFeature(menu[0], womenIndex, hijabIndex);
  assert.deepEqual(hijabFeature.imageSources, ['/fsd-assets/8ffe2fd45a06.webp']);

  assert.ok(women.items.some(item => item.title === 'Performance Hijabs'));
  assert.ok(women.items.some(item => item.title === 'Sports Hijabs'));

  const bioLab = menu.find(section => section.id === 'bio-lab');
  const nexusGroup = bioLab.groups[0];
  const nexusIndex = nexusGroup.items.findIndex(item => item.record?.name === 'FSD NEXUS (smart ring)');
  assert.ok(nexusIndex >= 0);
  const nexusFeature = getNavigationFeature(bioLab, 0, nexusIndex);
  assert.deepEqual(nexusFeature.imageSources, ['/fsd-assets/3daa9883cec9.webp']);
  assert.equal(existsSync(new URL('../public/fsd-assets/3daa9883cec9.webp', import.meta.url)), true);

  for (const section of menu) {
    for (const [groupIndex, group] of section.groups.entries()) {
      for (const [itemIndex] of group.items.entries()) {
        const feature = getNavigationFeature(section, groupIndex, itemIndex);
        assert.ok(feature.imageSources.length <= 1, `${section.label} / ${group.title} / ${feature.item} must not show a multi-image fallback`);
        for (const imagePath of feature.imageSources) {
          assert.match(imagePath, /^\/fsd-assets\/[^/]+\.webp$/i);
        }
      }
    }
  }
});

test('Bio-Lab and Hardware reuse current division groups and product records', () => {
  const bioLab = menu.find(item => item.id === 'bio-lab');
  const hardware = menu.find(item => item.id === 'hardware');
  const combatEquipmentIndex = hardware.groups.findIndex(group => group.id === 'combat-equipment');
  assert.ok(combatEquipmentIndex >= 0);
  assert.deepEqual(
    getNavigationFeature(hardware, combatEquipmentIndex, 0).imageSources,
    ['/fsd-assets/8ffe2fd45a06.webp'],
  );
  assert.deepEqual(bioLab.groups.map(group => group.title), [
    'WEARABLE TECHNOLOGY',
    'INNOVATION HUB',
  ]);
  assert.ok(bioLab.groups[0].items.length > 0);
  assert.equal(bioLab.groups[1].items[0].title, 'Browse Innovation Hub');
  assert.equal(bioLab.groups[1].items[0].href, '#innovation-hub');
  assert.ok(bioLab.groups[1].items.some(item =>
    item.title === 'Smart Apparel & NFC' && item.href === '#smart-apparel-nfc'));
  assert.deepEqual(hardware.groups.map(group => group.title), [
    ...collectionDivisions.find(division => division.id === 'hardware').groups.map(group => group.title),
    'FSD PODS',
  ]);
  assert.ok(hardware.groups[0].items.some(item => item.record?.name));
  assert.equal(hardware.groups.at(-1).items[0].href, '#fsd-pods');
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
  assert.deepEqual(getNavigationFeature(previewHardware, 0, ropeIndex).imageSources, []);
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
  assert.deepEqual(getNavigationFeature(previewCollections, previewCollections.groups.indexOf(previewMens), shellIndex).imageSources, []);
});

test('House destinations expose the story route and do not claim proposed locations are live', () => {
  const house = menu.find(item => item.id === 'house');
  assert.deepEqual(house.groups.map(group => group.title), [
    'BRAND STORY & ARCHIVE',
    'FLAGSHIPS',
    'FIGHT PROMOTIONS',
    'PERFORMANCE-LINKED PARTNERSHIPS & SECURITY',
    'GLOBAL VISION',
    'INVESTOR RELATIONS',
  ]);
  assert.ok(house.groups.filter(group => group.href).every(group =>
    ['/story', '#fsd-division-global', '#performance-linked-partnerships-security'].includes(group.href)));
  assert.equal(house.groups[0].items[0].status, 'EDITORIAL / BRAND PRINCIPLES');
  assert.equal(house.groups[0].items[0].chapterCount, '04 FOUNDATIONAL CHAPTERS');
  assert.equal(house.groups[0].items[0].houseCodeCount, '05 WORKING PRINCIPLES');
  assert.match(house.groups[0].items[0].description, /Capability is not a costume/);
  assert.ok(house.groups[1].items.every(item => /no location or service is represented as operational/i.test(item.description)));
  assert.equal(house.groups[1].href, '');
  assert.equal(house.groups[1].sourceDivisionId, 'global');
  assert.equal(house.groups[1].sourceGroupIndex, 0);
  assert.equal(house.groups[2].href, '');
  assert.equal(house.groups[2].sourceGroupIndex, 1);
  assert.equal(house.groups[5].navigationUnavailable, true);
});

test('Private Access remains informational and collects no sign-ups', () => {
  const access = menu.find(item => item.id === 'private-access');
  assert.equal(access.groups.length, 4);
  assert.ok(access.description.includes('deferred'));
  assert.equal(access.groups[0].href, '#tactical-shield-membership');
  assert.equal(access.groups[0].navigationUnavailable, false);
  assert.ok(access.groups[0].description.includes('registration is not open'));
  assert.ok(access.groups[1].description.includes('not collecting sign-ups'));
  assert.equal(access.groups[1].href, '');
  assert.equal(access.groups[1].navigationUnavailable, true);
  assert.equal(access.groups[2].href, '#contact');
  assert.equal(access.groups[3].href, '');
  assert.equal(access.groups[3].navigationUnavailable, true);
  assert.ok(access.groups.every(group => group.items.every(item => !item.record)));
});

test('building the navigation model does not mutate product or division data', () => {
  const beforeDivisions = structuredClone(collectionDivisions);
  const beforeProducts = structuredClone(products);
  createNavigationModel();
  assert.deepEqual(collectionDivisions, beforeDivisions);
  assert.deepEqual(products, beforeProducts);
});
