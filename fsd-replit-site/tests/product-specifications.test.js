import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import test from 'node:test';
import { getVerifiedProductSpecifications, normalizeVerifiedSpecifications } from '../src/catalogue-data.js';
import { ProductSpecificationsPanel, ProductSpecificationsView } from '../src/ProductSpecificationsView.js';

test('product specifications require an exact active product and an explicit verified record', () => {
  assert.equal(getVerifiedProductSpecifications(9999), null);
  assert.equal(getVerifiedProductSpecifications('not-a-product'), null);
  assert.equal(getVerifiedProductSpecifications(39), null);
  assert.equal(getVerifiedProductSpecifications(69), null);
  assert.equal(getVerifiedProductSpecifications(73)?.materials.length, 3);
  assert.equal(normalizeVerifiedSpecifications({
    approvalStatus: 'pending',
    materials: ['Unverified material'],
  }), null);

  assert.equal(renderToStaticMarkup(createElement(ProductSpecificationsView, { productId: 9999 })), '');
  assert.equal(renderToStaticMarkup(createElement(ProductSpecificationsView, { productId: 39 })), '');
  assert.match(
    renderToStaticMarkup(createElement(ProductSpecificationsView, { productId: 73 })),
    /Four-way mechanical stretch|88% Performance Polyester/,
  );
});

test('only non-empty fields in a verified record are rendered', () => {
  const specifications = normalizeVerifiedSpecifications({
    approvalStatus: 'verified',
    materials: ['88% recycled polyester', '', 42],
    benefits: ['Moisture-wicking fabric'],
    technicalSpecs: {
      composition: '88% recycled polyester / 12% elastane',
      fit: '',
      care: 'Machine wash cold',
      unapprovedField: 'Do not render',
    },
  });
  const markup = renderToStaticMarkup(createElement(ProductSpecificationsPanel, { specifications }));

  assert.match(markup, /ENGINEERING &amp; SPECIFICATIONS/);
  assert.match(markup, /88% recycled polyester/);
  assert.match(markup, /Moisture-wicking fabric/);
  assert.match(markup, /Machine wash cold/);
  assert.doesNotMatch(markup, /Do not render|Unverified material/);
  assert.doesNotMatch(markup, /Fit profile:/);
});
