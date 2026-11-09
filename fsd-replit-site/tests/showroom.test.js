import test from 'node:test';
import assert from 'node:assert/strict';
import { customerFacingCategory, products, productsWithUsableImages, priceInfo } from '../src/catalogue-data.js';
import { collectionDivisions } from '../src/collection-divisions.js';
import { renderCollectionShowcase, groupProducts, matchesDraftCardScope } from '../src/collection-showcase/index.js';
import { beyondProductSection, featuredProducts, featuredInnovationsSection, homeHeroExperiencesSection, garmentStudiesSection, garmentStudyDefinitions, houseConnectionSection, vipAccessSection } from '../src/showroom-sections.js';

test('the showroom renders four accessible division controls and one reusable dialog', () => {
  const markup = renderCollectionShowcase(collectionDivisions);
  assert.equal((markup.match(/data-division=/g) || []).length, 4);
  assert.equal((markup.match(/<dialog/g) || []).length, 1);
  assert.match(markup, /id="fsd-showcase-dialog"/);
  assert.equal((markup.match(/aria-controls="fsd-showcase-dialog"/g) || []).length, 4);
  assert.equal((markup.match(/aria-expanded="false"/g) || []).length, 4);
  assert.match(markup, /Wearable technology and connected-apparel concepts; technical details and product availability are not confirmed\./);
  for (const label of ['EXPLORE APPAREL', 'EXPLORE BIO-LAB™', 'EXPLORE HARDWARE', 'EXPLORE GLOBAL']) {
    assert.ok(markup.includes(label));
  }
  assert.doesNotMatch(markup, /fsd-showcase-index|fsd-banner-index|OPEN DIVISION/);
  assert.doesNotMatch(markup, /STRIDE|Shilajit|checkout|add to cart/i);
  assert.deepEqual(collectionDivisions.map(division => division.id), ['apparel', 'bio-lab', 'hardware', 'global']);
});

test('the editorial home keeps the three primary destinations concise and opens the correct groups', () => {
  const markup = renderCollectionShowcase(collectionDivisions, { editorial: true, products });
  assert.match(markup, /MEN’S COLLECTION/);
  assert.match(markup, /WOMEN’S COLLECTION/);
  assert.match(markup, /INNOVATION IN PERFORMANCE/);
  assert.equal((markup.match(/class="fsd-editorial-card__image"/g) || []).length, 2);
  assert.match(markup, /src="\/assets\/products\/strike-shorts-front\.webp"/);
  assert.match(markup, /src="\/fsd-assets\/womens-modest-combat-preview\.webp"/);
  assert.doesNotMatch(markup, /src="\/fsd-assets\/8ffe2fd45a06\.webp"/);
  assert.doesNotMatch(markup, /£|RRP/);
  assert.match(markup, /Advanced material science\./);
  assert.match(markup, /EXPLORE MEN/);
  assert.match(markup, /EXPLORE WOMEN/);
  assert.match(markup, /EXPLORE BIO-LAB™/);
  assert.match(markup, /data-division="apparel"[\s\S]*?data-group-index="0"/);
  assert.match(markup, /data-division="apparel"[\s\S]*?data-group-index="1"/);
  assert.match(markup, /data-division="bio-lab"[\s\S]*?data-group-index="0"/);
  assert.match(markup, /id="fsd-division-hardware"[^>]*data-division="hardware"/);
  assert.match(markup, /id="fsd-division-global"[^>]*data-division="global"/);
  assert.equal((markup.match(/<dialog/g) || []).length, 1);
  assert.doesNotMatch(markup, /fsd-showcase-banner|SHOP ALL PRODUCTS|ADD TO BAG/i);
});

test('the homepage adds four BE HEROES experience panels with approved images or honest placeholders', () => {
  const markup = homeHeroExperiencesSection();
  assert.equal((markup.match(/class="fsd-home-experience"/g) || []).length, 4);
  for (const label of ['BE HEROES™', 'BE STRONGER™', 'BE DISCIPLINED™', 'BE PART OF FSD™']) {
    assert.ok(markup.includes(label));
  }
  for (const title of ['Performance Apparel', 'Training Essentials', 'BIO-LAB™ Innovation', 'THE HOUSE &amp; Community']) {
    assert.ok(markup.includes(title));
  }
  assert.match(markup, /href="\/hardware"/);
  assert.match(markup, /href="\/bio-lab"/);
  assert.match(markup, /href="\/the-house\.html"/);
  assert.equal((markup.match(/<img\b/g) || []).length, 4);
  for (const id of ['heroes', 'stronger', 'disciplined', 'together']) {
    assert.ok(markup.includes(`/fsd-assets/campaigns/${id}.webp`));
  }
  assert.equal((markup.match(/fsd-image-placeholder--banner/g) || []).length, 0);
});

