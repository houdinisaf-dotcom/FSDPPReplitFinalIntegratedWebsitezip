import assert from 'node:assert/strict';
import test from 'node:test';
import { FSD_HOUSE_PAGE_PATH, resolveFsdRoute, routeFromHash, routeFromLocation } from '../src/react-router.js';

test('collection menu selections resolve to real catalogue targets', () => {
  assert.deepEqual(resolveFsdRoute({
    menu: { id: 'collections' },
    group: { id: 'womens-modest-combat' },
  }), {
    view: 'collection',
    target: 'womens-modest-combat',
  });

  assert.deepEqual(resolveFsdRoute({
    menu: { id: 'collections' },
    group: { id: 'womens-modest-combat' },
    item: { id: 'performance-hijabs', kind: 'subcategory' },
  }), {
    view: 'collection',
    target: 'performance-hijabs',
  });
});

test('product and development-only preview selections retain their exact targets', () => {
  assert.deepEqual(resolveFsdRoute({
    menu: { id: 'hardware' },
    group: { id: 'strength-equipment' },
    item: { id: 'apex-gloves', record: { id: 81 } },
  }), {
    view: 'product',
    target: '81',
  });

  assert.deepEqual(resolveFsdRoute({
    menu: { id: 'hardware' },
    group: { id: 'strength-equipment' },
    item: { id: 'weighted-rope', kind: 'draft-product', href: '/__catalogue-preview/weighted-skipping-rope/' },
  }), {
    view: 'preview',
    target: '/__catalogue-preview/weighted-skipping-rope/',
  });
});

test('section destinations map to their existing FSD sections', () => {
  assert.deepEqual(routeFromHash('#universe'), { view: 'universe', target: 'global' });
  assert.deepEqual(routeFromHash('#hardware-editorial'), { view: 'hardware', target: 'hardware' });
  assert.deepEqual(routeFromHash('#innovations'), { view: 'bio-lab', target: 'bio-lab' });
  assert.deepEqual(routeFromHash('#philosophy'), { view: 'story', target: 'our-story' });
  assert.deepEqual(routeFromHash('#contact'), { view: 'private-access', target: 'contact' });
  assert.deepEqual(routeFromHash('#products'), { view: 'collection', target: 'all-products' });
  assert.deepEqual(routeFromHash('#clothing-lines'), { view: 'collection', target: 'clothing-lines' });
  assert.deepEqual(routeFromHash('#line-aeroforge'), { view: 'collection', target: 'line-aeroforge' });
  assert.deepEqual(routeFromHash('#line-scorpion-series'), { view: 'collection', target: 'line-scorpion-series' });
});

test('Clothing Lines SHOP destinations resolve to dedicated collection routes', () => {
  assert.deepEqual(resolveFsdRoute({
    menu: { id: 'collections' },
    group: { id: 'clothing-lines', href: '#clothing-lines' },
  }), { view: 'collection', target: 'clothing-lines' });
  assert.deepEqual(resolveFsdRoute({
    menu: { id: 'collections' },
    group: { id: 'clothing-lines' },
    item: {
      id: 'clothing-line-aeroforge',
      kind: 'clothing-line',
      href: '/collections/aeroforge',
    },
  }), { view: 'collection', target: 'line-aeroforge' });
  assert.deepEqual(routeFromLocation({ pathname: '/collections/flex', hash: '' }), {
    view: 'collection',
    target: 'line-flex',
  });
  assert.deepEqual(routeFromLocation({ pathname: '/collections/men', hash: '' }), {
    view: 'collection',
    target: 'men',
  });
  assert.deepEqual(routeFromLocation({ pathname: '/collections/women', hash: '' }), {
    view: 'collection',
    target: 'women',
  });
  assert.deepEqual(routeFromLocation({ pathname: '/', hash: '#line-aeroforge' }), {
    view: 'collection',
    target: 'line-aeroforge',
  });
});

test('the brand story has a direct path route while retaining hash-route compatibility', () => {
  assert.deepEqual(routeFromLocation({ pathname: '/story', hash: '' }), {
    view: 'story',
    target: 'our-story',
  });
  assert.deepEqual(routeFromLocation({ pathname: '/story/', hash: '' }), {
    view: 'story',
    target: 'our-story',
  });
  assert.deepEqual(routeFromLocation({ pathname: '/story', hash: '#universe' }), {
    view: 'universe',
    target: 'global',
  });
  assert.deepEqual(resolveFsdRoute({
    menu: { id: 'house' },
    group: { id: 'our-story', href: '/story' },
    item: { href: '/story' },
  }), {
    view: 'story',
    target: 'our-story',
  });
});

test('legacy House hashes no longer resolve to a shared House-page view', () => {
  assert.deepEqual(routeFromLocation({ pathname: FSD_HOUSE_PAGE_PATH, hash: '' }), {
    view: 'home',
    target: null,
  });
  assert.deepEqual(resolveFsdRoute({
    menu: { id: 'house' },
    group: { id: 'our-story', href: '/story' },
    item: { kind: 'destination', href: '/story' },
  }), {
    view: 'story',
    target: 'our-story',
  });
  assert.deepEqual(resolveFsdRoute({
    menu: { id: 'house' },
    group: { id: 'community-culture' },
    item: { kind: 'destination', href: '/community-co-creation.html' },
  }), {
    view: 'home',
    target: null,
  });
});

test('universe and house collections preserve the selected FSD destination', () => {
  assert.deepEqual(resolveFsdRoute({
    menu: { id: 'universe' },
    group: { id: 'universe-bio-lab' },
    item: { id: 'universe-explore-bio-lab', sourceDivisionId: 'bio-lab' },
  }), {
    view: 'universe',
    target: 'universe-explore-bio-lab',
  });

  assert.deepEqual(resolveFsdRoute({
    menu: { id: 'house' },
    group: { id: 'flagships', sourceDivisionId: 'global' },
  }), {
    view: 'universe',
    target: 'flagships',
  });
});
