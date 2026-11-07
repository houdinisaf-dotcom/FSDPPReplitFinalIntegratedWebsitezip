import test from 'node:test';
import assert from 'node:assert/strict';
import { galleryIndexesForVariant, imageColourwayIndex } from '../src/product-gallery-model.js';
import { crossfadeMappedImage, cancelMappedImageSwap } from '../src/catalogue-image-gallery.js';
import { products, productImagesForDisplay } from '../src/data/products.js';
import { renderProductDetailPage } from '../src/product-detail-page.js';
import { rotationFramesForProduct } from '../src/product-rotation-assets.js';
import { maxZoomForSource } from '../src/immersive-product-gallery.js';

test('full-screen zoom is capped by the source pixels and current fitted viewport', () => {
  assert.equal(maxZoomForSource(480, 640, 1200, 800), 1, 'small sources are not enlarged past native pixels');
  assert.equal(maxZoomForSource(2400, 3200, 1200, 800), 3, 'high-resolution sources retain the inspection ceiling');
  assert.equal(maxZoomForSource(1800, 1200, 1200, 900), 1.5, 'wide sources use the tighter fitted dimension');
  assert.equal(maxZoomForSource(0, 1200, 900, 900), 1, 'missing dimensions disable unsupported magnification');
});

test('gallery navigation keeps every mapped view inside the selected colourway', () => {
  const product = { colourways: 'Black; Sage Green' };
  const images = [
    { src: '/black-front', colourway: 'Black', label: 'Front' },
    { src: '/sage-front', colourway: 'Sage Green', label: 'Front' },
    { src: '/sage-rear', colourway: 'Sage Green', label: 'Rear' },
    { src: '/unknown', label: 'Unmapped view' },
    { src: '/sage-m', colourway: 'Sage Green', size: 'M' },
  ];
  assert.deepEqual(galleryIndexesForVariant(product, images, { colourway: 'Sage Green' }), [1, 2]);
  assert.deepEqual(galleryIndexesForVariant(product, images, { colourway: 'Sage Green', size: 'M' }), [1, 2, 4]);
  assert.equal(imageColourwayIndex(product, images[2]), 1, 'rear view must update the colourway, not only the first image');
  assert.deepEqual(galleryIndexesForVariant(product, images, { colourway: 'No approved image' }), []);
  assert.deepEqual(galleryIndexesForVariant({ colourways: 'Black' }, images.slice(0, 1)), [0]);
});

test('real FLEX mappings remain intact and missing rotation assets never produce a 360 advertisement', () => {
  const product = products.find(value => value.id === 75);
  const images = productImagesForDisplay(product);
  const indexes = galleryIndexesForVariant(product, images, { colourway: 'Sage Green' });
  assert.ok(indexes.length > 1);
  assert.ok(indexes.every(index => images[index].colourway === 'Sage Green'));
  assert.deepEqual(rotationFramesForProduct(43), []);
  const velocity = products.find(value => value.id === 43);
  const html = renderProductDetailPage({
    product: velocity, images: productImagesForDisplay(velocity), initialImageIndex: 0,
    galleryPlaceholders: [], colourways: ['Black / Gold'], colourwayImageIndexes: [0],
    sizes: [], price: { label: '', value: '£34.99' }, canPurchase: true,
  });
  assert.doesNotMatch(html, /data-product-rotation|360° product view|placeholder frames/i);
});

function imageFixture() {
  const created = [];
  const classes = () => {
    const values = new Set();
    return { add: (...names) => names.forEach(name => values.add(name)),
      remove: (...names) => names.forEach(name => values.delete(name)), contains: name => values.has(name) };
  };
  const stage = { isConnected: true, nodes: [], attributes: {},
    append(node) { this.nodes.push(node); node.parentElement = this; node.isConnected = true; },
    setAttribute(key, value) { this.attributes[key] = value; },
    removeAttribute(key) { delete this.attributes[key]; } };
  class TestImage extends EventTarget {
    constructor() {
      super(); this.attributes = []; this.dataset = {}; this.classList = classes();
      this.isConnected = false; this.complete = false; this.naturalWidth = 0;
      created.push(this);
    }
    setAttribute() {}
    remove() { this.isConnected = false; stage.nodes = stage.nodes.filter(value => value !== this); }
  }
  const doc = { defaultView: { Image: TestImage, matchMedia: () => ({ matches: true }) } };
  const current = new TestImage();
  current.ownerDocument = doc;
  current.className = 'mapped-gallery-image';
  stage.append(current);
  return { stage, current, created };
}

test('out-of-order image loads cannot overwrite the latest selected colourway', () => {
  const { stage, current, created } = imageFixture();
  crossfadeMappedImage(current, '/black', 'Black', null, { variant: 'Black' });
  const oldRequest = created.at(-1);
  crossfadeMappedImage(current, '/sage', 'Sage', null, { variant: 'Sage Green', retainPrevious: false });
  const latest = created.at(-1);
  assert.ok(current.classList.contains('mapped-gallery-image--hidden'), 'old colour hidden while replacement loads');
  latest.dispatchEvent(new Event('load'));
  oldRequest.dispatchEvent(new Event('load'));
  assert.deepEqual(stage.nodes, [latest]);
  assert.equal(latest.dataset.fsdImageVariant, 'Sage Green');
  assert.equal(stage.attributes['aria-busy'], undefined);
});

test('a selected thumbnail updates the main image source before its load completes', () => {
  const { stage, current } = imageFixture();
  current.src = '/front';
  current.alt = 'Front view';
  let failures = 0;

  crossfadeMappedImage(current, '/rear', 'Rear view', () => failures++, {
    variant: 'Black',
    immediate: true,
  });
  assert.equal(current.src, '/rear');
  assert.equal(current.alt, 'Rear view');
  assert.equal(current.dataset.fsdImageVariant, 'Black');
  assert.equal(stage.attributes['aria-busy'], 'true');

  crossfadeMappedImage(current, '/detail', 'Fabric detail', () => failures++, {
    variant: 'Black',
    immediate: true,
  });
  assert.equal(current.src, '/detail', 'a later click immediately supersedes a pending image');
  current.dispatchEvent(new Event('load'));
  assert.equal(stage.attributes['aria-busy'], undefined);
  assert.equal(failures, 0);
});

test('cancelling a swap for a missing variant blocks late images and late errors', () => {
  const { stage, current, created } = imageFixture();
  let failures = 0;
  crossfadeMappedImage(current, '/pending', 'Pending', () => failures++);
  const incoming = created.at(-1);
  cancelMappedImageSwap(current);
  incoming.dispatchEvent(new Event('load'));
  incoming.dispatchEvent(new Event('error'));
  assert.deepEqual(stage.nodes, [current]);
  assert.equal(failures, 0);
});
