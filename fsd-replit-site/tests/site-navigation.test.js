import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { collectionDivisions } from '../src/collection-divisions.js';
import { categories, filterProducts, products } from '../src/catalogue-data.js';
import {
  divisionLandingPaths,
  createNavigationModel,
  getNavigationFeature,
  navigationAssetBindings,
  primaryNavigation,
  renderNavigationHeader,
} from '../src/site-navigation.js';
import {
  legacyHouseRedirectDestination,
  renderHousePublicPage,
  renderLegacyHouseRedirect,
} from '../src/standalone-navigation-pages.js';
import { renderHouseDestinationIndex } from '../src/house-pages/house-destination-index.js';
import {
  HOUSE_FLAGSHIP_DRAFTS,
  HOUSE_PAGE_REGISTRY,
  isHouseDraftBuildFile,
  isHouseDraftRoute,
  shouldDisableHouseHref,
} from '../src/data/house-page-readiness.js';

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
  assert.deepEqual(Object.keys(divisionLandingPaths), [
    'collections',
    'universe',
    'bio-lab',
    'hardware',
    'house',
    'private-access',
  ]);
  assert.deepEqual(Object.values(divisionLandingPaths), [
    '/shop',
    '/universe',
    '/bio-lab',
    '/hardware',
    '/the-house.html',
    '/private-access',
  ]);
});

test('Investor Relations is a public business overview that keeps confidential terms private', () => {
  const header = renderNavigationHeader('<span>FSD</span>');
  const investorPage = renderHousePublicPage(HOUSE_PAGE_REGISTRY.find(page => page.id === 'investor-relations'));

  assert.equal(existsSync(new URL('../public/investor.html', import.meta.url)), false);
  assert.match(header, /<a class="fsd-primary-link" data-nav-destination="house" href="\/the-house\.html">THE HOUSE<\/a>/);
  assert.match(header, /FSD \/ THE HOUSE OF PERFORMANCE <span>·<\/span> INVESTOR RELATIONS/);
  assert.match(header, /<nav class="fsd-mobile-public-links" aria-label="Quick navigation">/);
  assert.equal((investorPage.match(/<main\b/g) || []).length, 1);
  assert.equal((investorPage.match(/<h1\b/g) || []).length, 1);
  assert.match(investorPage, /<div data-fsd-standalone-navigation><\/div>/);
  assert.match(investorPage, /enquiries\.html\?category=investor-corporate-relations/);
  assert.doesNotMatch(investorPage, /£\s?\d|valuation|pre-seed round of|Internal draft|CONTENT PENDING|not ready for publication/i);
});

test('each top-level division has a direct destination link and a separate menu control', () => {
  const header = renderNavigationHeader('<span>FSD</span>');
  const destinations = [...header.matchAll(/data-nav-destination="([^"]+)" href="([^"]+)"/g)]
    .map(([, id, href]) => [id, href]);

  assert.deepEqual(destinations, Object.entries(divisionLandingPaths));
  assert.equal((header.match(/class="fsd-primary-trigger fsd-primary-menu-toggle"/g) || []).length, 6);
  const source = readFileSync(new URL('../src/site-navigation.js', import.meta.url), 'utf8');
  assert.match(source, /class="fsd-mobile-primary-overview" href="\$\{escapeHTML\(divisionLandingPaths\[entry\.id\]\)\}"/);
});

