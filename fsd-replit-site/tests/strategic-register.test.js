import test from 'node:test';
import assert from 'node:assert/strict';
import sourceCatalogue from '../src/data/master-product-register.json' with { type: 'json' };
import { products as publicProducts } from '../src/catalogue-data.js';
import { canAddToBag } from '../src/bag.js';
import {
  masterProductRegister,
  variantSkuPolicy,
  buildVariantSku,
  assertUniqueVariantSkus,
} from '../src/data/product-register.js';
import strategicConceptData from '../src/data/strategic-concepts.json' with { type: 'json' };
import {
  STRATEGIC_CONCEPTS,
  conceptsForPlacement,
  renderStrategicConceptIndex,
} from '../src/strategic-concepts.js';
import { primaryNavigation, createNavigationModel } from '../src/site-navigation.js';
import { renderStrategicConceptDetail } from '../src/flagship-pages.js';
import { products as registeredPublicProducts } from '../src/data/products.js';

test('the supplied portfolio register preserves FSD-001 through FSD-086 exactly', () => {
  const expectedIds = Array.from({ length: 86 }, (_, index) => `FSD-${String(index + 1).padStart(3, '0')}`);
  assert.equal(masterProductRegister.products.length, 86);
  assert.deepEqual(masterProductRegister.products.map(product => product.id), expectedIds);
  assert.equal(new Set(masterProductRegister.products.map(product => product.id)).size, 86);
  assert.deepEqual(masterProductRegister, sourceCatalogue);
  assert.equal(masterProductRegister.categories.reduce((sum, category) => sum + category.product_count, 0), 86);
  assert.ok(masterProductRegister.products.every(product => product.on_sale_verified === false));
  assert.equal(masterProductRegister.products.filter(product => Object.hasOwn(product, 'sku')).length, 0);
  assert.equal(masterProductRegister.products.filter(product => Array.isArray(product.variants)).length, 0);
});

test('the planning register stays separate from public shop products and does not enable checkout', () => {
  assert.equal(masterProductRegister.products.length, 86);
  assert.equal(registeredPublicProducts.length, 73);
  assert.equal(publicProducts.some(canAddToBag), false);
  assert.equal(variantSkuPolicy.status, 'No variant SKUs assigned');
  assert.match(variantSkuPolicy.reason, /no structured variant or SKU fields/i);
});

test('variant SKU generation is deterministic and rejects collisions', () => {
  const first = buildVariantSku('FSD-001', ['Black / Gold', 'Medium']);
  const second = buildVariantSku('FSD-001', ['Black / Gold', 'Large']);
  assert.equal(first, 'FSD-001-BLACK-GOLD-MEDIUM');
  assert.notEqual(first, second);
  assert.equal(assertUniqueVariantSkus([first, second]), true);
  assert.throws(() => assertUniqueVariantSkus([first, first]), /Duplicate variant SKU/);
  assert.throws(() => buildVariantSku('FSD-087', 'Black'), /documented FSD master product ID/);
  assert.throws(() => buildVariantSku('FSD-001', []), /explicit variant key/);
});

test('the approved twelve concepts map to their specified primary divisions and cross-links', () => {
  assert.equal(strategicConceptData.concepts.length, 12);
  assert.equal(STRATEGIC_CONCEPTS.length, 12);
  assert.equal(new Set(STRATEGIC_CONCEPTS.map(concept => concept.id)).size, 12);
  assert.deepEqual(STRATEGIC_CONCEPTS.map(concept => concept.title), [
    'Autonomous Pop-Ups & Predictive Stock',
    'Civic Response Auxiliary',
    'Adaptive Technical Fabrics',
    'FSD Circular Trade-In Programme',
    'Community Co-Creation',
    'Genetic & Microbiome Personalisation',
    'Local Micro-Manufacturing Workshop',
    'Mobile Testing Labs',
    'FSD Pods',
    'Performance-Linked Partnerships',
    'Smart Apparel',
    'Tactical Shield Membership',
  ]);
  assert.ok(STRATEGIC_CONCEPTS.every(concept => concept.primaryDivision && concept.primarySection && concept.href));
  assert.ok(STRATEGIC_CONCEPTS.every(concept => concept.summary));
  const geneticResearch = STRATEGIC_CONCEPTS.find(concept => concept.id === 'genetic-microbiome-personalisation');
  assert.equal(geneticResearch.primaryDivision, 'BIO-LAB™');
  assert.equal(geneticResearch.primarySection, 'Personalisation Research');
  assert.deepEqual(geneticResearch.crossLinks, [{
    division: 'BIO-LAB™',
    section: 'INNOVATION HUB',
    href: '/#innovation-hub',
  }]);
  assert.match(strategicConceptData.statusPolicy, /represented as live unless separately verified/i);
  assert.deepEqual(primaryNavigation.map(item => item.label), [
    'SHOP', 'UNIVERSE', 'BIO-LAB™', 'HARDWARE', 'THE HOUSE', 'PRIVATE ACCESS',
  ]);
});

