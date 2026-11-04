import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import master from '../src/master-products.json' with { type: 'json' };
import additional from '../src/additional-catalog.json' with { type: 'json' };
import { galleryProductIds, galleryProducts } from '../src/gallery.js';
import { products, heldProducts, retiredProducts, categories, filterProducts, getVerifiedProductSpecifications, imageSwatchBackground, priceInfo, safe } from '../src/catalogue-data.js';
import { catalogueSection, roadmapSection, innovationsSection, initCatalogue, navigateCatalogue } from '../src/catalogue.js';
import { crossfadeMappedImage } from '../src/catalogue-image-gallery.js';
import { collectionDivisions } from '../src/collection-divisions.js';
import { renderCollectionShowcase } from '../src/collection-showcase/index.js';
import { beyondProductSection, featuredInnovationsSection, houseConnectionSection, vipAccessSection } from '../src/showroom-sections.js';
import { renderNavigationHeader } from '../src/site-navigation.js';
import { siteMedia } from '../src/data/site-media.js';
import { imagePlaceholderMarkup, installImageErrorFallbacks } from '../src/image-placeholder.js';
import {
  productCardColourwaysMarkup,
  productCardImageMarkup,
  productColourwayImageIndex,
  productColourwayOptions,
} from '../src/product-card-media.js';
import { ourStorySection } from '../src/story-section.js';
import { flagshipPageHashes, renderFlagshipPlaceholderPages, renderInnovationHubIndex } from '../src/flagship-pages.js';

test('original source records and approved set tiers are retained; holds and retired entries are excluded', () => {
  assert.equal(master.length, 79);
  assert.equal(new Set(master.map(p => p.id)).size, 79);
  for (let id = 1; id <= 68; id++) assert.ok(master.some(p => p.id === id));
  assert.equal(products.length, 73);
  assert.deepEqual(heldProducts.map(p => p.id), [36, 37, 64, 68]);
  assert.deepEqual(retiredProducts.map(p => p.id), [21, 53]);
  assert.equal(categories.length, 18);
  assert.ok(products.every(p => !heldProducts.some(h => h.id === p.id)));
  assert.ok(products.every(p => !retiredProducts.some(r => r.id === p.id)));
  assert.equal(products.filter(p => p.confirmedPrice !== null).length, 44);
  assert.ok(products.every(p => !Object.hasOwn(p, 'suggestedPrice')));
});

test('product cards expose only recorded colourways and never reuse another colour image', () => {
  const flex = products.find(product => product.name === 'FLEX — High-Waisted Sculpt Leggings');
  assert.ok(flex);
  assert.equal(flex.confirmedPrice, 65);
  assert.equal(flex.sizes, 'XS; S; M; L; XL; XXL');
  assert.deepEqual(productColourwayOptions(flex), [
    'Obsidian Black',
    'Sage Green',
    'Dusty Rose',
    'Espresso Brown',
    'Teal',
  ]);
  const swatches = productCardColourwaysMarkup(flex);
  assert.equal((swatches.match(/data-catalogue-card-colourway=/g) || []).length, 5);
  assert.match(swatches, /aria-pressed="true"/);

  const noPhotoProduct = products.find(product => product.id === 3);
  const noPhotoColourway = productColourwayOptions(noPhotoProduct)[1];
  const placeholder = productCardImageMarkup(noPhotoProduct, { colourway: noPhotoColourway });
  assert.match(placeholder, /fsd-image-placeholder/);
  assert.match(placeholder, new RegExp(noPhotoColourway.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(placeholder, /<img\b/);

  const mappedProduct = products.find(product => product.id === 34);
  const mappedImages = mappedProduct.images;
  const blackGoldIndex = productColourwayImageIndex(mappedImages, 'Black & Gold');
  assert.ok(blackGoldIndex >= 0);
  assert.match(productCardImageMarkup(mappedProduct, { colourway: 'Black & Gold' }), /strike-shorts-black-gold\.webp/);
  assert.equal(productColourwayImageIndex(mappedImages, 'unrecorded colour'), -1);
});

test('four supplied tactical and running-shell records are listed without mapping composite boards', () => {
  const expected = [
    {
      id: 76,
      externalId: 'fsd-apex-pro-tactical-backpack',
      name: 'FSD Apex Pro Tactical Gym Backpack',
      category: 'Accessories / Gear',
      price: 110,
      sizes: '',
      colourways: ['Obsidian & Gold'],
      placeholders: [
        'Front Isometric View',
        'Rear Ergonomic Straps',
        'Water-Repellent Fabric Detail',
        'Hardware & Crest Close-up',
      ],
    },
    {
      id: 77,
      externalId: 'fsd-scorpion-chitin-tactical-gilet',
      name: 'FSD Scorpion Chitin Tactical Gilet',
      category: 'Outerwear / Tactical',
      price: 135,
      sizes: 'S; M; L; XL; XXL',
      colourways: ['Obsidian Black'],
      placeholders: [
        'Front View with Cargo Pockets',
        'Rear Chitin Spine Armor Detail',
        'Water-Repellent Fabric Close-up',
        'Scorpion Series Chest Crest & Zip',
      ],
    },
    {
      id: 78,
      externalId: 'fsd-velocity-element-running-shell-v1',
      name: 'FSD Velocity Element Running Shell (Series 1)',
      category: 'Outerwear / Performance',
      price: 95,
      sizes: 'XS; S; M; L; XL',
      colourways: ['Tactical Orange', 'Obsidian Black', 'Arctic White'],
      placeholders: [
        'Orange, Black & White Front Views',
        'Rear Sculpted Shield Views',
        'Thumbhole Cuffs Detail',
      ],
    },
    {
      id: 79,
      externalId: 'fsd-velocity-element-running-shell-v2',
      name: 'FSD Velocity Element Running Shell (Series 2)',
      category: 'Outerwear / Performance',
      price: 95,
      sizes: 'XS; S; M; L; XL',
      colourways: ['Charcoal Grey', 'Deep Navy', 'Bone Cream'],
      placeholders: [
        'Charcoal, Navy & Cream Front Views',
        'Rear Sculpted Shield Views',
        'Thumbhole Cuffs Detail',
      ],
    },
  ];

  for (const expectedProduct of expected) {
    const product = products.find(item => item.id === expectedProduct.id);
    assert.ok(product, `${expectedProduct.name} should be in the catalogue`);
    assert.equal(product.externalId, expectedProduct.externalId);
    assert.equal(products.filter(item => item.externalId === expectedProduct.externalId).length, 1);
    assert.equal(product.name, expectedProduct.name);
    assert.equal(product.category, expectedProduct.category);
    assert.equal(product.publicationStatus, 'Active');
    assert.equal(product.confirmedPrice, expectedProduct.price);
    assert.equal(product.currency, 'GBP');
    assert.equal(product.sizes, expectedProduct.sizes);
    assert.deepEqual(product.colourways.split('; '), expectedProduct.colourways);
    assert.deepEqual(product.images, []);
    assert.deepEqual(product.galleryPlaceholders, expectedProduct.placeholders);
    assert.ok(filterProducts(expectedProduct.category).some(item => item.id === product.id));
  }
});

test('customer-facing prices use approved RRPs only', () => {
  assert.deepEqual(priceInfo(products.find(p => p.id === 1)), { label: '', value: '£39.99' });
  assert.deepEqual(priceInfo(products.find(p => p.id === 2)), { label: '', value: '' });
  assert.deepEqual(priceInfo(products.find(p => p.id === 59)), { label: '', value: '' });
  assert.deepEqual(priceInfo(products.find(p => p.id === 43)), { label: '', value: '£34.99' });
  assert.deepEqual(priceInfo(products.find(p => p.id === 33)), { label: '', value: '£59.99' });
  assert.deepEqual(priceInfo(products.find(p => p.id === 34)), { label: '', value: '£49.99' });
  assert.deepEqual(priceInfo(products.find(p => p.id === 57)), { label: '', value: '£18.00' });
  assert.deepEqual(priceInfo(products.find(p => p.id === 49)), { label: '', value: '£64.99' });
  assert.deepEqual(priceInfo(products.find(p => p.id === 73)), { label: '', value: '£145.00' });
});

test('hardware records use only the uploaded standalone product images with exact record matches', () => {
  const expectedImages = new Map([
    [52, '/assets/products/precision-barbell-collars.webp'],
    [70, '/assets/products/obsidian-gold-elite-set.webp'],
    [71, '/assets/products/vanguard-commercial-set.webp'],
  ]);

  for (const [id, src] of expectedImages) {
    const product = products.find(item => item.id === id);
    assert.equal(product?.images.length, 1);
    assert.equal(product?.images[0].src, src);
    assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)));
  }

  for (const id of [54, 55, 69, 72]) {
    assert.equal(products.find(item => item.id === id)?.images.length, 0);
  }
});