test('Cryo-Zero has a separate information page without unconfirmed booking or service claims', () => {
  const pagePath = new URL('../public/cryo-zero.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');

  assert.ok(existsSync(pagePath));
  assert.match(page, /<title>FSD \| Cryo-Zero Recovery Chambers<\/title>/);
  assert.match(page, /<div data-fsd-standalone-navigation><\/div>/);
  assert.match(page, /<script type="module" src="\/src\/standalone-navigation\.js"><\/script>/);
  assert.match(page, /Coming to FSD/);
  assert.match(page, /Bookings are not open yet/);
  assert.match(page, /Published on approval/);
  // Specs and pricing stay unpublished until approved; no internal drafting language.
  assert.doesNotMatch(page, /£\s?\d|uploaded draft|supplied draft/i);
  assert.match(page, /Georgia, "Times New Roman", serif/);
  assert.doesNotMatch(page, /\[(?:YOUR-|PRICE|AREA|TOWN|CONFIRM|HOURS|@HANDLE)/i);
  assert.doesNotMatch(page, /<form\b|href="(?:tel:|https:\/\/wa\.me\/|#enquire)/i);
});

test('Red Light Recovery has a separate page with provisional claims clearly marked', () => {
  const pagePath = new URL('../public/red-light-recovery.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');

  assert.ok(existsSync(pagePath));
  assert.match(page, /<title>FSD \| Red Light Recovery Beds<\/title>/);
  assert.match(page, /<div data-fsd-standalone-navigation><\/div>/);
  assert.match(page, /<script type="module" src="\/src\/standalone-navigation\.js"><\/script>/);
  assert.match(page, /Information in preparation/);
  assert.match(page, /No bookings or enquiries are accepted through this page/);
  assert.match(page, /wavelengths, PEMF settings, safety procedures/);
  assert.match(page, /To be confirmed from supplier documentation/);
  assert.match(page, /Georgia, "Times New Roman", serif/);
  assert.doesNotMatch(page, /\[(?:YOUR-|PRICE|AREA|TOWN|CONFIRM|HOURS|@HANDLE)/i);
  assert.doesNotMatch(page, /<form\b|href="(?:tel:|https:\/\/wa\.me\/|#enquire)/i);
  assert.doesNotMatch(page, /633 nm|660 nm|670 nm|0\.5–50 Hz|£\[PRICE\]/i);
});

test('Fight Promotions exposes its verified page routes and keeps other concepts unavailable', () => {
  const fightPromotions = menu.find(item => item.id === 'house')
    ?.groups.find(group => group.id === 'fight-promotions');
  const pagePath = new URL('../public/fight-promotions.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');
  const firstItem = fightPromotions?.items[0];

  assert.ok(existsSync(pagePath));
  assert.equal(firstItem?.title, 'Professional Fight Promotions');
  assert.equal(firstItem?.kind, 'concept');
  assert.equal(firstItem?.href, '/fight-promotions.html');
  assert.equal(firstItem?.navigationUnavailable, false);
  assert.equal(fightPromotions.items.length, 5);
  assert.ok(fightPromotions.items.every(item => !item.navigationUnavailable));
  assert.match(page, /<title>FSD \| Professional Fight Promotions<\/title>/);
  assert.match(page, /<div data-fsd-standalone-navigation><\/div>/);
  assert.match(page, /FSD conceptualizes professional fight promotions/);
  assert.match(page, /Concept for exploration\. Not a current product or commitment\./);
  assert.match(page, /No FSD location, event, or service is represented as operational\./);
  assert.match(page, /The images are illustrative concept renderings and do not depict actual FSD events, venues, affiliated fighters, or partners\./);
  assert.equal((page.match(/class="visual-card /g) || []).length, 6);
  assert.match(page, /hero-arena\.webp/);
  for (const image of [
    'hero-arena.webp',
    'corner-support.webp',
    'crowd-atmosphere.webp',
    'weigh-in-stage.webp',
    'boxing-gloves.webp',
    'broadcast-desk.webp',
    'ring-walk.webp',
  ]) {
    assert.ok(existsSync(new URL(`../public/images/house/fight-promotions/${image}`, import.meta.url)), `Missing Fight Promotions image: ${image}`);
  }
  assert.doesNotMatch(page, /We collaborate with elite athletes|<form\b|BOOK NOW|BUY NOW/i);
});

test('Live Events is a public strategic initiative page with an accurate rollout status', () => {
  const fightPromotions = menu.find(item => item.id === 'house')
    ?.groups.find(group => group.id === 'fight-promotions');
  const liveEvents = fightPromotions?.items.find(item => item.title === 'Live Events');
  const pagePath = new URL('../public/live-events.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');

  assert.ok(existsSync(pagePath));
  assert.equal(liveEvents?.kind, 'initiative');
  assert.equal(liveEvents?.href, '/live-events.html');
  assert.equal(liveEvents?.navigationUnavailable, false);
  assert.match(page, /<title>FSD \| Live Events<\/title>/);
  assert.match(page, /Strategic initiative\. Rollout is not yet operational\./);
  assert.match(page, /No FSD location, event, or service is currently represented as live or available\./);
  assert.doesNotMatch(page, /Concept for exploration|not a current product|exploratory concept/i);
  assert.doesNotMatch(page, /<form\b|BOOK NOW|BUY NOW/i);
});

test('Broadcast & PPV is a public strategic initiative page, not a concept', () => {
  const fightPromotions = menu.find(item => item.id === 'house')
    ?.groups.find(group => group.id === 'fight-promotions');
  const broadcastPpv = fightPromotions?.items.find(item => item.title === 'Broadcast & PPV');
  const pagePath = new URL('../public/broadcast-ppv.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');

  assert.ok(existsSync(pagePath));
  assert.equal(broadcastPpv?.kind, 'initiative');
  assert.equal(broadcastPpv?.href, '/broadcast-ppv.html');
  assert.equal(broadcastPpv?.navigationUnavailable, false);
  assert.match(page, /<title>FSD \| Broadcast &amp; PPV<\/title>/);
  assert.match(page, /Strategic initiative\. Rollout is not yet operational\./);
  assert.match(page, /No FSD location, broadcast, PPV event, or service is currently represented as live or available\./);
  assert.doesNotMatch(page, /Concept for exploration|not a current product|exploratory concept/i);
  assert.doesNotMatch(page, /<form\b|BOOK NOW|BUY NOW/i);
});

test('Athlete Development is an operating initiative with no invented booking details', () => {
  const fightPromotions = menu.find(item => item.id === 'house')
    ?.groups.find(group => group.id === 'fight-promotions');
  const athleteDevelopment = fightPromotions?.items.find(item => item.title === 'Athlete Development');
  const pagePath = new URL('../public/athlete-development.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');

  assert.ok(existsSync(pagePath));
  assert.equal(athleteDevelopment?.kind, 'initiative');
  assert.equal(athleteDevelopment?.status, 'Operating');
  assert.equal(athleteDevelopment?.href, '/athlete-development.html');
  assert.equal(athleteDevelopment?.navigationUnavailable, false);
  assert.match(page, /<title>FSD \| Athlete Development<\/title>/);
  assert.match(page, /Status:<\/strong> Operating\./);
  assert.match(page, /nutritional guidance/);
  assert.match(page, /Cryo-Zero and Red Light therapy/);
  assert.doesNotMatch(page, /Concept for exploration|not a current product|exploratory concept/i);
  assert.doesNotMatch(page, /<form\b|BOOK NOW|BUY NOW|£\d/i);
});

test('Academy & Grassroots Programmes is an operating initiative page', () => {
  const fightPromotions = menu.find(item => item.id === 'house')
    ?.groups.find(group => group.id === 'fight-promotions');
  const academy = fightPromotions?.items.find(item => item.title === 'Academy & Grassroots Programmes');
  const pagePath = new URL('../public/academy-grassroots.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');

  assert.ok(existsSync(pagePath));
  assert.equal(academy?.kind, 'initiative');
  assert.equal(academy?.status, 'Operating');
  assert.equal(academy?.href, '/academy-grassroots.html');
  assert.equal(academy?.navigationUnavailable, false);
  assert.match(page, /<title>FSD \| Academy &amp; Grassroots Programmes<\/title>/);
  assert.match(page, /Status:<\/strong> Operating\./);
  assert.match(page, /community mentorship/);
  assert.match(page, /youth sports development/);
  assert.doesNotMatch(page, /Concept for exploration|not a current product|exploratory concept/i);
  assert.doesNotMatch(page, /<form\b|BOOK NOW|BUY NOW|£\d/i);
});

test('House destinations use independent routes and publish approved Founder Story and flagship pages', () => {
  const house = menu.find(section => section.id === 'house');
  const group = house?.groups.find(item => item.id === 'our-story');
  const flagships = house?.groups.find(item => item.id === 'flagships');
  const founderHtml = renderHousePublicPage(HOUSE_PAGE_REGISTRY.find(page => page.id === 'founder-story'));
  const flagshipHtml = renderHousePublicPage(HOUSE_PAGE_REGISTRY.find(page => page.id === 'dublin'));
  const storefront = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

  assert.ok(group);
  assert.deepEqual(group.items.map(item => item.title), ['Founder Story']);
  assert.equal(group.items[0].href, '/story');
  assert.equal(group.items[0].kind, 'destination');
  const flagshipItems = flagships.items.filter(item =>
    HOUSE_FLAGSHIP_DRAFTS.some(page => page.title === item.title));
  assert.deepEqual(flagshipItems.map(item => item.title), HOUSE_FLAGSHIP_DRAFTS.map(item => item.title));
  assert.deepEqual(flagshipItems.map(item => item.href), HOUSE_FLAGSHIP_DRAFTS.map(item => item.path));
  assert.ok(flagshipItems.every(item => /proposed fsd flagship concept/i.test(item.description)));
  assert.ok(flagshipItems.every(item => !item.navigationUnavailable));
  assert.ok(flagships.items.some(item => item.title === 'Autonomous Pop-Ups & Predictive Stock'));
  assert.ok(flagships.items.some(item => item.title === 'FSD Pods'));
  for (const html of [founderHtml, flagshipHtml]) {
    assert.equal((html.match(/<main\b/g) || []).length, 1);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.equal((html.match(/<footer\b/g) || []).length, 1);
    assert.doesNotMatch(html, /Internal draft|CONTENT PENDING|not ready for publication|£\s?\d/i);
  }
  assert.doesNotMatch(founderHtml, /lifelong athlete|countless hours in the gym/i);
  assert.match(founderHtml, /href="\/investor\.html"/);
  assert.match(flagshipHtml, /Dublin/);
  assert.match(flagshipHtml, /enquiries\.html\?category=flagship-property-opportunities/);
  assert.match(flagshipHtml, /href="\/flagships\/manchester\.html"/);
  const houseArchiveStart = storefront.indexOf('id="fsd-house-archive"');
  const houseArchiveEnd = storefront.indexOf('</details>', houseArchiveStart);
  const houseArchive = storefront.slice(houseArchiveStart, houseArchiveEnd);
  assert.match(houseArchive, /\$\{renderHouseDestinationIndex\(\)\}/);
  assert.doesNotMatch(houseArchive, /ourStorySection|renderInnovationHubIndex|renderBioLabPlaceholderPages|renderFlagshipPlaceholderPages/);
  assert.ok(storefront.indexOf('id="bio-lab-archive"') > houseArchiveEnd);
  assert.doesNotMatch(storefront, /function renderHousePreviewPages|window\.configureFSDInnovationRoutes/);
});

test('House publication policy keeps approved House pages linked in production', () => {
  assert.equal(HOUSE_PAGE_REGISTRY.length, 22);
  assert.equal(shouldDisableHouseHref('/story', true), false);
  assert.equal(shouldDisableHouseHref('/flagships/dublin.html', true), false);
  assert.equal(shouldDisableHouseHref('/investor.html', true), false);
  assert.equal(shouldDisableHouseHref('/security-vision.html', true), false);
  assert.equal(shouldDisableHouseHref('/story'), false);
  assert.equal(isHouseDraftBuildFile('the-house.html'), false);
  assert.equal(isHouseDraftRoute('/the-house.html'), false);
  assert.equal(HOUSE_PAGE_REGISTRY.find(page => page.id === 'genetic-microbiome')?.division,
    'BIO-LAB™ / Personalisation Research');
  assert.equal(isHouseDraftBuildFile('investor.html'), false);
  assert.equal(isHouseDraftBuildFile('story/index.html'), false);
  assert.equal(isHouseDraftBuildFile('flagships/dublin.html'), false);
  assert.equal(isHouseDraftBuildFile('security-vision.html'), false);
});

test('the legacy House URL redirects to the corporate hub and preserves the separate Story route', () => {
  const redirect = renderLegacyHouseRedirect();
  const publicRedirect = readFileSync(new URL('../public/the-house.html', import.meta.url), 'utf8');
  assert.equal(legacyHouseRedirectDestination(), '/#fsd-house-archive');
  assert.equal(legacyHouseRedirectDestination('#brand/founder'), '/story');
  assert.equal(legacyHouseRedirectDestination('#fsd-house-archive'), '/#fsd-house-archive');
  assert.equal(legacyHouseRedirectDestination('#bad%ZZ'), '/story');
  assert.match(redirect, /location\.replace\(destination\)/);
  assert.match(redirect, /\/#fsd-house-archive/);
  assert.match(redirect, /href="\/#fsd-house-archive">Open THE HOUSE/);
  assert.equal(publicRedirect.trim(), redirect);
});

test('the homepage House archive links to destinations instead of rendering sibling page bodies', () => {
  const developmentIndex = renderHouseDestinationIndex({ production: false });
  const productionIndex = renderHouseDestinationIndex({ production: true });
  const developmentHrefs = [...developmentIndex.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  const productionHrefs = [...productionIndex.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  const housePages = HOUSE_PAGE_REGISTRY.filter(page => page.division !== 'BIO-LAB™ / Personalisation Research');
  const notReadyPages = housePages.filter(page => page.readiness === 'NOT_READY');
  const publicPages = housePages.filter(page => page.readiness === 'PUBLIC');

  assert.deepEqual(developmentHrefs, housePages.map(page => page.path));
  assert.deepEqual(productionHrefs, publicPages.map(page => page.path));
  assert.equal((productionIndex.match(/class="house-destination-index__link is-disabled"/g) || []).length, notReadyPages.length);
  assert.doesNotMatch(developmentIndex, /\/the-house\.html#/);
  assert.doesNotMatch(developmentIndex, /<main\b|<header\b|class="hero"/);
  assert.match(developmentIndex, /id="house-division-1"/);
});

test('Shop foregrounds collection groups and removes the redundant All Products group', () => {
  const collections = menu[0];
  assert.deepEqual(collections.groups.map(group => group.title), [
    'MEN’S LUXURY PERFORMANCE',
    'WOMEN’S MODEST COMBAT',
    'WOMEN’S COLLECTIONS',
    'MEN’S COLLECTIONS',
    'LIMITED COLLECTIONS',
    'NEW & FEATURED',
    'ALL COLLECTIONS',
    'ACCESSORIES & TECHNICAL',
    'CIRCULARITY',
    'TECHNICAL INNOVATION',
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

test('SHOP Clothing Lines adds seven explicit destinations and a browse-all action without changing source groups', () => {
  const collections = menu.find(section => section.id === 'collections');
  const apparel = collectionDivisions.find(division => division.id === 'apparel');
  const womenGroup = collections.groups.find(group => group.id === 'womens-collections');
  const menGroup = collections.groups.find(group => group.id === 'mens-collections');
  const allGroup = collections.groups.find(group => group.id === 'clothing-lines');
  const expectedLines = [
    ['aeroforge', 'AEROFORGE'],
    ['combat', 'COMBAT'],
    ['flex', 'FLEX'],
    ['breeze', 'BREEZE'],
    ['modest-flow', 'MODEST FLOW'],
    ['tiger-series', 'FSD TIGER SERIES'],
    ['scorpion-series', 'FSD SCORPION SERIES'],
  ];

  assert.ok(womenGroup);
  assert.ok(menGroup);
  assert.ok(allGroup);
  assert.equal(womenGroup.href, '#clothing-lines');
  assert.equal(menGroup.href, '#clothing-lines');
  assert.deepEqual(womenGroup.items.map(item => [
    item.id.replace('clothing-line-', ''),
    item.title,
    item.kind,
    item.href,
  ]), expectedLines.slice(0, 5).map(([id, title]) => [
    id,
    title,
    'clothing-line',
    `/collections/${id}`,
  ]));
  assert.deepEqual(menGroup.items.map(item => [
    item.id.replace('clothing-line-', ''),
    item.title,
    item.kind,
    item.href,
  ]), expectedLines.slice(5).map(([id, title]) => [
    id,
    title,
    'clothing-line',
    `/collections/${id}`,
  ]));
  assert.deepEqual(
    [allGroup.title, allGroup.items[0].kind, allGroup.items[0].href],
    ['ALL COLLECTIONS', 'clothing-lines', '#clothing-lines'],
  );

  const legacyGroups = [
    collections.groups[0],
    collections.groups[1],
    collections.groups.find(group => group.id === 'limited-collections'),
    collections.groups.find(group => group.id === 'new-featured-concepts'),
  ];
  assert.deepEqual(legacyGroups.map(group => group.id), [
    'mens-luxury-performance',
    'womens-modest-combat',
    'limited-collections',
    'new-featured-concepts',
  ]);
  assert.equal(legacyGroups[0].source, apparel.groups[0]);
  assert.equal(legacyGroups[1].source, apparel.groups[1]);
  assert.equal(legacyGroups[2].source, apparel.groups[0]);
  assert.equal(legacyGroups[3].source, apparel.groups[0]);

  const womensSource = apparel.groups[1];
  const womensGroup = legacyGroups[1];
  const modestFlowSource = womensSource.subcategories.find(item =>
    item.title === 'FSD Modest Flow Training Trousers');
  const modestFlowMenuItem = womensGroup.items.find(item =>
    item.title === 'FSD Modest Flow Training Trousers');
  assert.equal(modestFlowMenuItem.kind, 'subcategory');
  assert.equal(modestFlowMenuItem.source, modestFlowSource);
  assert.equal(modestFlowMenuItem.sourceSubcategoryIndex, womensSource.subcategories.indexOf(modestFlowSource));

  const mainSource = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.doesNotMatch(mainSource, /lineDestinations|item\?\.kind === ['"]subcategory['"]/);
  assert.match(mainSource, /\['clothing-line', 'clothing-lines', 'catalogue-collection'\]\.includes\(item\?\.kind\)/);
  assert.match(mainSource, /dispatchEvent\(new HashChangeEvent\(['"]hashchange['"]\)\)/);
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
  assert.deepEqual(universe.groups.slice(0, 4).map(group => group.sourceDivisionId), ['apparel', 'bio-lab', 'hardware', 'global']);
  assert.deepEqual(universe.groups.slice(0, 4).map(group => group.items[0].kind), Array(4).fill('universe-division'));
  assert.ok(universe.groups.slice(0, 4).every(group => group.navigationUnavailable === true));
  assert.ok(universe.groups.some(group => group.id === 'universe-community-development' && group.href === '#fsd-strategic-concepts'));
  assert.ok(universe.groups.some(group => group.id === 'universe-strategic-concepts' && group.href === '#fsd-strategic-concepts'));
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
  assert.deepEqual(conceptFeature.imageSources, []);

  const women = menu[0].groups.find(group => group.id === 'womens-modest-combat');
  const hijabIndex = women.items.findIndex(item => item.title === 'Performance Hijabs');
  const womenIndex = menu[0].groups.indexOf(women);
  const hijabFeature = getNavigationFeature(menu[0], womenIndex, hijabIndex);
  assert.deepEqual(hijabFeature.imageSources, ['/fsd-assets/4acbbfb65f79.webp']);

  assert.ok(women.items.some(item => item.title === 'Performance Hijabs'));
  assert.ok(women.items.some(item => item.title === 'Sports Hijabs'));
  const sportsHijabsIndex = women.items.findIndex(item => item.title === 'Sports Hijabs');
  assert.deepEqual(
    getNavigationFeature(menu[0], womenIndex, sportsHijabsIndex).imageSources,
    ['/fsd-assets/4acbbfb65f79.webp'],
  );
  for (const unmatchedTitle of [
    'Women’s MMA Rash Guard',
    'Performance Training Tops',
    'Performance Leggings & Strikeflex Trousers',
    'FSD Modest Flow Training Trousers',
  ]) {
    const itemIndex = women.items.findIndex(item => item.title === unmatchedTitle);
    assert.ok(itemIndex >= 0, `${unmatchedTitle} remains in the menu`);
    assert.deepEqual(
      getNavigationFeature(menu[0], womenIndex, itemIndex).imageSources,
      [],
      `${unmatchedTitle} stays image-free without an exact source`,
    );
  }

  const womensCollections = menu[0].groups.find(group => group.id === 'womens-collections');
  const womensCollectionsIndex = menu[0].groups.indexOf(womensCollections);
  const breezeLineIndex = womensCollections.items.findIndex(item => item.title === 'BREEZE');
  assert.deepEqual(
    getNavigationFeature(menu[0], womensCollectionsIndex, breezeLineIndex).imageSources,
    ['/fsd-assets/breeze-set-onyx-black-full-length.webp'],
  );
  const combatLineIndex = womensCollections.items.findIndex(item => item.title === 'COMBAT');
  assert.deepEqual(
    getNavigationFeature(menu[0], womensCollectionsIndex, combatLineIndex).imageSources,
    ['/fsd-assets/8ffe2fd45a06.webp'],
  );
  const breezeSetIndex = women.items.findIndex(item => item.title === 'FSD Breeze Set');
  assert.deepEqual(
    getNavigationFeature(menu[0], womenIndex, breezeSetIndex).imageSources,
    ['/fsd-assets/breeze-set-onyx-black-full-length.webp'],
  );

  const bioLab = menu.find(section => section.id === 'bio-lab');
  const nexusGroup = bioLab.groups[0];
  const nexusIndex = nexusGroup.items.findIndex(item => item.record?.name === 'FSD NEXUS (smart ring)');
  assert.ok(nexusIndex >= 0);
  const nexusFeature = getNavigationFeature(bioLab, 0, nexusIndex);
  assert.deepEqual(nexusFeature.imageSources, ['/fsd-assets/3daa9883cec9.webp']);
  assert.equal(existsSync(new URL('../public/fsd-assets/3daa9883cec9.webp', import.meta.url)), true);

  const catalogueImagePath = /^\/(?:assets\/products|products)\/[a-z0-9/_-]+\.(?:webp|png|jpe?g)$/i;
  for (const [item, binding] of Object.entries(navigationAssetBindings)) {
    const assetLibraryImage = /^\/fsd-assets\/[^/]+\.webp$/i.test(binding.src);
    assert.ok(assetLibraryImage || catalogueImagePath.test(binding.src), `${item} uses an approved public image path`);
    assert.equal(existsSync(new URL(`../public${binding.src}`, import.meta.url)), true, `${item} source exists`);
    if (!assetLibraryImage) {
      const record = products.find(product => product.name === (binding.sourceProductName || item));
      assert.ok(record?.images?.some(image => image.src === binding.src), `${item} image is mapped in its exact product record`);
      assert.equal(binding.presentation, 'product', `${item} is rendered in the product-image stage`);
    }
  }

  for (const section of menu) {
    for (const [groupIndex, group] of section.groups.entries()) {
      for (const [itemIndex] of group.items.entries()) {
        const feature = getNavigationFeature(section, groupIndex, itemIndex);
        assert.ok(feature.imageSources.length <= 1, `${section.label} / ${group.title} / ${feature.item} must not show a multi-image fallback`);
        for (const imagePath of feature.imageSources) {
          assert.ok(
            /^\/fsd-assets\/[^/]+\.webp$/i.test(imagePath) || catalogueImagePath.test(imagePath),
            `${section.label} / ${group.title} / ${feature.item} must use a mapped public image`,
          );
          assert.equal(existsSync(new URL(`../public${imagePath}`, import.meta.url)), true);
          if (catalogueImagePath.test(imagePath)) {
            assert.ok(products.some(product => product.images?.some(image => image.src === imagePath)),
              `${imagePath} must remain an explicit catalogue image mapping`);
          }
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
    [],
  );
  assert.deepEqual(bioLab.groups.map(group => group.title), [
    'WEARABLE TECHNOLOGY',
    'INNOVATION HUB',
    'MATERIALS, RESEARCH & CONNECTED PERFORMANCE',
  ]);
  assert.equal(bioLab.groups[2].href, '#innovation-hub');
  assert.ok(bioLab.groups[0].items.length > 0);
  assert.equal(bioLab.groups[1].items[0].title, 'Browse Innovation Hub');
  assert.equal(bioLab.groups[1].href, '#innovation-hub');
  assert.equal(bioLab.groups[1].items[0].href, '#innovation-hub');
  assert.ok(bioLab.groups[1].items.some(item =>
    item.title === 'Adaptive Technical Fabrics'
      && item.href === '#adaptive-technical-fabrics'));
  assert.ok(bioLab.groups[1].items.some(item =>
    item.title === 'Smart Apparel & NFC Authentication'
      && item.href === '#smart-apparel-nfc'));
  assert.ok(bioLab.groups[2].items.some(item => item.title === 'Genetic & Microbiome Personalisation'));
  assert.ok(bioLab.groups[2].items.some(item => item.title === 'Mobile Testing Labs'));
  assert.deepEqual(hardware.groups.map(group => group.title), [
    ...collectionDivisions.find(division => division.id === 'hardware').groups.map(group => group.title),
  ]);
  assert.ok(hardware.groups[0].items.some(item => item.record?.name));
  assert.equal(hardware.groups.some(group => group.id === 'fsd-pods'), false);
  const recoveryGroup = hardware.groups.find(group => group.id === 'recovery-technology');
  assert.ok(recoveryGroup);
  assert.ok(recoveryGroup.items.some(item => item.title === 'Cryo-Zero Recovery Chambers'));
  assert.ok(recoveryGroup.items.some(item => item.title === 'Red Light Recovery Beds'));
  assert.equal(recoveryGroup.items.some(item => item.title === '7mm Knee Sleeves'), false);
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
    'OUR STORY',
    'FLAGSHIPS',
    'FIGHT PROMOTIONS',
    'GLOBAL VISION & OPERATIONS',
    'INVESTOR RELATIONS',
    'COMMUNITY & CULTURE',
  ]);
  assert.ok(house.groups.filter(group => group.href).every(group =>
    ['/story', '/community-co-creation.html', '/fsd-pods.html', '/investor.html'].includes(group.href)));
  const story = house.groups.find(group => group.id === 'our-story');
  const flagships = house.groups.find(group => group.id === 'flagships');
  const fightPromotions = house.groups.find(group => group.id === 'fight-promotions');
  const community = house.groups.find(group => group.id === 'community-culture');
  const globalOperations = house.groups.find(group => group.id === 'global-vision-operations');
  const investor = house.groups.find(group => group.id === 'investor-relations');
  assert.equal(story.href, '/story');
  assert.deepEqual(story.items.map(item => item.title), [
    'Founder Story',
  ]);
  assert.equal(story.items[0].description, 'Fitness. Discipline. Progress.');
  assert.equal(story.description, 'Founder Story.');
  assert.ok(story.items.every(item => item.href === '/story'));
  assert.ok(flagships.items.filter(item => HOUSE_FLAGSHIP_DRAFTS.some(draft => draft.title === item.title))
    .every(item => /proposed fsd flagship concept/i.test(item.description)));
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
    'Civic Response Auxiliary',
    'Tactical Shield Membership',
  ]);
  assert.equal(community.items[0].href, '/community-co-creation.html');
  assert.equal(community.items[0].kind, 'initiative');
  assert.equal(community.items[0].status, 'Strategic concept');
  assert.equal(community.items[1].href, '/performance-partnerships.html');
  assert.equal(community.items[1].kind, 'initiative');
  assert.equal(community.items[1].status, 'Strategic concept');
  assert.equal(community.items[2].href, '/circular-trade-in.html');
  assert.equal(community.items[2].kind, 'initiative');
  assert.equal(community.items[2].status, 'Strategic concept');
  assert.equal(community.items[3].href, '/community-first-aid.html');
  assert.equal(community.items[3].kind, 'initiative');
  assert.equal(community.items[3].status, 'Operating or rollout underway');
  assert.equal(community.items[4].href, '#civic-response-auxiliary');
  assert.equal(community.items[4].status, 'Strategic concept');
  assert.equal(community.items[5].href, '#tactical-shield-membership');
  assert.equal(community.items[5].status, 'Strategic concept');
  assert.ok(community.items.slice(0, 4).every(item => item.href.endsWith('.html')));
  assert.deepEqual(globalOperations.items.map(item => item.title), [
    'FSD Pods',
    'Autonomous Pop-Ups & Predictive Stock',
    'Mobile Testing Labs',
    'Local Micro-Manufacturing Workshop',
    'Performance-Linked Partnerships',
    'Security Provisions',
  ]);
  assert.equal(globalOperations.items[0].href, '/fsd-pods.html');
  assert.equal(globalOperations.items[0].kind, 'initiative');
  assert.equal(globalOperations.items[0].status, 'Strategic concept');
  assert.equal(globalOperations.items[1].href, '/autonomous-popups.html');
  assert.equal(globalOperations.items[1].kind, 'initiative');
  assert.equal(globalOperations.items[1].status, 'Strategic concept');
  assert.equal(globalOperations.items[2].href, '/mobile-testing-labs.html');
  assert.equal(globalOperations.items[2].kind, 'initiative');
  assert.equal(globalOperations.items[2].status, 'Strategic concept');
  assert.equal(globalOperations.items[3].href, '/local-micro-manufacturing.html');
  assert.equal(globalOperations.items[3].kind, 'initiative');
  assert.equal(globalOperations.items[3].status, 'Strategic concept');
  assert.equal(globalOperations.items[4].href, '/performance-partnerships.html');
  assert.equal(globalOperations.items[4].status, 'Strategic concept');
  assert.equal(globalOperations.items[5].href, '/security-vision.html');
  assert.equal(globalOperations.items[5].kind, 'initiative');
  assert.equal(globalOperations.items[5].status, 'Strategic expansion; not operational');
  assert.ok(globalOperations.items.every(item => item.href.endsWith('.html')));
  assert.equal(investor.href, '/investor.html');
  assert.equal(investor.navigationUnavailable, false);
});

test('FSD Pods is a public initiative page without claiming a live pod or location', () => {
  const house = menu.find(item => item.id === 'house');
  const globalOperations = house?.groups.find(group => group.id === 'global-vision-operations');
  const pods = globalOperations?.items.find(item => item.title === 'FSD Pods');
  const pagePath = new URL('../public/fsd-pods.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');

  assert.ok(existsSync(pagePath));
  assert.equal(pods?.kind, 'initiative');
  assert.equal(pods?.href, '/fsd-pods.html');
  assert.equal(pods?.status, 'Strategic concept');
  assert.notEqual(pods?.navigationUnavailable, true);
  assert.match(page, /<title>FSD \| FSD Pods<\/title>/);
  assert.match(page, /Status:<\/strong> Proposed strategic concept\./);
  assert.match(page, /No FSD Pod, location, or service is currently represented as operational\./);
  assert.match(page, /proposed modular concept for fitness, retail, education, and community spaces/);
  assert.doesNotMatch(page, /Concept for exploration|not a current product|exploratory concept/i);
});

test('Autonomous Pop-Ups & Predictive Stock is an initiative without claiming live venues or systems', () => {
  const house = menu.find(item => item.id === 'house');
  const globalOperations = house?.groups.find(group => group.id === 'global-vision-operations');
  const retail = globalOperations?.items.find(item => item.title === 'Autonomous Pop-Ups & Predictive Stock');
  const pagePath = new URL('../public/autonomous-popups.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');

  assert.ok(existsSync(pagePath));
  assert.equal(retail?.kind, 'initiative');
  assert.equal(retail?.href, '/autonomous-popups.html');
  assert.equal(retail?.status, 'Strategic concept');
  assert.notEqual(retail?.navigationUnavailable, true);
  assert.match(page, /<title>FSD \| Autonomous Pop-Ups &amp; Predictive Stock<\/title>/);
  assert.match(page, /Status:<\/strong> Strategic concept; no retail location or service is live\./);
  assert.match(page, /No location, partner, event schedule, or opening date is confirmed/);
  assert.match(page, /No live forecasting model or automated stock system is available/);
  assert.match(page, /not unstaffed or cashier-less retail/);
  assert.match(page, /click-and-collect, and location-based availability require future system development/);
  assert.doesNotMatch(page, /class="visual-placeholder"|Illustrative (?:dashboard|mobile interface) placeholder/);
  assert.match(retail?.description || '', /not unstaffed or cashier-less retail/);
  assert.doesNotMatch(page, /\[cite:\s*\d+\]|Concept for exploration|Design Prototype|exploratory concept/i);
});

test('Mobile Testing Labs is an initiative with consent safeguards and no live-testing claim', () => {
  const house = menu.find(item => item.id === 'house');
  const globalOperations = house?.groups.find(group => group.id === 'global-vision-operations');
  const testingLabs = globalOperations?.items.find(item => item.title === 'Mobile Testing Labs');
  const pagePath = new URL('../public/mobile-testing-labs.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');

  assert.ok(existsSync(pagePath));
  assert.equal(testingLabs?.kind, 'initiative');
  assert.equal(testingLabs?.href, '/mobile-testing-labs.html');
  assert.equal(testingLabs?.status, 'Strategic concept');
  assert.notEqual(testingLabs?.navigationUnavailable, true);
  assert.match(page, /<title>FSD \| Mobile Testing Labs<\/title>/);
  assert.match(page, /Status:<\/strong> Strategic concept; no testing unit or service is live\./);
  assert.match(page, /anonymised performance and fit insights with participant consent/);
  assert.match(page, /No mobile testing unit, venue, test, or data-collection activity is currently represented as operational/);
  assert.match(page, /No biometric sensor tracking or biometric data collection is in confirmed scope/);
  assert.doesNotMatch(page, /class="visual-placeholder"|Illustrative (?:mobile unit|participant feedback interface) placeholder/);
  assert.match(testingLabs?.description || '', /biometric sensor tracking is not in confirmed scope/);
  assert.doesNotMatch(page, /\[cite:\s*\d+\]|Concept for exploration|Design Prototype|exploratory concept/i);
});

test('Local Micro-Manufacturing is an initiative without claiming live production', () => {
  const house = menu.find(item => item.id === 'house');
  const globalOperations = house?.groups.find(group => group.id === 'global-vision-operations');
  const manufacturing = globalOperations?.items.find(item => item.title === 'Local Micro-Manufacturing Workshop');
  const pagePath = new URL('../public/local-micro-manufacturing.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');

  assert.ok(existsSync(pagePath));
  assert.equal(manufacturing?.kind, 'initiative');
  assert.equal(manufacturing?.href, '/local-micro-manufacturing.html');
  assert.equal(manufacturing?.status, 'Strategic concept');
  assert.notEqual(manufacturing?.navigationUnavailable, true);
  assert.match(page, /<title>FSD \| Local Micro-Manufacturing<\/title>/);
  assert.match(page, /Status:<\/strong> Strategic concept; no production site or service is live\./);
  assert.match(page, /Potential aims to assess include shorter lead times, lower transport emissions, reduced material waste, and selected customisation; none are measured or promised/);
  assert.match(page, /No local manufacturing hub, production site, or service is currently represented as operational/);
  assert.match(page, /No manufacturing partner or custom-order service is confirmed/);
  assert.match(page, /No delivery-time, material-waste, or emissions reduction is measured or promised/);
  assert.match(manufacturing?.description || '', /environmental benefits are not verified/);
  assert.doesNotMatch(page, /\[cite:\s*\d+\]|Concept for exploration|Design Prototype|exploratory concept/i);
});

test('Genetic & Microbiome Personalisation is a research initiative, not a health service', () => {
  const bioLab = menu.find(item => item.id === 'bio-lab');
  const research = bioLab?.groups.flatMap(group => group.items)
    .find(item => item.title === 'Genetic & Microbiome Personalisation');
  const globalOperations = menu.find(item => item.id === 'house')
    ?.groups.find(group => group.id === 'global-vision-operations');
  const conceptRecord = HOUSE_PAGE_REGISTRY.find(page => page.id === 'genetic-microbiome');
  const pagePath = new URL('../public/genetic-microbiome.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');

  assert.ok(existsSync(pagePath));
  assert.ok(research);
  assert.equal(research?.kind, 'initiative');
  assert.equal(research?.href, '/genetic-microbiome.html');
  assert.equal(research?.status, 'Strategic concept');
  assert.notEqual(research?.navigationUnavailable, true);
  assert.equal(globalOperations?.items.some(item => item.title === 'Genetic & Microbiome Personalisation'), false);
  assert.equal(conceptRecord?.division, 'BIO-LAB™ / Personalisation Research');
  assert.equal(conceptRecord?.readiness, 'PUBLIC');
  assert.match(page, /<title>FSD \| Genetic &amp; Microbiome Personalisation<\/title>/);
  assert.match(page, /data-fsd-division="BIO-LAB™" data-fsd-section="Personalisation Research"/);
  assert.match(page, /aria-label="Breadcrumb"/);
  assert.match(page, /class="hero-asset-slot" role="img" aria-label="Asset pending:/i);
  assert.match(page, /RESEARCH CONCEPT \/ NOT ACTIVE/);
  const visualSlot = page.match(/<div class="hero-asset-slot"[\s\S]*?<\/div>\s*<\/header>/)?.[0];
  assert.ok(visualSlot);
  assert.doesNotMatch(visualSlot, /<img\b/);
  assert.match(page, /BIO-LAB™ Innovation Hub/);
  assert.match(page, /Twelve strategic concepts/);
  assert.match(page, /FSD \/ BIO-LAB™ \/ Personalisation Research/);
  assert.match(page, /Status:<\/strong> Strategic research concept; no service is available\./);
  assert.match(page, /strict privacy protections and appropriate clinical oversight/);
  assert.match(page, /No genetic or microbiome testing, data analysis, or personalised health guidance is represented as currently available/);
  assert.match(page, /No sample collection is operating/);
  assert.match(page, /No clinical partnership is identified on this page/);
  assert.match(page, /No claim is made that DNA predicts injury or optimises training/);
  assert.match(research?.description || '', /No testing, sample collection, data analysis or personalised health guidance is available/);
  assert.doesNotMatch(page, /\[cite:\s*\d+\]|Concept for exploration|Design Prototype|clinical advice is available/i);
});

test('Security Provisions is public strategy content, not an active tender', () => {
  const house = menu.find(item => item.id === 'house');
  const globalOperations = house?.groups.find(group => group.id === 'global-vision-operations');
  const security = globalOperations?.items.find(item => item.title === 'Security Provisions');
  const pagePath = new URL('../public/security-vision.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');

  assert.ok(existsSync(pagePath));
  assert.equal(security?.kind, 'initiative');
  assert.equal(security?.href, '/security-vision.html');
  assert.equal(security?.status, 'Strategic expansion; not operational');
  assert.notEqual(security?.navigationUnavailable, true);
  assert.match(page, /<title>FSD \| Global Vision &amp; Security Provisions<\/title>/);
  assert.match(page, /SIA Licensing &amp; UK Legislation/);
  assert.match(page, /British Standard \(BS 7858\)/);
  assert.match(page, /Deployment and commercial contracting are subject to corporate structuring/);
  assert.match(page, /Not an active operational tender/);
  assert.doesNotMatch(page, /<nav class="main-nav"|id="house-mega-menu"|<form\b/i);
});

test('Community Co-Creation is a proposed concept without an open submission flow', () => {
  const house = menu.find(item => item.id === 'house');
  const community = house?.groups.find(group => group.id === 'community-culture');
  const coCreation = community?.items.find(item => item.title === 'Community Co-Creation');
  const pagePath = new URL('../public/community-co-creation.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');

  assert.ok(existsSync(pagePath));
  assert.equal(coCreation?.kind, 'initiative');
  assert.equal(coCreation?.href, '/community-co-creation.html');
  assert.equal(coCreation?.status, 'Strategic concept');
  assert.notEqual(coCreation?.navigationUnavailable, true);
  assert.match(coCreation?.description || '', /No workshops, trials, forums, portal, or submissions are open/);
  assert.match(page, /<title>FSD \| Community Co-Creation<\/title>/);
  assert.match(page, /Status:<\/strong> Strategic concept; no participation is open\./);
  assert.match(page, /Structured feedback, workshops, and collaborative testing are potential formats only/);
  assert.match(page, /does not offer workshop registration, product trials, or feedback submissions/);
  assert.match(page, /No workshop, testing panel, forum, feedback portal, or community event is represented as currently operating/);
  assert.match(page, /Participation is feedback only; it does not grant shares, tokens, profit-sharing, or voting rights over the company/);
  assert.match(page, /potential benefits to assess, not guaranteed outcomes/);
  assert.doesNotMatch(page, /class="visual-placeholder"|Illustrative feedback interface/);
  assert.doesNotMatch(page, /\[cite:\s*\d+\]|Concept for exploration|Design Prototype|<form\b/i);
});

test('Performance-Linked Partnerships does not claim unconfirmed partners or testing', () => {
  const house = menu.find(item => item.id === 'house');
  const community = house?.groups.find(group => group.id === 'community-culture');
  const partnerships = community?.items.find(item => item.title === 'Performance-Linked Partnerships');
  const pagePath = new URL('../public/performance-partnerships.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');

  assert.ok(existsSync(pagePath));
  assert.equal(partnerships?.kind, 'initiative');
  assert.equal(partnerships?.href, '/performance-partnerships.html');
  assert.equal(partnerships?.status, 'Strategic concept');
  assert.notEqual(partnerships?.navigationUnavailable, true);
  assert.match(partnerships?.description || '', /No named partner, live testing programme, participation criteria, or application flow is confirmed/);
  assert.match(page, /<title>FSD \| Performance-Linked Partnerships<\/title>/);
  assert.match(page, /Status:<\/strong> Proposed strategic concept\./);
  assert.match(page, /developing a partnership framework for training facilities and martial-arts coaches/);
  assert.match(page, /subject to written agreements, agreed safety protocols, and appropriate participant consent/);
  assert.match(page, /No specific partner, facility, or live testing programme is identified on this page/);
  assert.doesNotMatch(page, /<form\b|apply now|join now|registration is open/i);
  assert.doesNotMatch(page, /\[cite:\s*\d+\]|Concept for exploration|Design Prototype|FSD collaborates with dedicated training facilities/i);
});

test('Circular Trade-In describes the initiative without opening a return or credit offer', () => {
  const house = menu.find(item => item.id === 'house');
  const community = house?.groups.find(group => group.id === 'community-culture');
  const tradeIn = community?.items.find(item => item.title === 'Circular Trade-In Programme');
  const pagePath = new URL('../public/circular-trade-in.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');

  assert.ok(existsSync(pagePath));
  assert.equal(tradeIn?.kind, 'initiative');
  assert.equal(tradeIn?.href, '/circular-trade-in.html');
  assert.equal(tradeIn?.status, 'Strategic concept');
  assert.notEqual(tradeIn?.navigationUnavailable, true);
  assert.match(tradeIn?.description || '', /No trade-ins, eligibility, or credit terms are available/);
  assert.match(page, /<title>FSD \| Circular Trade-In Programme<\/title>/);
  assert.match(page, /Status:<\/strong> Strategic concept; no trade-in service is available\./);
  assert.match(page, /inspection, repair, resale, and recycling pathways/);
  assert.match(page, /does not currently accept trade-in requests or specify eligibility, credit, collection, or processing terms/);
  assert.match(page, /No partner or operating process is confirmed/);
  assert.match(page, /No zero-waste or verified environmental-impact claim is made/);
  assert.match(page, /potential aims, not verified outcomes or guarantees/);
  assert.doesNotMatch(page, /class="visual-placeholder"|Illustrative trade-in counter/);
  assert.doesNotMatch(page, /\[cite:\s*\d+\]|Concept for exploration|Design Prototype|<form\b|trade-in credit is available/i);
});

test('Community First Aid & Safety Skills does not claim an unconfirmed training service', () => {
  const house = menu.find(item => item.id === 'house');
  const community = house?.groups.find(group => group.id === 'community-culture');
  const firstAid = community?.items.find(item => item.title === 'Community First Aid & Safety Skills');
  const pagePath = new URL('../public/community-first-aid.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');

  assert.ok(existsSync(pagePath));
  assert.equal(firstAid?.kind, 'initiative');
  assert.equal(firstAid?.href, '/community-first-aid.html');
  assert.equal(firstAid?.status, 'Operating or rollout underway');
  assert.notEqual(firstAid?.navigationUnavailable, true);
  assert.match(page, /<title>FSD \| Community First Aid &amp; Safety Skills<\/title>/);
  assert.match(page, /Status:<\/strong> Operating or rollout underway\./);
  assert.match(page, /first aid education, personal-safety awareness, and practical skills training/);
  assert.match(page, /No accredited provider, course, venue, schedule, age range, or registration is confirmed on this page/);
  assert.match(page, /does not provide first-aid instruction or emergency response/);
  assert.doesNotMatch(page, /\[cite:\s*\d+\]|Concept for exploration|Design Prototype|<form\b|certified provider is currently delivering/i);
});

test('Private Access keeps sign-ups closed and routes private enquiries to the standalone page', () => {
  const access = menu.find(item => item.id === 'private-access');
  assert.equal(access.groups.length, 4);
  assert.ok(access.description.includes('coming soon'));
  assert.equal(access.groups[0].href, '#tactical-shield-membership');
  assert.equal(access.groups[0].navigationUnavailable, false);
  assert.equal(access.groups[0].items[0].href, '#tactical-shield-membership');
  assert.equal(access.groups[0].items[0].navigationUnavailable, false);
  assert.ok(access.groups[0].description.includes('registration is not open'));
  assert.ok(access.groups[1].description.includes('not collecting sign-ups'));
  assert.equal(access.groups[1].href, '');
  assert.equal(access.groups[1].navigationUnavailable, true);
  assert.equal(access.groups[2].href, '#contact');
  assert.equal(access.groups[3].href, '/enquiries.html');
  assert.equal(access.groups[3].navigationUnavailable, false);
  assert.ok(access.groups[3].description.includes('strategic partnerships'));
  assert.ok(access.groups.every(group => group.items.every(item => !item.record)));
});

test('building the navigation model does not mutate product or division data', () => {
  const beforeDivisions = structuredClone(collectionDivisions);
  const beforeProducts = structuredClone(products);
  createNavigationModel();
  assert.deepEqual(collectionDivisions, beforeDivisions);
  assert.deepEqual(products, beforeProducts);
});