test('the directory and pages keep every mapped concept discoverable without opening commerce', () => {
  const index = renderStrategicConceptIndex();
  assert.equal((index.match(/data-strategic-concept=/g) || []).length, 12);
  for (const concept of STRATEGIC_CONCEPTS) {
    assert.match(index, new RegExp(`data-strategic-concept="${concept.id}"`));
    assert.match(index, new RegExp(`href="${concept.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  }
  assert.match(index, /Also in: BIO-LAB™ \/ INNOVATION HUB/);
  const civicPage = renderStrategicConceptDetail('civic-response-auxiliary');
  assert.match(civicPage, /Civic Response Auxiliary/);
  assert.match(civicPage, /No programme, emergency-response service, training schedule, or partnership is represented as available/);
  assert.match(civicPage, /Approved community-preparedness editorial photography is required/);
  assert.match(civicPage, /\[ASSET PENDING\]/);
  const tacticalPage = renderStrategicConceptDetail('tactical-shield-membership');
  assert.match(tacticalPage, /REGISTRATION NOT OPEN/);
  assert.doesNotMatch(tacticalPage, /<form\b|JOIN NOW|ADD TO BAG|CHECKOUT/i);
});

test('each strategic concept has a navigation destination in its mapped primary menu', () => {
  const menus = createNavigationModel();
  const findItem = (menuId, title) => menus.find(menu => menu.id === menuId)
    ?.groups.flatMap(group => group.items || []).find(item => item.title === title);

  for (const concept of STRATEGIC_CONCEPTS) {
    const menuId = ({
      SHOP: 'collections',
      UNIVERSE: 'universe',
      'BIO-LAB™': 'bio-lab',
      'THE HOUSE': 'house',
      'PRIVATE ACCESS': 'private-access',
    })[concept.primaryDivision];
    assert.ok(menuId, `${concept.title} maps to a primary navigation menu`);
    const item = menus.find(menu => menu.id === menuId)
      ?.groups.flatMap(group => group.items || [])
      .find(candidate => candidate.title.toLocaleLowerCase() === concept.title.toLocaleLowerCase());
    assert.ok(item, `${concept.title} is discoverable in ${concept.primaryDivision}`);
  }
});

test('the specified strategic cross-links land in the existing division sections', () => {
  assert.deepEqual(conceptsForPlacement('THE HOUSE', 'Flagships').map(concept => concept.id), [
    'autonomous-popups-predictive-stock',
    'fsd-pods',
  ]);
  assert.deepEqual(conceptsForPlacement('SHOP', 'Technical Innovation').map(concept => concept.id), [
    'adaptive-technical-fabrics',
    'smart-apparel',
  ]);
  assert.deepEqual(conceptsForPlacement('THE HOUSE', 'Community & Culture').map(concept => concept.id), [
    'civic-response-auxiliary',
    'fsd-circular-trade-in',
    'tactical-shield-membership',
  ]);
  assert.deepEqual(conceptsForPlacement('BIO-LAB™', 'INNOVATION HUB').map(concept => concept.id), [
    'community-co-creation',
    'genetic-microbiome-personalisation',
  ]);
  assert.deepEqual(conceptsForPlacement('UNIVERSE', 'Community Development').map(concept => concept.id), [
    'community-co-creation',
    'performance-linked-partnerships',
  ]);
});