test('Signature Performance Sports Duffel uses the new lifestyle hero and four mapped detail views', () => {
  const duffel = products.find(product => product.id === 56);
  assert.equal(products.filter(product => product.name === 'Signature Performance Sports Duffel').length, 1);
  assert.equal(duffel?.externalId, 'fsd-signature-duffel-01');
  assert.equal(duffel?.category, 'Accessories / Bags');
  assert.equal(duffel?.audience, 'Women’s');
  assert.deepEqual(duffel?.alsoShowIn, ['Women’s Performance', 'Gym Hardware and Accessories']);
  assert.equal(duffel?.confirmedPrice, 95);
  assert.equal(duffel?.currency, 'GBP');
  assert.equal(duffel?.badge, 'Signature Series');
  assert.equal(duffel?.collection, 'Standard / Core');
  assert.equal(duffel?.colourways, 'Obsidian & Satin Gold');
  assert.equal(duffel?.colourwayPrimary, '#0A0A0A');
  assert.equal(duffel?.colourwayAccent, '#D4AF37');
  assert.equal(duffel?.images.length, 5);
  assert.deepEqual(duffel?.images.map(image => image.label), [
    'Lifestyle / Gym Hero',
    'Front / Overview',
    'Side Compartment / Shoe Storage',
    'Interior / Organization',
    'Hardware / Crest Close-up',
  ]);
  assert.deepEqual(getVerifiedProductSpecifications(56)?.benefits, duffel?.features);
  assert.match(imageSwatchBackground(duffel?.colourways), /#0A0A0A.*#D4AF37/);
  assert.ok(duffel?.images.every(image => existsSync(new URL(`../public${image.src}`, import.meta.url))));
});

test('Performance Crew Socks updates the existing three-pair record with four mapped views', () => {
  const socks = products.find(product => product.id === 57);
  assert.equal(products.filter(product => product.id === 57).length, 1);
  assert.equal(socks?.name, 'FSD Performance Crew Socks');
  assert.equal(socks?.alias, 'FSD Performance Training Socks (3-Pair Pack); FSD Performance Training Socks');
  assert.equal(socks?.category, 'Accessories / Footwear');
  assert.deepEqual(socks?.alsoShowIn, ['Women’s Performance', 'Gym Hardware and Accessories']);
  assert.equal(socks?.confirmedPrice, 18);
  assert.equal(socks?.currency, 'GBP');
  assert.equal(socks?.badge, 'Essentials Line');
  assert.equal(socks?.setContents, '3 pairs');
  assert.equal(socks?.colourways, 'Obsidian & Satin Gold');
  assert.equal(socks?.colourwayPrimary, '#0A0A0A');
  assert.equal(socks?.colourwayAccent, '#D4AF37');
  assert.deepEqual(socks?.images.map(image => image.src), [
    '/assets/products/performance-socks-side.png',
    '/assets/products/performance-socks-rear.png',
    '/assets/products/performance-socks-detail.png',
    '/assets/products/performance-socks-mesh.png',
  ]);
  assert.deepEqual(socks?.images.map(image => image.label), [
    'Side Profile View',
    'Rear Heel View',
    'Detail / Gold Crest Embroidery',
    'Texture / Arch Mesh Panel',
  ]);
  assert.deepEqual(getVerifiedProductSpecifications(57)?.benefits, socks?.features);
  assert.ok(filterProducts('Accessories / Footwear').some(product => product.id === 57));
  assert.ok(filterProducts('Women’s Performance').some(product => product.id === 57));
  assert.ok(socks?.images.every(image => existsSync(new URL(`../public${image.src}`, import.meta.url))));
});

test('women’s MMA rash guard preserves its first image and maps four supplied gallery views', () => {
  const rashGuard = products.find(product => product.id === 33);
  assert.equal(products.filter(product => product.id === 33).length, 1);
  assert.equal(rashGuard?.name, "FSD Women's MMA Performance Rash Guard");
  assert.equal(rashGuard?.alias, 'FSD Women’s MMA Performance Rash Guard; FSD COMBAT Women’s MMA-Specific Rash Guard');
  assert.equal(rashGuard?.category, 'Women’s / Combat Sports');
  assert.deepEqual(rashGuard?.alsoShowIn, ['Combat and MMA', 'Women’s Performance']);
  assert.equal(rashGuard?.audience, 'Women’s');
  assert.equal(rashGuard?.confirmedPrice, 59.99);
  assert.equal(rashGuard?.externalId, 'fsd-womens-mma-rash-guard-01');
  assert.equal(rashGuard?.currency, 'GBP');
  assert.equal(rashGuard?.badge, 'Combat Series');
  assert.equal(rashGuard?.colourways, 'Obsidian & Satin Gold');
  assert.equal(rashGuard?.sizes, 'XS; S; M; L; XL; XXL');
  assert.deepEqual(rashGuard?.options, ['Long Sleeve', 'Short Sleeve']);
  assert.deepEqual(rashGuard?.images.map(image => image.label), [
    'Hero Lifestyle View',
    'Obsidian & Satin Gold / Seated cage-side lifestyle',
    'Obsidian & Satin Gold / Fabric and branding detail',
    'Obsidian & Satin Gold / Grappling action',
    'Obsidian & Satin Gold / Packaging presentation',
  ]);
  assert.equal(rashGuard?.images[0]?.src, '/assets/products/womens-rashguard-hero.png');
  assert.ok(rashGuard?.images.every(image => image.colourway === 'Obsidian & Satin Gold'));
  assert.deepEqual(getVerifiedProductSpecifications(33)?.benefits, rashGuard?.features);
  assert.ok(filterProducts('Women’s / Combat Sports').some(product => product.id === 33));
  assert.ok(filterProducts('Combat and MMA').some(product => product.id === 33));
  assert.ok(filterProducts('Women’s Performance').some(product => product.id === 33));
  assert.ok(rashGuard?.images.every(image => existsSync(new URL(`../public${image.src}`, import.meta.url))));
});

test('Strike Combat Shorts uses the four supplied colourways, size range and mapped kick/technical gallery', () => {
  const shorts = products.find(product => product.id === 34);
  assert.equal(products.filter(product => product.id === 34).length, 1);
  assert.equal(shorts?.name, "FSD Strike Men's Combat Shorts");
  assert.equal(shorts?.externalId, 'fsd-strike-mens-combat-shorts-01');
  assert.equal(shorts?.category, 'Men’s / Combat Sports');
  assert.deepEqual(shorts?.alsoShowIn, ['Combat and MMA', 'Men’s Performance and Training']);
  assert.equal(shorts?.audience, 'Men’s');
  assert.equal(shorts?.confirmedPrice, 49.99);
  assert.equal(shorts?.currency, 'GBP');
  assert.equal(shorts?.badge, 'Combat Series');
  assert.equal(shorts?.publicationStatus, 'Active');
  assert.equal(shorts?.sizes, 'S; M; L; XL; XXL');
  assert.equal(shorts?.colourways, 'Black & Gold; Charcoal & Electric Lime; Navy & Ice Blue; Olive & Cream');
  assert.deepEqual(shorts?.colourwayPalette.map(({ name, primary, accent }) => ({ name, primary, accent })), [
    { name: 'Black & Gold', primary: '#0A0A0A', accent: '#D4AF37' },
    { name: 'Charcoal & Electric Lime', primary: '#2C2C2C', accent: '#CCFF00' },
    { name: 'Navy & Ice Blue', primary: '#0B132B', accent: '#7DF9FF' },
    { name: 'Olive & Cream', primary: '#3B3A36', accent: '#F5F5DC' },
  ]);
  assert.equal(shorts?.images.length, 11);
  assert.equal(shorts?.images[0].label, 'Action Kick Hero View');
  assert.deepEqual(shorts?.images.slice(1, 5).map(({ colourway }) => colourway), [
    'Black & Gold',
    'Charcoal & Electric Lime',
    'Navy & Ice Blue',
    'Olive & Cream',
  ]);
  assert.deepEqual(shorts?.images.slice(5).map(({ label }) => label), [
    'Front View',
    'Rear View',
    'Side / Fit View',
    'Detail / Waistband, Drawcord & Gold Hardware',
    'Detail / Mesh Panel & Trim',
    'Training Kick View',
  ]);
  assert.deepEqual(getVerifiedProductSpecifications(34)?.benefits, shorts?.features);
  assert.equal(imageSwatchBackground('Navy & Ice Blue', shorts?.colourwayPalette),
    'linear-gradient(135deg, #0B132B 0% 68%, #7DF9FF 68% 100%)');
  assert.ok(filterProducts('Men’s / Combat Sports').some(product => product.id === 34));
  assert.ok(filterProducts('Combat and MMA').some(product => product.id === 34));
  assert.ok(filterProducts('Men’s Performance and Training').some(product => product.id === 34));
  assert.ok(shorts?.images.every(image => existsSync(new URL(`../public${image.src}`, import.meta.url))));
});

test('Apex leggings are added separately with the supplied £65 data and an explicit clean image placeholder', () => {
  const apex = products.find(product => product.id === 74);
  const existingFlexRecord = products.find(product => product.id === 40);
  assert.equal(products.filter(product => product.externalId === 'fsd-apex-high-waist-leggings-01').length, 1);
  assert.equal(apex?.name, 'FSD Apex High-Waisted Compression Leggings');
  assert.equal(apex?.category, "Women's / Performance Bottoms");
  assert.deepEqual(apex?.alsoShowIn, ['Women’s Performance']);
  assert.equal(apex?.audience, 'Women’s');
  assert.equal(apex?.publicationStatus, 'Active');
  assert.equal(apex?.confirmedPrice, 65);
  assert.equal(apex?.currency, 'GBP');
  assert.deepEqual(priceInfo(apex), { label: '', value: '£65.00' });
  assert.equal(apex?.badge, 'Performance Line');
  assert.equal(apex?.sizes, 'XS; S; M; L; XL; XXL');
  assert.equal(apex?.colourways, 'Obsidian & Satin Gold');
  assert.equal(apex?.colourwayPrimary, '#0A0A0A');
  assert.equal(apex?.colourwayAccent, '#D4AF37');
  assert.equal(apex?.images.length, 0);
  assert.match(apex?.imageStatus, /three labeled gallery placeholders/i);
  assert.deepEqual(apex?.galleryPlaceholders, [
    'Front Full View',
    'Rear Contour View',
    'Detail / Gold Crest & Waistband',
  ]);
  assert.deepEqual(apex?.features, [
    'Supportive double-layer high-waisted band with anti-slip hold',
    'Targeted ergonomic contour seams to sculpt and support',
    'Squat-proof, highly opaque, moisture-wicking technical fabric',
    'Discreet internal waistband card/phone pocket',
    'Satin Champagne Gold heat-transferred FSD shield crest on rear hip',
  ]);
  assert.deepEqual(getVerifiedProductSpecifications(74)?.benefits, apex?.features);
  assert.ok(imageSwatchBackground(apex?.colourways));
  assert.ok(filterProducts('All', 'Apex High-Waisted Compression Leggings').some(product => product.id === 74));
  assert.equal(existingFlexRecord?.name, "FSD Women's Performance Training Leggings");
  assert.equal(existingFlexRecord?.confirmedPrice, 49.99);
});

test('FLEX Sculpt Leggings are a separate £65 listing with five colourways and a collage-free gallery', () => {
  const flex = products.find(product => product.id === 75);
  const existingFlexRecord = products.find(product => product.id === 40);
  const apex = products.find(product => product.id === 74);

  assert.equal(products.filter(product => product.externalId === 'fsd-flex-high-waisted-sculpt-leggings').length, 1);
  assert.equal(flex?.name, 'FLEX — High-Waisted Sculpt Leggings');
  assert.equal(flex?.category, "Women's / Performance Bottoms");
  assert.deepEqual(flex?.alsoShowIn, ['Women’s Performance']);
  assert.equal(flex?.audience, 'Women’s');
  assert.equal(flex?.publicationStatus, 'Active');
  assert.equal(flex?.confirmedPrice, 65);
  assert.equal(flex?.currency, 'GBP');
  assert.deepEqual(priceInfo(flex), { label: '', value: '£65.00' });
  assert.equal(flex?.badge, 'Sculpt Series');
  assert.equal(flex?.sizes, 'XS; S; M; L; XL; XXL');
  assert.equal(flex?.colourways, 'Obsidian Black; Sage Green; Dusty Rose; Espresso Brown; Teal');
  assert.deepEqual(flex?.colourwayPalette.map(({ name, primary, accent }) => ({ name, primary, accent })), [
    { name: 'Obsidian Black', primary: '#0A0A0A', accent: '#D4AF37' },
    { name: 'Sage Green', primary: '#6B7A68', accent: '#D4AF37' },
    { name: 'Dusty Rose', primary: '#C28E92', accent: '#D4AF37' },
    { name: 'Espresso Brown', primary: '#4A3B32', accent: '#D4AF37' },
    { name: 'Teal', primary: '#2D6873', accent: '#D4AF37' },
  ]);
  assert.equal(flex?.images.length, 32);
  assert.deepEqual(flex?.images.map(({ label }) => label), [
    'Obsidian Black / Front Lifestyle Hero',
    'Colourway / Obsidian Black',
    'Colourway / Sage Green',
    'Colourway / Dusty Rose',
    'Colourway / Espresso Brown',
    'Colourway / Teal',
    'Obsidian Black / Rear View',
    'Sage Green / Seated Lifestyle View',
    'Sage Green / Rear Contour View',
    'Dusty Rose / Rear Lifestyle View',
    'Espresso Brown / Rear View',
    'Espresso Brown / Side Pocket Detail',
    'Teal / Rear View',
    'Technical Detail / Side Phone Pocket',
    'Technical Detail / Fabric Texture',
    'Technical Detail / Flatlock Seams',
    'Dusty Rose / Kneeling Lifestyle View',
    'Dusty Rose / Side Pocket Detail',
    'Dusty Rose / Rear Three-Quarter View',
    'Dusty Rose / Front Lifestyle View',
    'Dusty Rose / Side Lifestyle View',
    'Espresso Brown / Side Profile View',
    'Teal / Side Lifestyle View',
    'Teal / Seated Lifestyle View',
    'Sage Green / Lunge Training View',
    'Sage Green / Seated Profile View',
    'Sage Green / Front Lifestyle View',
    'Obsidian Black / Training Lifestyle View',
    'Obsidian Black / Standing Lifestyle View',
    'Obsidian Black / Gym Lifestyle View',
    'Espresso Brown / Lifestyle View',
    'Espresso Brown / Side Lifestyle View',
  ]);
  assert.equal(new Set(flex?.images.map(({ label }) => label)).size, flex?.images.length);
  for (const colourway of ['Obsidian Black', 'Sage Green', 'Dusty Rose', 'Espresso Brown', 'Teal']) {
    assert.ok(flex?.images.some(image => image.colourway === colourway), `${colourway} should have a mapped image`);
  }
  assert.deepEqual(getVerifiedProductSpecifications(75)?.benefits, flex?.features);
  assert.ok(imageSwatchBackground('Teal', flex?.colourwayPalette));
  assert.ok(filterProducts("Women's / Performance Bottoms").some(product => product.id === 75));
  assert.ok(filterProducts('All', 'FLEX — High-Waisted Sculpt Leggings').some(product => product.id === 75));
  assert.ok(flex?.images.every(image => image.src.endsWith('.webp')));
  assert.ok(flex?.images.every(image => existsSync(new URL(`../public${image.src}`, import.meta.url))));
  assert.equal(existingFlexRecord?.name, "FSD Women's Performance Training Leggings");
  assert.equal(existingFlexRecord?.confirmedPrice, 49.99);
  assert.equal(apex?.name, 'FSD Apex High-Waisted Compression Leggings');
  assert.equal(apex?.confirmedPrice, 65);
});

test('uploaded product taglines and copy attach to their existing catalogue records', () => {
  const product = id => products.find(item => item.id === id);
  const flex = product(75);
  const backpack = product(76);
  const gilet = product(77);
  const velocitySeriesOne = product(78);
  const velocitySeriesTwo = product(79);

  assert.equal(flex?.shortDescription, 'Sculpted. Supportive. Uncompromising.');
  assert.match(flex?.description ?? '', /training, lifting and everyday wear/);
  assert.ok(flex?.features.some(feature => /tested across all five colourways/i.test(feature)));

  assert.equal(backpack?.shortDescription, 'Elite utility and weather-resistant durability.');
  assert.match(backpack?.description ?? '', /hydro-repellent coating/);

  assert.equal(gilet?.shortDescription, 'Statement styling meets tactical architecture.');
  assert.match(gilet?.description ?? '', /not personal protective equipment/i);
  assert.ok(gilet?.features.some(feature => /chitin-inspired spine plates/i.test(feature)));

  for (const shell of [velocitySeriesOne, velocitySeriesTwo]) {
    assert.equal(shell?.shortDescription, 'Ultra-lightweight meteorological shielding.');
    assert.match(shell?.description ?? '', /high-mobility outdoor conditioning and transit/);
    assert.ok(shell?.features.some(feature => /thumbhole cuffs/i.test(feature)));
  }
});

test('the public Breeze set stays distinct from the existing overshirt and is reachable from Women’s modest collections', () => {
  const set = products.find(product => product.id === 73);
  const existingOvershirt = products.find(product => product.id === 49);
  const womensGroup = collectionDivisions.find(group => group.id === 'apparel')
    ?.groups.find(group => group.id === 'womens-modest-combat');

  assert.equal(set?.name, 'FSD Breeze Overshirt & Engineered Leggings Set');
  assert.equal(set?.confirmedPrice, 145);
  assert.equal(set?.specificationStatus, 'Approved');
  assert.equal(existingOvershirt?.name, "FSD Women's Lightweight Modest Training Overshirt");
  assert.equal(existingOvershirt?.confirmedPrice, 64.99);
  assert.ok(filterProducts('Modest Activewear', 'FSD Breeze Overshirt & Engineered Leggings Set')
    .some(product => product.id === 73));
  assert.ok(womensGroup?.subcategories.some(item =>
    item.title === 'FSD Breeze Set' && item.productTerms.includes('FSD Breeze Overshirt & Engineered Leggings Set')));
  assert.equal(set?.images.length, 13);
  for (const image of set.images) {
    assert.ok(existsSync(new URL(`../public${image.src}`, import.meta.url)), `${image.src} should exist`);
  }
});

test('category cross-listing, alternate names, colourways and case-insensitive search work', () => {
  assert.ok(filterProducts('Men’s Performance and Training').some(p => p.id === 23));
  assert.equal(filterProducts('All', '  FSD Strike Men’s Training T-Shirt  ')[0].id, 16);
  assert.ok(filterProducts('All', 'electric cobalt').some(p => p.id === 1));
  assert.equal(filterProducts('Smart Tech').length, 6);
  assert.equal(filterProducts('Sports Hijabs').length, 4);
  assert.equal(filterProducts('Smart Tech', 'training socks').length, 0);
});

test('colourways share one record, verified image references exist, and unknown mappings stay empty', () => {
  assert.equal(products.filter(p => p.name === 'FSD Cheetah Windrunner').length, 1);
  assert.equal(products.find(p => p.id === 10).images.length, 3);
  assert.equal(products.find(p => p.id === 1).images.length, 2);
  assert.equal(products.filter(p => p.images.length).length, 15);
  for (const p of products) for (const image of p.images) {
    assert.ok(existsSync(new URL(`../public${image.src}`, import.meta.url)));
    if (p.id === 43) {
      assert.equal(p.colourways, 'Black / Gold');
      assert.equal(image.colourway, 'Black / Gold');
    } else if (image.colourway) {
      const colourways = Array.isArray(p.rowColourways)
        ? p.rowColourways
        : p.colourways.split(';').map(value => value.trim());
      assert.ok(colourways.includes(image.colourway));
    }
  }
});

test('product images use only supplied assets explicitly mapped to products', () => {
  assert.deepEqual(products.filter(p => p.images.length).map(p => p.id), [1, 10, 18, 19, 33, 34, 42, 43, 52, 56, 57, 70, 71, 73, 75]);
  assert.deepEqual(products.find(p => p.id === 18).images.map(image => image.src), [
    '/assets/products/aeroforge-training-tee/aeroforge-white-green-lifestyle-hero.webp',
    '/assets/products/aeroforge-training-tee/aeroforge-white-green-front-fit.webp',
    '/assets/products/aeroforge-training-tee/aeroforge-white-green-fabric-detail.webp',
    '/assets/products/aeroforge-training-tee/aeroforge-white-green-seated-lifestyle.webp',
    '/assets/products/aeroforge-training-tee/aeroforge-white-green-rear-lifestyle.webp',
    '/assets/products/aeroforge-training-tee/aeroforge-white-green-womens-fit.webp',
    '/assets/products/aeroforge-training-tee/aeroforge-white-green-front-product.webp',
    '/assets/products/aeroforge-training-tee/aeroforge-white-green-rear-product.webp',
    '/assets/products/aeroforge-training-tee/aeroforge-white-green-seated-training.webp',
    '/assets/products/aeroforge-training-tee/aeroforge-white-green-womens-seated-training.webp',
    '/assets/products/aeroforge-training-tee/aeroforge-white-green-neck-label-detail.webp',
    '/assets/products/aeroforge-training-tee/aeroforge-white-green-shoulder-mesh-detail.webp',
    '/assets/products/aeroforge-training-tee/aeroforge-all-black-front.webp',
    '/assets/products/aeroforge-training-tee/aeroforge-black-grey-front.webp',
    '/assets/products/aeroforge-training-tee/aeroforge-sage-black-front.webp',
    '/assets/products/aeroforge-training-tee/aeroforge-charcoal-orange-front.webp',
    '/assets/products/aeroforge-training-tee/aeroforge-navy-blue-front.webp',
  ]);
  assert.deepEqual(products.find(p => p.id === 19).images.map(image => image.src), [
    '/assets/products/aeroforge-hybrid-short/aeroforge-black-green-lifestyle.webp',
  ]);
  assert.deepEqual(products.find(p => p.id === 1).images.map(image => image.src), [
    '/images/ombre-indigo.png', '/images/ombre-blue.png',
  ]);
  assert.deepEqual(products.find(p => p.id === 10).images.map(image => image.src), [
    '/images/windrunner-yellow.png', '/images/windrunner-white.png', '/images/windrunner-khaki.png',
  ]);
  assert.deepEqual(products.find(p => p.id === 33).images.map(image => image.src), [
    '/assets/products/womens-rashguard-hero.png',
    '/products/womens-mma-rash-guard/black-gold/lifestyle.webp',
    '/products/womens-mma-rash-guard/black-gold/fabric.webp',
    '/products/womens-mma-rash-guard/black-gold/action.webp',
    '/products/womens-mma-rash-guard/black-gold/packaging.webp',
  ]);
  assert.deepEqual(products.find(p => p.id === 34).images.map(image => image.src), [
    '/assets/products/strike-shorts-hero.webp',
    '/assets/products/strike-shorts-black-gold.webp',
    '/assets/products/strike-shorts-charcoal-electric-lime.webp',
    '/assets/products/strike-shorts-navy-ice-blue.webp',
    '/assets/products/strike-shorts-olive-cream.webp',
    '/assets/products/strike-shorts-front.webp',
    '/assets/products/strike-shorts-rear.webp',
    '/assets/products/strike-shorts-side.webp',
    '/assets/products/strike-shorts-waistband-detail.webp',
    '/assets/products/strike-shorts-mesh-detail.webp',
    '/assets/products/strike-shorts-kick-view.webp',
  ]);
  assert.deepEqual(products.find(p => p.id === 43).images.map(image => image.src), [
    '/assets/products/velocity-hijab-main-listing.jpg',
    '/assets/products/velocity-hijab-front-detail.png',
    '/assets/products/velocity-hijab-rear-view.png',
    '/assets/products/velocity-hijab-fabric-ventilation.png',
    '/assets/products/velocity-hijab-branding-detail.png',
  ]);
  assert.deepEqual(products.find(p => p.id === 43).images.map(image => image.label), [
    'Main Product Listing / Lifestyle Hero',
    'Front / Hero Detail',
    'Rear View',
    'Fabric & Ventilation Detail',
    'Branding / Gold Crest Detail',
  ]);
  assert.equal(products.find(p => p.id === 43).imageStatus, 'Five replacement standalone photos: listing hero plus front, rear, fabric/ventilation, and branding details');
  assert.ok(products.find(p => p.id === 43).images.every(image =>
    existsSync(new URL(`../public${image.src}`, import.meta.url))));
  assert.deepEqual(products.find(p => p.id === 56).images.map(image => image.src), [
    '/assets/products/signature-duffel-lifestyle.png',
    '/assets/products/signature-duffel-overview.png',
    '/assets/products/signature-duffel-shoe-compartment.png',
    '/assets/products/signature-duffel-interior-organization.png',
    '/assets/products/signature-duffel-hardware-detail.png',
  ]);
  assert.deepEqual(products.find(p => p.id === 57).images.map(image => image.src), [
    '/assets/products/performance-socks-side.png',
    '/assets/products/performance-socks-rear.png',
    '/assets/products/performance-socks-detail.png',
    '/assets/products/performance-socks-mesh.png',
  ]);
  assert.deepEqual(products.find(p => p.id === 73).images.map(image => image.src), [
    '/fsd-assets/breeze-set-onyx-black-full-length.webp',
    '/fsd-assets/breeze-set-onyx-black-front.webp',
    '/fsd-assets/breeze-set-onyx-black-trouser-view.webp',
    '/fsd-assets/breeze-set-onyx-black.webp',
    '/fsd-assets/breeze-set-onyx-black-side.webp',
    '/fsd-assets/breeze-set-deep-olive.webp',
    '/fsd-assets/breeze-set-warm-taupe-full-length.webp',
    '/fsd-assets/breeze-set-slate-grey-full-length.webp',
    '/fsd-assets/breeze-set-slate-grey.webp',
    '/fsd-assets/breeze-set-midnight-navy.webp',
    '/fsd-assets/breeze-set-deep-burgundy-full-length.webp',
    '/fsd-assets/breeze-set-deep-burgundy-alt-full-length.webp',
    '/fsd-assets/breeze-set-deep-burgundy.webp',
  ]);
  for (const id of [45, 60, 61, 62, 63, 65]) {
    assert.deepEqual(products.find(p => p.id === id).images, []);
  }
});

test('Velocity update retains its own Black / Gold variant and stays separate from the seven-colourway CORE hijab', () => {
  const velocity = products.find(product => product.id === 43);
  const core = products.find(product => product.id === 42);
  assert.equal(velocity?.name, 'FSD Velocity Sports Hijab');
  assert.equal(velocity?.alias, 'FSD Velocity Performance Sports Hijab');
  assert.equal(velocity?.category, "Women's / Performance Headwear");
  assert.deepEqual(velocity?.alsoShowIn, ['Modest Activewear', 'Sports Hijabs']);
  assert.equal(velocity?.confirmedPrice, 34.99);
  assert.equal(velocity?.externalId, 'fsd-velocity-sports-hijab-01');
  assert.equal(velocity?.currency, 'GBP');
  assert.equal(velocity?.badge, 'Performance Line');
  assert.equal(velocity?.colourways, 'Black / Gold');
  assert.deepEqual(velocity?.images.map(image => image.src), [
    '/assets/products/velocity-hijab-main-listing.jpg',
    '/assets/products/velocity-hijab-front-detail.png',
    '/assets/products/velocity-hijab-rear-view.png',
    '/assets/products/velocity-hijab-fabric-ventilation.png',
    '/assets/products/velocity-hijab-branding-detail.png',
  ]);
  assert.deepEqual(velocity?.images.map(image => image.label), [
    'Main Product Listing / Lifestyle Hero',
    'Front / Hero Detail',
    'Rear View',
    'Fabric & Ventilation Detail',
    'Branding / Gold Crest Detail',
  ]);
  assert.ok(velocity?.images.every(image => image.colourway === 'Black / Gold'));
  assert.equal(core?.colourways, 'Navy/Cyan, Black/Gold, Black/White, Olive/Lime, Dark Grey/Silver, Black/Magenta, Burgundy/Pink');
  assert.equal(core?.confirmedPrice, 29.99);
  assert.deepEqual(getVerifiedProductSpecifications(43)?.benefits, velocity?.features);
  assert.ok(filterProducts("Women's / Performance Headwear").some(product => product.id === 43));
  assert.ok(filterProducts('Modest Activewear').some(product => product.id === 43));
  assert.ok(filterProducts('Sports Hijabs').some(product => product.id === 43));
});

test('image swatches use named mapped colourways and do not invent unknown colours', () => {
  assert.match(imageSwatchBackground('Vintage indigo fading to jet black'), /^linear-gradient\(135deg,/);
  assert.match(imageSwatchBackground('Sunshine yellow / jet black'), /#e1b642/);
  assert.equal(imageSwatchBackground('Unmapped colour concept'), '');

  const image = { src: '/old.webp', alt: 'Old image', parentElement: null, ownerDocument: null };
  assert.equal(crossfadeMappedImage(image, '/new.webp', 'Mapped new image'), true);
  assert.equal(image.src, '/new.webp');
  assert.equal(image.alt, 'Mapped new image');
});

test('rendered sections follow the master list, escape content, and do not promote held products', () => {
  const sections = catalogueSection() + roadmapSection() + innovationsSection();
  assert.match(sections, /Find FSD products by collection, category and audience/);
  assert.match(sections, /SHOP BY CATEGORY/);
  assert.doesNotMatch(sections, /66 products across 9 categories|Browse the existing collection|FSD DEVELOPMENT ROADMAP/i);
  assert.doesNotMatch(sections, /in development|pre-launch/i);
  assert.doesNotMatch(sections, /STRIDE|smartwatch|Shilajit|Championship Belt|Ring Corner Post/i);
  assert.doesNotMatch(sections, /Upcoming collection|Prices and details|Join VIP Access/);
  assert.doesNotMatch(sections, /buy now|checkout|payment|<form/i);
  assert.equal(safe('<script>"x"&</script>'), '&lt;script&gt;&quot;x&quot;&amp;&lt;/script&gt;');
});

test('catalogue UI handlers filter, reset, open details and close the dialog', async () => {
  // Minimal DOM surface checks the real event handlers without a browser dependency.
  const elements = new Map();
  const handlers = new Map();
  const element = selector => {
    if (!elements.has(selector)) elements.set(selector, {
      value: '', innerHTML: '', textContent: '', open: false,
      dataset: {},
      addEventListener(type, callback) { handlers.set(`${selector}:${type}`, callback); },
      setAttribute() {}, scrollIntoView() {}, focus() {},
      contains() { return false; },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      showModal() { this.open = true; }, close() { this.open = false; },
    });
    return elements.get(selector);
  };
  globalThis.document = {
    querySelector: element,
    addEventListener(type, callback) { handlers.set(`document:${type}`, callback); },
  };
  const click = (selector, data) => handlers.get('document:click')({
    target: { closest: requested => requested === selector ? data : null },
  });
  try {
    initCatalogue();
    const allProductCount = filterProducts('All').length;
    const initialPageCount = Math.min(12, allProductCount);
    assert.equal(
      element('#catalogue-count').textContent,
      `Showing 1–${initialPageCount} of ${allProductCount} products`,
    );
    assert.equal(
      (element('#catalogue-grid').innerHTML.match(/class="product-card"/g) ?? []).length,
      initialPageCount,
    );
    assert.match(element('#catalogue-grid').innerHTML, /class="product-row__trigger"/);
    assert.doesNotMatch(element('#catalogue-grid').innerHTML, /class="product-image"|<img\b/);
    assert.equal(element('#catalogue-grid').dataset.view, 'visual');
    assert.match(catalogueSection(), /id="catalogue-grid" data-view="visual"/);
    assert.doesNotMatch(catalogueSection(), /data-catalogue-view/);
    assert.match(element('#catalogue-pagination').innerHTML, /Page 1 of \d+/);

    element('#catalogue-category').value = 'Smart Tech';
    handlers.get('#catalogue-category:change')();
    assert.equal(element('#catalogue-pagination').innerHTML, '');
    const smartTechCount = filterProducts('Smart Tech').length;
    assert.equal(
      element('#catalogue-count').textContent,
      `Showing 1–${smartTechCount} of ${smartTechCount} products`,
    );
    assert.equal(
      (element('#catalogue-grid').innerHTML.match(/class="product-card"/g) ?? []).length,
      smartTechCount,
    );
    assert.equal(
      (element('#catalogue-grid').innerHTML.match(/class="catalogue-placeholder"/g) ?? []).length,
      0,
    );
    assert.doesNotMatch(element('#catalogue-grid').innerHTML, /No visual matches for these filters/);
    element('#search').value = 'no match at all';
    handlers.get('#search:input')();
    assert.match(element('#catalogue-active-filters').innerHTML, /Clear all/);

    click('[data-clear-filters]', {});
    assert.equal(
      element('#catalogue-count').textContent,
      `Showing 1–${initialPageCount} of ${allProductCount} products`,
    );
    assert.match(element('#catalogue-pagination').innerHTML, /Page 1 of \d+/);
    navigateCatalogue({ view: 'list' });
    assert.equal(element('#catalogue-grid').dataset.view, 'visual');
    click('[data-category-link]', { dataset: { categoryLink: 'Sports Hijabs' } });
    const hijabProductCount = filterProducts('Sports Hijabs').length;
    assert.equal(
      element('#catalogue-count').textContent,
      `Showing 1–${hijabProductCount} of ${hijabProductCount} products`,
    );

    click('[data-product]', { dataset: { product: '10' } });
    assert.equal(element('#product-dialog').open, true);
    assert.match(element('#dialog-body').innerHTML, /fsd-image-placeholder/);
    assert.equal((element('#dialog-body').innerHTML.match(/data-catalogue-colourway-index/g) ?? []).length, 3);
    assert.equal((element('#dialog-body').innerHTML.match(/data-catalogue-image-index=/g) ?? []).length, 0);
    for (const image of products.find(p => p.id === 10).images) {
      assert.ok(!element('#dialog-body').innerHTML.includes(`src="${image.src}"`));
    }
    assert.doesNotMatch(element('#dialog-body').innerHTML, /design concept/i);
    assert.ok(element('#dialog-body').innerHTML.includes(priceInfo(products.find(p => p.id === 10)).value));
    assert.doesNotMatch(element('#dialog-body').innerHTML, /Confirmed list price/);

    const dialogBody = element('#dialog-body');
    const mainImage = { dataset: {}, closest() { return null; }, getAttribute() { return ''; } };
    const mainCaption = {};
    const selectorButtons = [0, 1, 2].map(() => ({ setAttribute() {} }));
    dialogBody.contains = () => true;
    const selectedColourway = { textContent: '' };
    const wishlistButton = { setAttribute() {}, querySelector() { return null; } };
    dialogBody.querySelector = selector => selector === '[data-catalogue-main-image]'
      ? mainImage
      : selector === '[data-catalogue-selected-colourway]' ? selectedColourway
        : selector === '[data-product-wishlist]' ? wishlistButton
          : selector === '[data-catalogue-main-caption]' ? mainCaption : null;
    dialogBody.querySelectorAll = () => selectorButtons;
    const changeColourway = (colourwayIndex, imageIndex) => {
      const input = {
        checked: true,
        dataset: {
          catalogueColourwayIndex: String(colourwayIndex),
          catalogueColourwayImageIndex: String(imageIndex),
        },
      };
      handlers.get('document:change')({
        target: {
          closest: selector => selector === 'input[data-catalogue-colourway-index]' ? input : null,
        },
      });
    };
    click('[data-product]', { dataset: { product: '34' } });
    const strikeProduct = products.find(product => product.id === 34);
    const strikeMarkup = element('#dialog-body').innerHTML;
    assert.match(strikeMarkup, /src="\/assets\/products\/strike-shorts-hero\.webp"/);
    assert.deepEqual(
      [...strikeMarkup.matchAll(/value="([^"]+)" data-product-size/g)].map(([, size]) => size),
      ['S', 'M', 'L', 'XL', 'XXL'],
    );
    assert.match(strikeMarkup, /£49\.99/);
    assert.equal((strikeMarkup.match(/data-catalogue-image-index=/g) ?? []).length, 11);
    assert.deepEqual(
      [...strikeMarkup.matchAll(/data-catalogue-colourway-index="(\d+)"\s+data-catalogue-colourway-image-index="(-?\d+)"/g)]
        .map(([, colourwayIndex, imageIndex]) => [Number(colourwayIndex), Number(imageIndex)]),
      [[0, 1], [1, 2], [2, 3], [3, 4]],
    );
    changeColourway(2, 3);
    assert.equal(mainImage.src, strikeProduct.images[3].src);
    assert.equal(mainCaption.textContent, strikeProduct.images[3].label);
    assert.equal(selectedColourway.textContent, 'Navy & Ice Blue');

    click('[data-product]', { dataset: { product: '74' } });
    const apexMarkup = element('#dialog-body').innerHTML;
    assert.match(apexMarkup, /class="product-detail-gallery[^"]*product-detail-gallery--placeholders"/);
    assert.match(apexMarkup, /FSD Apex High-Waisted Compression Leggings/);
    assert.match(apexMarkup, /£65\.00/);
    assert.equal((apexMarkup.match(/\bcatalogue-gallery-placeholder(?=[ "])/g) ?? []).length, 3);
    assert.match(apexMarkup, /Front Full View/);
    assert.match(apexMarkup, /Rear Contour View/);
    assert.match(apexMarkup, /Detail \/ Gold Crest &amp; Waistband/);
    assert.doesNotMatch(apexMarkup, /apex-leggings-(?:front|rear|detail)\.png/);
    const apexGallery = apexMarkup.match(/<section class="product-detail-media"[\s\S]*?<\/section>/)?.[0];
    assert.ok(apexGallery);
    assert.doesNotMatch(apexGallery, /<img\b/);

    handlers.get('#close-dialog:click')();
    const closeDeadline = Date.now() + 2000;
    while (element('#product-dialog').open && Date.now() < closeDeadline) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.equal(element('#product-dialog').open, false);
    click('[data-product]', { dataset: { product: '1' } });
    assert.match(element('#dialog-body').innerHTML, /fsd-image-placeholder/);
    assert.equal((element('#dialog-body').innerHTML.match(/data-catalogue-colourway-index/g) ?? []).length, 2);
    assert.equal((element('#dialog-body').innerHTML.match(/data-catalogue-image-index=/g) ?? []).length, 0);
    assert.match(element('#dialog-body').innerHTML, /Vintage indigo fading to jet black/);
    assert.match(element('#dialog-body').innerHTML, /Electric cobalt fading to jet black/);
    for (const id of [42, 45, 60, 61, 62, 63, 65]) {
      click('[data-product]', { dataset: { product: String(id) } });
      assert.doesNotMatch(element('#dialog-body').innerHTML, />\s*(?:CONCEPT|DRAFT|PREVIEW|PENDING REVIEW|PRIVATE VIEWING)\b/i);
      assert.doesNotMatch(element('#dialog-body').innerHTML, /Image status in master list|Development notes/);
      const mediaSection = element('#dialog-body').innerHTML
        .match(/<section class="product-detail-media"[\s\S]*?<\/section>/)?.[0];
      assert.ok(mediaSection);
      if (id === 42) {
        assert.match(mediaSection, /catalogue-variant-image-placeholder/);
        assert.match(mediaSection, /Navy\/Cyan/);
        assert.match(mediaSection, /src="\/products\/sports-hijab\/black-gold\/hero\.webp"/);
        assert.equal((mediaSection.match(/data-catalogue-image-index=/g) ?? []).length, 9);
        const coreHijab = products.find(product => product.id === 42);
        changeColourway(1, 0);
        assert.equal(mainImage.src, coreHijab.images[0].src);
        assert.equal(mainCaption.textContent, coreHijab.images[0].label);
        assert.equal(selectedColourway.textContent, 'Black/Gold');
      } else {
        assert.doesNotMatch(mediaSection, /<img\b/);
      }
    }
    click('[data-product]', { dataset: { product: '59' } });
    assert.doesNotMatch(element('#dialog-body').innerHTML, /Price at launch|£\d/);
    assert.doesNotMatch(element('#dialog-body').innerHTML, /£0|undefined|null/);

    click('[data-product]', { dataset: { product: '39' } });
    assert.match(element('#dialog-body').innerHTML, /data-product-specifications-root/);
    assert.doesNotMatch(element('#dialog-body').innerHTML, /Standalone athletic layer|ENGINEERING &amp; SPECIFICATIONS/i);

    click('[data-product]', { dataset: { product: '47' } });
    assert.match(element('#dialog-body').innerHTML, /Mid-Hip Modest Coverage \(Regular Tunic Length\)/);
    assert.match(element('#dialog-body').innerHTML, /Also appears as/);
    assert.doesNotMatch(element('#dialog-body').innerHTML, /identity to confirm/);
    click('[data-product]', { dataset: { product: '69' } });
    assert.match(element('#dialog-body').innerHTML, /<dt>Category<\/dt>/);
    assert.doesNotMatch(element('#dialog-body').innerHTML, /Price details pending confirmation|VISUAL ASSET \/ PENDING REVIEW/i);
    assert.doesNotMatch(element('#dialog-body').innerHTML, /Product specifications, set contents, pricing and availability are not confirmed|Design concept/i);
    assert.doesNotMatch(element('#dialog-body').innerHTML, /£699\.99|Complete 10–50kg set|32mm|data-bag-add/);
    click('[data-product]', { dataset: { product: '54' } });
    assert.match(element('#dialog-body').innerHTML, /5-Cutout/);
    assert.doesNotMatch(element('#dialog-body').innerHTML, /Not decided: bar weight/);
    const beforeHeldAttempt = element('#dialog-body').innerHTML;
    for (const id of [21, 36, 37, 53, 64, 68]) {
      click('[data-product]', { dataset: { product: String(id) } });
      assert.equal(element('#dialog-body').innerHTML, beforeHeldAttempt);
    }

    element('#catalogue-category').value = 'Gym Hardware and Accessories';
    handlers.get('#catalogue-category:change')();
    const hardwareProductCount = filterProducts('Gym Hardware and Accessories').length;
    const visibleHardwareCount = Math.min(12, hardwareProductCount);
    assert.equal(
      element('#catalogue-count').textContent,
      `Showing 1–${visibleHardwareCount} of ${hardwareProductCount} products`,
    );
    assert.doesNotMatch(element('#catalogue-grid').innerHTML, />\s*(?:CONCEPT|DRAFT|PREVIEW|PENDING REVIEW|PRIVATE VIEWING)\b/i);
    assert.doesNotMatch(element('#catalogue-grid').innerHTML, /No visual matches for these filters/);
    assert.match(element('#catalogue-grid').innerHTML, /VIEW DETAILS/);
    const renderedHardwareCards = [...element('#catalogue-grid').innerHTML.matchAll(/<article class="product-card">[\s\S]*?<\/article>/g)]
      .map(([markup]) => markup);
    for (const id of [69, 70, 71, 72]) {
      const previewCard = renderedHardwareCards.find(markup => markup.includes(`data-product="${id}"`));
      assert.ok(previewCard, `expected hardware visual preview ${id} in filtered results`);
      assert.doesNotMatch(previewCard, /Price details pending confirmation|VIEW VISUAL PREVIEW|CONCEPT \/ REVIEW ONLY/i);
      assert.doesNotMatch(previewCard, /£699\.99|£599\.99|£399\.99|£299\.99|ADD TO BAG|Complete 10–50kg set|Exact weight increments/);
    }
  } finally {
    delete globalThis.document;
  }
});

test('approved aliases find unified entries without merging distinct product lines', () => {
  for (const [alias, id] of [
    ['FSD Strike Training Short', 19],
    ['FSD Aeroforge Hybrid Training Short', 19],
    ['FSD Performance Training Shorts', 20],
    ['FSD CORE Everyday Sports Hijab', 42],
    ['FSD Performance Sports Hijab', 42],
    ['FSD Modest Longline Training Top / Tunic', 47],
    ['FSD Modest Longline Training Jacket', 48],
    ['FSD Women’s Training Trousers / Joggers', 50],
    ['FSD Signature Performance Sports Bag', 56],
    ['FSD CARRY Performance Sports Bag', 56],
    ['FSD Strike Terrain Combat Shorts - Olive/Bronze', 34],
  ]) assert.deepEqual(filterProducts('All', alias).map(p => p.id), [id]);

  assert.ok(products.some(p => p.id === 16 && p.confirmedPrice === 39.99));
  assert.ok(products.some(p => p.id === 38 && p.confirmedPrice === 39.99));
  assert.ok(products.some(p => p.id === 55 && p.confirmedPrice === 89.99));
  assert.ok(products.some(p => p.id === 56 && p.confirmedPrice === 95));
  assert.equal(filterProducts('All', 'STRIDE').length, 0);
  assert.equal(products.find(p => p.id === 19).confirmedPrice, 44.99);
  assert.equal(Object.hasOwn(products.find(p => p.id === 19), 'suggestedPrice'), false);
  assert.equal(products.find(p => p.id === 34).confirmedPrice, 49.99);
  assert.equal(products.find(p => p.id === 19).colourways, 'Black/Green, Black/Red, Black/Grey, Navy/Blue, Olive/Black, White/Green');
  assert.equal(products.find(p => p.id === 34).colourways,
    'Black & Gold; Charcoal & Electric Lime; Navy & Ice Blue; Olive & Cream');
});

test('approved category placements, coverage and palette exception are consistent', () => {
  for (const id of [16, 34]) {
    assert.ok(filterProducts('Combat and MMA').some(p => p.id === id));
    assert.ok(filterProducts('Men’s Performance and Training').some(p => p.id === id));
  }
  for (const id of [18, 38, 39, 40, 56, 57]) {
    assert.ok(filterProducts('Women’s Performance').some(p => p.id === id));
  }
  assert.ok(filterProducts('Accessories / Bags').some(p => p.id === 56));
  assert.ok(filterProducts('Gym Hardware and Accessories').some(p => p.id === 56));
  for (const id of [42, 43, 44, 45]) {
    assert.ok(filterProducts('Modest Activewear').some(p => p.id === id));
    assert.ok(filterProducts('Sports Hijabs').some(p => p.id === id));
  }
  assert.equal(products.find(p => p.id === 47).coverage, 'Mid-Hip Modest Coverage (Regular Tunic Length)');
  assert.match(products.find(p => p.id === 39).specifications, /Standalone athletic layer/);
  assert.ok(!filterProducts('Training Sets').some(p => p.id === 39));
  assert.equal(products.find(p => p.id === 35).confirmedPrice, 149.99);
  assert.match(products.find(p => p.id === 35).notes, /Approved forest-green palette exception/);
});

test('hardware prices buy complete approved set tiers without invented weight breakdowns', () => {
  const tiers = products.filter(p => p.id >= 69 && p.id <= 72);
  assert.equal(tiers.length, 4);
  assert.deepEqual(tiers.map(p => p.confirmedPrice), [699.99, 599.99, 399.99, 299.99]);
  for (const p of tiers) {
    assert.equal(Object.hasOwn(p, 'suggestedPrice'), false);
    assert.equal(p.priceBasis, 'Complete 10–50kg set.');
    assert.match(p.specificationStatus, /increments, quantities and total set weight pending/);
    assert.match(p.notes, /not evidence of manufactured materials or verified performance/);
    if ([69, 72].includes(p.id)) assert.deepEqual(p.images, []);
  }
  assert.equal(master.find(p => p.id === 21)['Merged into'], 19);
  assert.deepEqual(master.find(p => p.id === 53)['Replaced by'], tiers.map(p => p.id));
  assert.equal(products.find(p => p.id === 54).confirmedPrice, 349.99);
  assert.match(products.find(p => p.id === 54).specificationStatus, /Not decided/);
  assert.doesNotMatch(products.find(p => p.id === 54).alias, /Tri-Grip/);
});

test('the complete public page excludes held imagery while retaining internal source references', () => {
  const withheldImages = additional.gallery.filter(g => [64, 68].includes(galleryProductIds.get(g.url)));
  assert.equal(withheldImages.length, 2);
  assert.equal(additional.gallery.length, 76);
  assert.equal(galleryProducts.length, 74);
  for (const image of withheldImages) {
    assert.ok(existsSync(new URL(`../public${image.url}`, import.meta.url)));
    assert.ok(!galleryProducts.includes(image));
  }
  // Run the real entrypoint against a minimal DOM, with bundler-only syntax resolved.
  // This covers the entire composed page, not just isolated catalogue sections.
  const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')
    .replace(/^import .+;\r?\n/gm, '')
    .replace(/^export /gm, '')
    .replaceAll('import.meta.env.DEV', 'false');
  const elements = new Map();
  const document = {
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, {
        innerHTML: '', textContent: '', value: '',
        addEventListener() {}, setAttribute() {}, scrollIntoView() {}, focus() {},
      });
      return elements.get(selector);
    },
    addEventListener() {},
    querySelectorAll() { return []; },
  };
  globalThis.document = document;
  try {
    const dependencies = {
      siteMedia, imagePlaceholderMarkup, installImageErrorFallbacks,
      catalogueSection, initCatalogue, navigateCatalogue, products,
      collectionDivisions, renderCollectionShowcase, beyondProductSection, featuredInnovationsSection, houseConnectionSection, vipAccessSection,
      renderNavigationHeader, approvedFsdHeaderLogo: '/assets/website-shield-lockup-defence.png',
      FSD_STORY_PATH: '/story',
      ourStorySection, flagshipPageHashes, renderFlagshipPlaceholderPages,
      renderInnovationHubIndex,
      renderHardwareForgePreview: () => '',
      mountCollectionShowcase() {}, mountNavigation() {}, initFeaturedCarousel() {},
      initCatalogueNavigation() {}, showProduct() {}, mountClientBag() { return { addToBag() {} }; },
    };
    const renderPage = new Function(
      'document',
      ...Object.keys(dependencies),
      `${source}\nreturn { renderStorefrontHeader, renderStorefrontMarkup };`,
    )(document, ...Object.values(dependencies));
    const page = `${renderPage.renderStorefrontHeader()}${renderPage.renderStorefrontMarkup()}`;
    assert.doesNotMatch(page, />\s*(?:CONCEPT|DRAFT|PREVIEW|PENDING REVIEW|PRIVATE VIEWING)\b/i);
    assert.match(page, /id="catalogue-archive"/);
    const homepage = page.match(/<main id="home">([\s\S]*?)<\/main>/)?.[1] || '';
    assert.ok(homepage, 'the storefront homepage main landmark should render');
    assert.doesNotMatch(homepage, /SHOP \/ ALL PRODUCTS|id="catalogue-grid"|id="catalogue-archive"|id="search"|id="fsd-house-archive"|id="philosophy"|id="contact"/);
    assert.doesNotMatch(homepage, /Browse the catalogue/i);
    assert.match(homepage, /data-home-hero-slot/);
    const homeHero = readFileSync(new URL('../src/components/HomeHero.jsx', import.meta.url), 'utf8');
    assert.match(homeHero, /className="fsd-home-hero fsd-phase3-hero"/);
    const womensBanner = readFileSync(new URL('../src/components/WomensBanner.jsx', import.meta.url), 'utf8');
    assert.match(womensBanner, /className="fsd-modal-hero fsd-modal-hero--womens"/);
    assert.match(womensBanner, /siteMedia\.womensBanner/);
    assert.match(siteMedia.womensBanner.src, /womens-activewear-hero\.png/);
    assert.match(homepage, /class="fsd-showcase fsd-showcase--editorial"/);
    assert.match(homepage, /id="innovations"/);
    assert.match(homepage, /data-fsd-featured-carousel-slot/);
    assert.match(homepage, /id="beyond-fsd"/);
    assert.match(homepage, /id="brand-community"/);
    assert.doesNotMatch(homepage, /weighted skipping ropes/i);
    const sectionOrder = [
      homepage.indexOf('class="fsd-showcase fsd-showcase--editorial"'),
      homepage.indexOf('id="hardware-editorial"'),
      homepage.indexOf('id="innovations"'),
      homepage.indexOf('id="beyond-fsd"'),
      homepage.indexOf('id="brand-community"'),
    ];
    assert.ok(sectionOrder.every((position, index) => position >= 0 && (index === 0 || position > sectionOrder[index - 1])));
    assert.equal((homepage.match(/class="fsd-editorial-card /g) || []).length, 3);
    assert.match(homepage, /class="fsd-editorial-divider"/);
    assert.match(homepage, /id="hardware-editorial"/);
    assert.match(page, /<details class="showroom-archive showroom-archive--catalogue" id="catalogue-archive">[\s\S]*?<section class="shop" id="products"/);
    assert.doesNotMatch(page, /id="gallery-archive"|id="full-gallery"|DESIGN LIBRARY|IMAGE ARCHIVE/i);
    assert.doesNotMatch(page, /FSD PRODUCT DESIGN LIBRARY|THE FULL VISUAL EDIT|74 designs/i);
    assert.equal((page.match(/data-fsd-logo-slot=/g) || []).length, 2);
    const logoComponent = readFileSync(new URL('../src/brand/Logos.jsx', import.meta.url), 'utf8');
    assert.match(logoComponent, /website-shield-lockup-defence\.png/);
    assert.doesNotMatch(page, /brand-icon|brand-type/);
    assert.match(page, /Training technology and recovery\./);
    assert.match(page, /Capability is not a costume\.<br\/><span>It is a practice\.<\/span>/);
    assert.match(page, /AEROFORGE represents FSD’s direction in technical training apparel/);
    assert.doesNotMatch(page, /IN DEVELOPMENT|PRE-LAUNCH|FSD DEVELOPMENT ROADMAP/i);
    assert.doesNotMatch(page, /Sign up today/i);
    assert.doesNotMatch(page, /<form|type="email"/i);
    assert.ok(page.indexOf('data-home-hero-slot') < page.indexOf('class="fsd-showcase fsd-showcase--editorial"'));
    assert.ok(page.indexOf('class="fsd-showcase"') < page.indexOf('id="innovations"'));
    assert.ok(page.indexOf('id="innovations"') < page.indexOf('id="philosophy"'));
    assert.ok(page.indexOf('id="philosophy"') < page.indexOf('id="contact"'));
    assert.equal((page.match(/class="manifesto story-section"/g) || []).length, 1);
    assert.equal((page.match(/id="philosophy"/g) || []).length, 1);
    assert.doesNotMatch(page, /id="shell-campaign"/);
    assert.doesNotMatch(page, /STRIDE|Shilajit|Championship Belt|Ring Corner Post|add to cart|checkout/i);
    for (const image of withheldImages) {
      assert.ok(!page.includes(image.name));
      assert.ok(!page.includes(image.url));
    }
  } finally {
    delete globalThis.document;
  }
});
