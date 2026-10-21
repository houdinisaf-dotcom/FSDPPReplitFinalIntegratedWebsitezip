import test from 'node:test';
import assert from 'node:assert/strict';
import { products, priceInfo } from '../src/catalogue-data.js';
import { renderProductStory } from '../src/product-story.js';
import { renderMappedImageChoices } from '../src/product-card-media.js';

test('flagship storytelling uses only the eligible product and its approved image/facts', () => {
  const product = products.find(item => item.id === 43);
  const story = renderProductStory(product, priceInfo(product));
  for (const fact of [product.name, product.colourways, product.collection, product.category, '£29.99']) {
    assert.ok(story.includes(fact));
  }
  assert.match(story, /fsd-velocity-performance-sports-hijab\.jpg/);
  assert.match(story, /loading="lazy"/);
  assert.match(story, /not available to purchase/);
  assert.doesNotMatch(story, /thumbhole|flatlock|raglan|certified|breathable|mesh ventilation|buy now|add to cart/i);
  for (const other of products.filter(item => item.id !== 43)) {
    assert.equal(renderProductStory(other, priceInfo(other)), '');
  }
});

test('story eligibility requires approved imagery and escapes source fields', () => {
  const original = products.find(item => item.id === 43);
  assert.equal(renderProductStory({ ...original, images: [] }, priceInfo(original)), '');
  const story = renderProductStory({
    ...original, name: '<script>name</script>', category: '<img src=x>', colourways: 'Blue & Gold',
  }, priceInfo(original));
  assert.match(story, /&lt;script&gt;name&lt;\/script&gt;/);
  assert.match(story, /&lt;img src=x&gt;/);
  assert.match(story, /Blue &amp; Gold/);
  assert.doesNotMatch(story, /<script>|<img src=x>/);
});

test('card image choices are limited to existing mapped photos, not invented variants', () => {
  for (const product of products) {
    const choices = renderMappedImageChoices(product.images);
    if (product.images.length < 2) {
      assert.equal(choices, '');
    } else {
      assert.equal((choices.match(/data-card-image-index=/g) || []).length, product.images.length);
      for (const image of product.images) assert.ok(choices.includes(image.src));
      assert.doesNotMatch(choices, /stock|sold out|size guide|add to cart|checkout/i);
    }
  }
});