test('group filters constrain category, audience and terms rather than leaking unrelated products', () => {
  const apparel = collectionDivisions[0];
  const men = groupProducts(apparel.groups[0], products);
  const women = groupProducts(apparel.groups[1], products);
  assert.ok(men.length && men.every(product => ['Men’s', 'Unisex'].includes(product.audience)));
  const expectedWomenIds = products
    .filter(product => product.audience === 'Women’s')
    .map(product => product.id)
    .sort((a, b) => a - b);
  assert.deepEqual(women.map(product => product.id).sort((a, b) => a - b), expectedWomenIds);
  assert.ok(women.some(product => product.id === 43));
  const hardware = collectionDivisions[2];
  assert.deepEqual(groupProducts(hardware.groups[0], products).map(product => product.id), [69, 70, 71, 72]);
  assert.deepEqual(groupProducts(hardware.groups[2], products), []);
  assert.deepEqual(groupProducts({}, products), []);
  assert.ok(groupProducts(hardware.groups[1], products).every(product => /gloves|mitts|mouthguard|gear kit/i.test(product.name)));
  assert.ok(groupProducts(collectionDivisions[3].groups[0], products).length === 0);
});

test('customer-facing category labels are normalized without changing filter values', () => {
  const headwear = products.find(product => product.id === 43);
  assert.equal(headwear.category, "Women's / Performance Headwear");
  assert.equal(customerFacingCategory(headwear.category), "Women's Performance");
  assert.equal(customerFacingCategory('Modest Activewear'), 'Modest Activewear');
});

test('women’s sub-lines cover the existing catalogue without unfilled concept placeholders', () => {
  const women = collectionDivisions[0].groups[1];
  const hijabs = groupProducts(women, products, women.subcategories[0]);
  assert.ok(hijabs.some(product => product.id === 43));
  assert.ok(hijabs.every(product => /hijab/i.test(product.name)));
  const longline = groupProducts(women, products, women.subcategories.find(subcategory =>
    subcategory.title === 'Longline Tunics & Training Jackets',
  ));
  assert.deepEqual(longline.map(product => product.id).sort((a, b) => a - b), [47, 48]);
  const leggings = groupProducts(women, products, women.subcategories.find(subcategory =>
    subcategory.title === 'Performance Leggings & Strikeflex Trousers',
  ));
  assert.deepEqual(leggings.map(product => product.id).sort((a, b) => a - b), [40, 41, 74, 75]);
  assert.ok(women.subcategories.every(subcategory => !subcategory.concepts?.length));
  const sublineProductIds = [...new Set(women.subcategories.flatMap(subcategory =>
    groupProducts(women, products, subcategory).map(product => product.id),
  ))].sort((a, b) => a - b);
  const allWomenProductIds = products
    .filter(product => product.audience === 'Women’s')
    .map(product => product.id)
    .sort((a, b) => a - b);
  assert.deepEqual(sublineProductIds, allWomenProductIds);
  const men = collectionDivisions[0].groups[0];
  const volcanic = men.subcategories.find(item => /Volcanic/.test(item.title));
  assert.equal(groupProducts(men, products, volcanic).length, 0);
  assert.deepEqual(volcanic.concepts, ['Volcanic Amber Capsule']);
});

test('draft previews stay in their assigned group view unless a subcategory is explicitly mapped', () => {
  const groupDraft = { divisionId: 'apparel', groupId: 'womens-modest-combat' };
  assert.equal(matchesDraftCardScope(groupDraft, 'apparel', 'womens-modest-combat', -1), true);
  assert.equal(matchesDraftCardScope(groupDraft, 'apparel', 'womens-modest-combat', 0), false);
  assert.equal(matchesDraftCardScope(groupDraft, 'apparel', 'mens-luxury-performance', -1), false);

  const mappedDraft = { ...groupDraft, subcategoryIndex: 0 };
  assert.equal(matchesDraftCardScope(mappedDraft, 'apparel', 'womens-modest-combat', 0), true);
  assert.equal(matchesDraftCardScope(mappedDraft, 'apparel', 'womens-modest-combat', 1), false);
  assert.equal(matchesDraftCardScope(mappedDraft, 'apparel', 'womens-modest-combat', -1), false);
});

