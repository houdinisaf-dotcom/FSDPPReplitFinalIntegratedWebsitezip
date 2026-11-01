import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { collectionDivisions } from '../src/collection-divisions.js';
import { categories, filterProducts, products } from '../src/catalogue-data.js';
import {
  createNavigationModel,
  getNavigationFeature,
  primaryNavigation,
  renderNavigationHeader,
} from '../src/site-navigation.js';

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

test('Investor Relations is linked and its complete funding data stays visible in page flow', () => {
  const header = renderNavigationHeader('<span>FSD</span>');
  const investorPage = readFileSync(new URL('../public/investor.html', import.meta.url), 'utf8');
  const funding = investorPage.match(/<article class="investor-card" id="funding"[^>]*>([\s\S]*?)<\/article>/)?.[1] ?? '';
  const financials = investorPage.match(/<article class="investor-card" id="financials"[^>]*>([\s\S]*?)<\/article>/)?.[1] ?? '';

  assert.match(header, /<a class="fsd-primary-link" data-nav-house id="house-trigger" href="\/the-house\.html">THE HOUSE<\/a>/);
  assert.match(header, /aria-label="Open The House menu"/);
  assert.match(header, /<a class="fsd-primary-link" data-nav-investor href="\/investor\.html">INVESTOR RELATIONS<\/a>/);
  assert.match(header, /<nav class="fsd-mobile-public-links" aria-label="Public pages">/);
  assert.match(header, /<a data-nav-house href="\/the-house\.html">THE HOUSE<\/a>/);
  assert.match(header, /<a data-nav-investor href="\/investor\.html">INVESTOR RELATIONS<\/a>/);
  assert.match(investorPage, /<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg">/);
  assert.match(investorPage, /FSD \/ PUBLIC INVESTOR INFORMATION &mdash; PRE-COMMERCIAL/);
  assert.match(investorPage, /href="\/#products">SHOP<\/a>/);
  assert.match(investorPage, /href="\/#universe">UNIVERSE<\/a>/);
  assert.match(investorPage, /href="\/#innovations">BIO-LAB™<\/a>/);
  assert.match(investorPage, /href="\/#hardware-editorial">HARDWARE<\/a>/);
  assert.match(investorPage, /<a id="house-trigger" href="\/the-house\.html">THE HOUSE<\/a>/);
  assert.match(investorPage, /href="\/#contact">PRIVATE ACCESS<\/a>/);
  assert.match(investorPage, /<a href="\/investor\.html" class="on" aria-current="page">INVESTOR RELATIONS<\/a>/);
  assert.match(funding, /Staged Capital Pathway/);
  assert.match(funding, /£25,000/);
  assert.match(funding, /£100,000 – £150,000/);
  assert.match(funding, /£175,000 – £225,000/);
  assert.match(financials, /Financial Projections/);
  assert.match(financials, /£30,524/);
  assert.match(financials, /£57,981/);
  assert.match(financials, /£88,806/);
  assert.equal((investorPage.match(/class="investor-card"/g) ?? []).length, 9);
  assert.doesNotMatch(investorPage, /href="(?:universe|biolab|hardware|private)\.html"/);
  assert.doesNotMatch(investorPage, /<(?:details|summary)\b|role=["']tab["']/i);
});

test('The House mega-menu links to the full public interactive House page', () => {
  const house = menu.find(section => section.id === 'house');
  const group = house?.groups.find(item => item.id === 'the-house-website');
  const pagePath = new URL('../public/the-house.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');
  const inlineScript = page.match(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script\s*>/i)?.[1] ?? '';

  assert.ok(group);
  assert.equal(group.items[0].title, 'THE HOUSE WEBSITE');
  assert.equal(group.items[0].href, '/the-house.html');
  assert.equal(group.items[0].kind, 'destination');
  assert.ok(existsSync(pagePath));
  assert.match(page, /<title>FSD \| The House<\/title>/);
  assert.match(page, /<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg">/);
  assert.match(page, /<nav aria-label="Main navigation">/);
  assert.match(page, /href="\/#products">SHOP<\/a>/);
  assert.match(page, /href="\/#universe">UNIVERSE<\/a>/);
  assert.match(page, /href="\/#innovations">BIO-LAB™<\/a>/);
  assert.match(page, /href="\/#hardware-editorial">HARDWARE<\/a>/);
  assert.match(page, /<a id="house-trigger" class="on" href="\/the-house\.html" aria-current="page">THE HOUSE<\/a>/);
  assert.match(page, /href="\/#contact">PRIVATE ACCESS<\/a>/);
  assert.match(page, /<a href="\/investor\.html">INVESTOR RELATIONS<\/a>/);
  assert.match(page, /--bk:#0B0C0E/);
  assert.match(page, /--gold:#C8AA72/);
  assert.match(page, /--vg:#C8AA72/);
  assert.match(inlineScript, /const P=/);
  assert.match(inlineScript, /,M=/);
  assert.match(inlineScript, /addEventListener\('hashchange',render\)/);
  assert.match(inlineScript, /Public Information/);
  assert.match(page, /<script src="\/innovation-initiative-data\.js"><\/script>/);
  assert.match(page, /<script src="\/innovation-initiative-router\.js"><\/script>/);
  assert.doesNotMatch(page, /A6FF00|C6A36A/);
  assert.doesNotMatch(page, /private preview|private draft/i);
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
  assert.equal(womens.length, 20);
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
    item.title === 'Adaptive Technical Fabrics'
      && item.href === '/the-house.html#bio-lab/adaptive-fabrics'));
  assert.ok(bioLab.groups[1].items.some(item =>
    item.title === 'Smart Apparel & NFC Authentication'
      && item.href === '/the-house.html#bio-lab/smart-apparel'));
  assert.deepEqual(hardware.groups.map(group => group.title), [
    ...collectionDivisions.find(division => division.id === 'hardware').groups.map(group => group.title),
  ]);
  assert.ok(hardware.groups[0].items.some(item => item.record?.name));
  assert.equal(hardware.groups.some(group => group.id === 'fsd-pods'), false);
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

test('House navigation maps the public initiative homes and rollout details', () => {
  const house = menu.find(item => item.id === 'house');
  assert.deepEqual(house.groups.map(group => group.title), [
    'BRAND STORY & ARCHIVE',
    'THE HOUSE WEBSITE',
    'FLAGSHIPS',
    'FIGHT PROMOTIONS',
    'COMMUNITY & CULTURE',
    'GLOBAL VISION & OPERATIONS',
    'INVESTOR RELATIONS',
  ]);
  assert.ok(house.groups.filter(group => group.href).every(group =>
    ['/story', '/the-house.html', '/the-house.html#community/co-creation', '/the-house.html#global/pods', '/investor.html'].includes(group.href)));
  const story = house.groups.find(group => group.id === 'our-story');
  const site = house.groups.find(group => group.id === 'the-house-website');
  const flagships = house.groups.find(group => group.id === 'flagships');
  const fightPromotions = house.groups.find(group => group.id === 'fight-promotions');
  const community = house.groups.find(group => group.id === 'community-culture');
  const globalOperations = house.groups.find(group => group.id === 'global-vision-operations');
  const investor = house.groups.find(group => group.id === 'investor-relations');
  assert.equal(story.items[0].status, 'EDITORIAL / BRAND PRINCIPLES');
  assert.equal(story.items[0].chapterCount, '04 FOUNDATIONAL CHAPTERS');
  assert.equal(story.items[0].houseCodeCount, '05 WORKING PRINCIPLES');
  assert.match(story.items[0].description, /Capability is not a costume/);
  assert.equal(site.items[0].href, '/the-house.html');
  assert.equal(site.navigationUnavailable, false);
  assert.ok(flagships.items.every(item => /no location or service is represented as operational/i.test(item.description)));
  assert.equal(flagships.href, '');
  assert.equal(flagships.sourceDivisionId, 'global');
  assert.equal(flagships.sourceGroupIndex, 0);
  assert.equal(fightPromotions.href, '');
  assert.equal(fightPromotions.sourceGroupIndex, 1);
  assert.deepEqual(community.items.map(item => item.title), [
    'Community Co-Creation',
    'Performance-Linked Partnerships',
    'Circular Trade-In Programme',
    'Community First Aid & Safety Skills',
  ]);
  assert.ok(community.items.every(item => item.href.startsWith('/the-house.html#community/')));
  assert.deepEqual(globalOperations.items.map(item => item.title), [
    'FSD Pods',
    'Autonomous Pop-Ups & Predictive Stock',
    'Mobile Testing Labs',
    'Local Micro-Manufacturing',
    'Genetic & Microbiome Personalisation',
  ]);
  assert.ok(globalOperations.items.every(item => item.href.startsWith('/the-house.html#global/')));
  assert.equal(investor.href, '/investor.html');
  assert.equal(investor.navigationUnavailable, false);
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
