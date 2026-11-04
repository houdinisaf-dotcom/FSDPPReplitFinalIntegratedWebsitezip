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
import { transformHousePageContent } from '../src/standalone-navigation-pages.js';

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

test('Investor Relations uses the selected shorter public dossier and working routes', () => {
  const header = renderNavigationHeader('<span>FSD</span>');
  const investorPage = readFileSync(new URL('../public/investor.html', import.meta.url), 'utf8');

  assert.match(header, /<button type="button"\s+class="fsd-primary-trigger" data-nav-primary="house" aria-controls="fsd-mega-menu"/);
  assert.match(header, /FSD \/ THE HOUSE OF PERFORMANCE <span>·<\/span> INVESTOR RELATIONS/);
  assert.doesNotMatch(header, /href="\/investor\.html"|data-nav-investor/);
  assert.match(header, /<nav class="fsd-mobile-public-links" aria-label="Quick navigation">/);
  assert.match(header, /data-nav-primary="house" aria-controls="fsd-mega-menu" aria-expanded="false">THE HOUSE<\/button>/);
  assert.match(investorPage, /<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg">/);
  assert.match(investorPage, /<div data-fsd-standalone-navigation><\/div>/);
  assert.match(investorPage, /<script type="module" src="\/src\/standalone-navigation\.js"><\/script>/);
  assert.doesNotMatch(investorPage, /<a[^>]+href="\/investor\.html"[^>]*>INVESTOR RELATIONS<\/a>/);
  assert.match(investorPage, /Initial Pre-Seed \(Proposed\)/);
  assert.match(investorPage, /50–100/);
  assert.match(investorPage, /The Foundation/);
  assert.match(investorPage, /Product Architecture/);
  assert.match(investorPage, /Market &amp; Customer/);
  assert.equal((investorPage.match(/<article class="investor-card">/g) ?? []).length, 3);
  assert.match(investorPage, /Public FSD information/);
  assert.doesNotMatch(investorPage, /Confidential discussion draft/i);
  assert.doesNotMatch(investorPage, /Staged Capital Pathway|£25,000|£175,000 – £225,000/);
  assert.doesNotMatch(investorPage, /href="(?:universe|biolab|hardware|private)\.html"/);
  assert.doesNotMatch(investorPage, /<(?:details|summary)\b|role=["']tab["']/i);
});

test('Cryo-Zero has a separate information page without unconfirmed booking or service claims', () => {
  const pagePath = new URL('../public/cryo-zero.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');

  assert.ok(existsSync(pagePath));
  assert.match(page, /<title>FSD \| Cryo-Zero Recovery Chambers<\/title>/);
  assert.match(page, /<div data-fsd-standalone-navigation><\/div>/);
  assert.match(page, /<script type="module" src="\/src\/standalone-navigation\.js"><\/script>/);
  assert.match(page, /Information in preparation/);
  assert.match(page, /No bookings or enquiries are accepted through this page/);
  assert.match(page, /To be confirmed/);
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

test('The House page keeps only Founder Story from its original brand sections', () => {
  const house = menu.find(section => section.id === 'house');
  const group = house?.groups.find(item => item.id === 'our-story');
  const pagePath = new URL('../public/the-house.html', import.meta.url);
  const page = transformHousePageContent(readFileSync(pagePath, 'utf8'));
  const inlineScript = page.match(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script\s*>/i)?.[1] ?? '';

  assert.ok(group);
  assert.deepEqual(group.items.map(item => item.title), [
    'Founder Story',
  ]);
  assert.equal(group.items[0].href, '/the-house.html#brand/founder');
  assert.equal(group.items[0].kind, 'destination');
  assert.ok(existsSync(pagePath));
  assert.match(page, /<title>FSD \| The House<\/title>/);
  assert.match(page, /<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg">/);
  assert.match(page, /<div data-fsd-standalone-navigation><\/div>/);
  assert.doesNotMatch(page, /Archive & Version History|Brand Story & Archive|OUR STORY & ARCHIVE|brand\/(?:archive|purpose|identity|press)|Purpose & Positioning|Brand Identity Standard|Press & Media Kit/);
  assert.match(page, /The Architecture of Purpose/);
  assert.match(page, /Fitness\. Discipline\. Progress\. Built on evidence rather than assertion\./);
  assert.match(page, /Shaped by hands-on experience across frontline environments/);
  assert.match(page, /Uncompromising Standards/);
  assert.doesNotMatch(page, /The founder’s verified biography will appear here/);
  assert.match(page, /<script type="module" src="\/src\/standalone-navigation\.js"><\/script>/);
  assert.doesNotMatch(page, /<a href="\/investor\.html">INVESTOR RELATIONS<\/a>/);
  assert.match(page, /--bk:#0B0C0E/);
  assert.match(page, /--gold:#C8AA72/);
  assert.match(page, /--vg:#C8AA72/);
  assert.match(page, /<nav class="house-sections" id="house-sections" aria-label="The House sections"><\/nav>/);
  assert.doesNotMatch(page, /<div class="mega"|COLLECTION GROUPS|SUBCATEGORIES/);
  assert.match(page, /id="initiative-disclaimer" role="note" hidden/);
  assert.match(inlineScript, /const P=/);
  assert.match(inlineScript, /,M=/);
  assert.match(inlineScript, /window\.configureFSDInnovationRoutes\(P,M\)/);
  assert.match(inlineScript, /const publicHouseGroups=new Set\(\['brand','bio-lab','community','global'\]\)/);
  assert.match(inlineScript, /P\.brand\.subs\.map/);
  assert.match(inlineScript, /addEventListener\('hashchange',render\)/);
  assert.doesNotMatch(inlineScript, /publicInvestorCopy|investorMenu|investorOverview/);
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
    ['/the-house.html#brand/founder', '/the-house.html#community/co-creation', '/the-house.html#global/pods', '/investor.html'].includes(group.href)));
  const story = house.groups.find(group => group.id === 'our-story');
  const flagships = house.groups.find(group => group.id === 'flagships');
  const fightPromotions = house.groups.find(group => group.id === 'fight-promotions');
  const community = house.groups.find(group => group.id === 'community-culture');
  const globalOperations = house.groups.find(group => group.id === 'global-vision-operations');
  const investor = house.groups.find(group => group.id === 'investor-relations');
  assert.equal(story.href, '/the-house.html#brand/founder');
  assert.deepEqual(story.items.map(item => item.title), [
    'Founder Story',
  ]);
  assert.equal(story.items[0].description, 'Fitness. Discipline. Progress.');
  assert.equal(story.description, 'Explore The Architecture of Purpose and the FSD manifesto.');
  assert.ok(story.items.every(item => item.href.startsWith('/the-house.html#brand/')));
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
  assert.equal(community.items[0].href, '/community-co-creation.html');
  assert.equal(community.items[0].kind, 'initiative');
  assert.equal(community.items[0].status, 'Operating or rollout underway');
  assert.equal(community.items[1].href, '/performance-partnerships.html');
  assert.equal(community.items[1].kind, 'initiative');
  assert.equal(community.items[1].status, 'Operating or rollout underway');
  assert.equal(community.items[2].href, '/circular-trade-in.html');
  assert.equal(community.items[2].kind, 'initiative');
  assert.equal(community.items[2].status, 'Operating or rollout underway');
  assert.equal(community.items[3].href, '/community-first-aid.html');
  assert.equal(community.items[3].kind, 'initiative');
  assert.equal(community.items[3].status, 'Operating or rollout underway');
  assert.ok(community.items.slice(4).every(item => item.href.startsWith('/the-house.html#community/')));
  assert.deepEqual(globalOperations.items.map(item => item.title), [
    'FSD Pods',
    'Autonomous Pop-Ups & Predictive Stock',
    'Mobile Testing Labs',
    'Local Micro-Manufacturing',
    'Genetic & Microbiome Personalisation',
    'Security Provisions',
  ]);
  assert.equal(globalOperations.items[0].href, '/fsd-pods.html');
  assert.equal(globalOperations.items[0].kind, 'initiative');
  assert.equal(globalOperations.items[0].status, 'Operating or rollout underway');
  assert.equal(globalOperations.items[1].href, '/autonomous-popups.html');
  assert.equal(globalOperations.items[1].kind, 'initiative');
  assert.equal(globalOperations.items[1].status, 'Operating or rollout underway');
  assert.equal(globalOperations.items[2].href, '/mobile-testing-labs.html');
  assert.equal(globalOperations.items[2].kind, 'initiative');
  assert.equal(globalOperations.items[2].status, 'Operating or rollout underway');
  assert.equal(globalOperations.items[3].href, '/local-micro-manufacturing.html');
  assert.equal(globalOperations.items[3].kind, 'initiative');
  assert.equal(globalOperations.items[3].status, 'Operating or rollout underway');
  assert.equal(globalOperations.items[4].href, '/genetic-microbiome.html');
  assert.equal(globalOperations.items[4].kind, 'initiative');
  assert.equal(globalOperations.items[4].status, 'Operating or rollout underway');
  assert.equal(globalOperations.items[5].href, '/security-vision.html');
  assert.equal(globalOperations.items[5].kind, 'initiative');
  assert.equal(globalOperations.items[5].status, 'Strategic expansion; not operational');
  assert.ok(globalOperations.items.slice(6).every(item => item.href.startsWith('/the-house.html#global/')));
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
  assert.equal(pods?.status, 'Operating or rollout underway');
  assert.notEqual(pods?.navigationUnavailable, true);
  assert.match(page, /<title>FSD \| FSD Pods<\/title>/);
  assert.match(page, /Status:<\/strong> Operating or rollout underway\./);
  assert.match(page, /No FSD Pod, location, or service is currently represented as operational\./);
  assert.match(page, /modular, transportable architectural units/);
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
  assert.equal(retail?.status, 'Operating or rollout underway');
  assert.notEqual(retail?.navigationUnavailable, true);
  assert.match(page, /<title>FSD \| Autonomous Pop-Ups &amp; Predictive Stock<\/title>/);
  assert.match(page, /Status:<\/strong> Operating or rollout underway\./);
  assert.match(page, /No location, partner, event schedule, or opening date is confirmed/);
  assert.match(page, /No live forecasting model or automated stock system is available/);
  assert.match(page, /not unstaffed or cashier-less retail/);
  assert.match(page, /click-and-collect, and location-based availability require future system development/);
  assert.match(page, /No live inventory, location, or demand data is shown/);
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
  assert.equal(testingLabs?.status, 'Operating or rollout underway');
  assert.notEqual(testingLabs?.navigationUnavailable, true);
  assert.match(page, /<title>FSD \| Mobile Testing Labs<\/title>/);
  assert.match(page, /Status:<\/strong> Operating or rollout underway\./);
  assert.match(page, /anonymised performance and fit insights with participant consent/);
  assert.match(page, /No mobile testing unit, venue, test, or data-collection activity is currently represented as operational/);
  assert.match(page, /No biometric sensor tracking or biometric data collection is in confirmed scope/);
  assert.match(page, /No live terminal, participant data, or feedback system is shown/);
  assert.match(testingLabs?.description || '', /biometric sensor tracking is not in confirmed scope/);
  assert.doesNotMatch(page, /\[cite:\s*\d+\]|Concept for exploration|Design Prototype|exploratory concept/i);
});

test('Local Micro-Manufacturing is an initiative without claiming live production', () => {
  const house = menu.find(item => item.id === 'house');
  const globalOperations = house?.groups.find(group => group.id === 'global-vision-operations');
  const manufacturing = globalOperations?.items.find(item => item.title === 'Local Micro-Manufacturing');
  const pagePath = new URL('../public/local-micro-manufacturing.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');

  assert.ok(existsSync(pagePath));
  assert.equal(manufacturing?.kind, 'initiative');
  assert.equal(manufacturing?.href, '/local-micro-manufacturing.html');
  assert.equal(manufacturing?.status, 'Operating or rollout underway');
  assert.notEqual(manufacturing?.navigationUnavailable, true);
  assert.match(page, /<title>FSD \| Local Micro-Manufacturing<\/title>/);
  assert.match(page, /Status:<\/strong> Operating or rollout underway\./);
  assert.match(page, /Potential aims to assess include shorter lead times, lower transport emissions, reduced material waste, and selected customisation; none are measured or promised/);
  assert.match(page, /No local manufacturing hub, production site, or service is currently represented as operational/);
  assert.match(page, /No manufacturing partner or custom-order service is confirmed/);
  assert.match(page, /No delivery-time, material-waste, or emissions reduction is measured or promised/);
  assert.match(manufacturing?.description || '', /environmental benefits are not verified/);
  assert.doesNotMatch(page, /\[cite:\s*\d+\]|Concept for exploration|Design Prototype|exploratory concept/i);
});

test('Genetic & Microbiome Personalisation is a research initiative, not a health service', () => {
  const house = menu.find(item => item.id === 'house');
  const globalOperations = house?.groups.find(group => group.id === 'global-vision-operations');
  const research = globalOperations?.items.find(item => item.title === 'Genetic & Microbiome Personalisation');
  const pagePath = new URL('../public/genetic-microbiome.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');

  assert.ok(existsSync(pagePath));
  assert.equal(research?.kind, 'initiative');
  assert.equal(research?.href, '/genetic-microbiome.html');
  assert.equal(research?.status, 'Operating or rollout underway');
  assert.notEqual(research?.navigationUnavailable, true);
  assert.match(page, /<title>FSD \| Genetic &amp; Microbiome Personalisation<\/title>/);
  assert.match(page, /Status:<\/strong> Operating or rollout underway\./);
  assert.match(page, /strict privacy protections and appropriate clinical oversight/);
  assert.match(page, /No genetic or microbiome testing, data analysis, or personalised health guidance is represented as currently available/);
  assert.match(page, /No sample collection is operating/);
  assert.match(page, /No clinical partnership is identified on this page/);
  assert.match(page, /No claim is made that DNA predicts injury or optimises training/);
  assert.match(research?.description || '', /No testing, sample collection, data analysis, or personalised health guidance is available/);
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

test('Community Co-Creation is an operating initiative without an open submission flow', () => {
  const house = menu.find(item => item.id === 'house');
  const community = house?.groups.find(group => group.id === 'community-culture');
  const coCreation = community?.items.find(item => item.title === 'Community Co-Creation');
  const pagePath = new URL('../public/community-co-creation.html', import.meta.url);
  const page = readFileSync(pagePath, 'utf8');

  assert.ok(existsSync(pagePath));
  assert.equal(coCreation?.kind, 'initiative');
  assert.equal(coCreation?.href, '/community-co-creation.html');
  assert.equal(coCreation?.status, 'Operating or rollout underway');
  assert.notEqual(coCreation?.navigationUnavailable, true);
  assert.match(coCreation?.description || '', /No workshops, trials, forums, portal, or submissions are open/);
  assert.match(page, /<title>FSD \| Community Co-Creation<\/title>/);
  assert.match(page, /Status:<\/strong> Operating or rollout underway\./);
  assert.match(page, /structured feedback, workshops, and collaborative testing/);
  assert.match(page, /does not offer workshop registration, product trials, or feedback submissions/);
  assert.match(page, /No workshop, testing panel, forum, feedback portal, or community event is represented as currently operating/);
  assert.match(page, /Participation is feedback only; it does not grant shares, tokens, profit-sharing, or voting rights over the company/);
  assert.match(page, /potential benefits to assess, not guaranteed outcomes/);
  assert.match(page, /Illustrative feedback interface/);
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
  assert.equal(partnerships?.status, 'Operating or rollout underway');
  assert.notEqual(partnerships?.navigationUnavailable, true);
  assert.match(page, /<title>FSD \| Performance-Linked Partnerships<\/title>/);
  assert.match(page, /Status:<\/strong> Operating or rollout underway\./);
  assert.match(page, /developing a partnership framework for training facilities and martial-arts coaches/);
  assert.match(page, /subject to written agreements, agreed safety protocols, and appropriate participant consent/);
  assert.match(page, /No specific partner, facility, or live testing programme is identified on this page/);
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
  assert.equal(tradeIn?.status, 'Operating or rollout underway');
  assert.notEqual(tradeIn?.navigationUnavailable, true);
  assert.match(tradeIn?.description || '', /No trade-ins, eligibility, or credit terms are available/);
  assert.match(page, /<title>FSD \| Circular Trade-In Programme<\/title>/);
  assert.match(page, /Status:<\/strong> Operating or rollout underway\./);
  assert.match(page, /inspection, repair, resale, and recycling pathways/);
  assert.match(page, /does not currently accept trade-in requests or specify eligibility, credit, collection, or processing terms/);
  assert.match(page, /No partner or operating process is confirmed/);
  assert.match(page, /No zero-waste or verified environmental-impact claim is made/);
  assert.match(page, /potential aims, not verified outcomes or guarantees/);
  assert.match(page, /Illustrative trade-in counter/);
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