test('featured carousel uses only catalogue records with a public RRP and mapped product assets', () => {
  assert.deepEqual(featuredProducts.map(product => product.id), [33, 34]);
  assert.ok(featuredProducts.every(product => products.includes(product)));
  assert.ok(featuredProducts.every(product => productsWithUsableImages.includes(product)));
  assert.ok(featuredProducts.every(product => {
    const price = priceInfo(product);
    return product.images.length > 0 && Boolean(price.value) && !price.label;
  }));
  const markup = featuredInnovationsSection();
  assert.match(markup, /id="innovations"/);
  assert.match(markup, /data-fsd-featured-carousel-slot/);
  assert.doesNotMatch(markup, /Breeze|Nexus|Apex|£|fsd-velocity-performance-sports-hijab/i);
  assert.doesNotMatch(markup, /STRIDE|Shilajit|checkout/i);
});

test('members area teaser links to the working waitlist and collects nothing itself', () => {
  const markup = vipAccessSection();
  assert.match(markup, /MEMBERS AREA · COMING SOON/);
  assert.match(markup, /href="\/#prelaunch-signup"[^>]*>JOIN THE WAITLIST/);
  assert.doesNotMatch(markup, /disabled/);
  assert.doesNotMatch(markup, /<form|<input|mailto:|action=|subscribe/i);
});

test('concept discovery groups retain proposed status and explicit availability boundaries', () => {
  const markup = beyondProductSection();
  for (const group of ['TRAIN & BELONG', 'WEAR', 'BUILT CLOSER', 'TOGETHER & TOMORROW', 'PERSONALISATION RESEARCH']) {
    assert.match(markup, new RegExp(group));
  }
  for (const concept of [
    'Tactical Shield Membership', 'Civic Response Auxiliary', 'Community Co-Creation', 'Community Resilience',
    'Smart Apparel', 'Adaptive Technical Fabrics', 'Circular Trade-In',
    'Autonomous Pop-Ups & Predictive Stock', 'FSD Pods', 'Mobile Testing Labs',
    'Local Micro-Manufacturing', 'Performance-Linked Partnerships',
    'Genetic & Microbiome Personalisation',
  ]) assert.ok(markup.includes(concept), `Missing concept: ${concept}`);
  assert.match(markup, /PROPOSED CONCEPT · REGISTRATION NOT OPEN/);
  assert.match(markup, /OPERATING OR ROLLOUT UNDERWAY/);
  assert.match(markup, /no membership service or registration is available/i);
  assert.match(markup, /<button class="showroom-concepts__unavailable" type="button" disabled>[\s\S]*?Tactical Shield Membership[\s\S]*?<\/button>/);
  assert.doesNotMatch(markup, /href="#tactical-shield-membership"/);
  assert.match(markup, /no specific partner, live testing programme, or connected enquiry channel/i);
  assert.match(markup, /PERSONALISATION RESEARCH[\s\S]*Genetic & Microbiome Personalisation/);
  assert.doesNotMatch(markup, /Coming soon|Open to enquiries|Join the waiting list/i);
  assert.equal((markup.match(/<details class="showroom-concepts__group"/g) || []).length, 5);
});

test('garment studies are accessible non-purchasable concepts with real research destinations', () => {
  const markup = garmentStudiesSection();
  for (const label of ['Performance Leggings', 'Technical Tank', 'Run Jacket']) assert.ok(markup.includes(label));
  assert.equal((markup.match(/data-garment-choice=/g) || []).length, 3);
  assert.match(markup, /aria-pressed="true"/);
  assert.match(markup, /NOT FOR SALE/);
  assert.match(markup, /#adaptive-technical-fabrics/);
  assert.match(markup, /not purchasable or customisable garments/);
  assert.doesNotMatch(markup, /£|\$|add to bag/i);
  assert.deepEqual(garmentStudyDefinitions.map(item => item.title), [
    'Performance Leggings', 'Technical Tank', 'Run Jacket',
  ]);
  assert.ok(garmentStudyDefinitions.some(item => item.destination.endsWith('#smart-apparel-nfc')));
  const vision = houseConnectionSection();
  assert.match(vision, /Train\. Wear\. Belong\.<br\/><em>Be Stronger Together\.<\/em>/);
  assert.match(vision, /id="brand-community"/);
});

test('every homepage campaign scene has its own image, none reusing the lead boxer hero', async () => {
  const { siteMedia } = await import('../src/data/site-media.js');
  const { homeHeroExperiences } = await import('../src/data/home-hero-experiences.js');
  const sources = homeHeroExperiences.map(experience => siteMedia.campaigns[experience.id]?.src);
  assert.ok(sources.every(Boolean), 'Each campaign needs a mapped image.');
  assert.equal(new Set(sources).size, sources.length, 'Campaign images must be distinct.');
  assert.ok(!sources.includes(siteMedia.homeHero.src), 'Campaign scenes must not repeat the lead hero photo.');
});
