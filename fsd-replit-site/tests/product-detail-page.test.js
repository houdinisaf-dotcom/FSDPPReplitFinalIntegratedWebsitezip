import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../src/catalogue-data.js';
import { productImagesForDisplay } from '../src/data/products.js';
import {
  editorialGalleryPrimaryImageIndex,
  editorialGallerySecondaryImageIndex,
  productSizeOptions,
  renderProductDetailPage,
  renderSizeGuideDialog,
} from '../src/product-detail-page.js';

const productFixture = {
  ...products.find(product => product.id === 43),
  name: 'FSD Test Leggings',
  category: "Women's / Performance Bottoms",
  description: 'A supplied catalogue description.',
  sizes: 'XS; S; M; L; XL; XXL',
  confirmedPrice: 65,
};

test('editorial product galleries pair approved front and rear photos for the selected colourway', () => {
  const product = products.find(item => item.id === 18);
  const images = productImagesForDisplay(product);

  const frontIndex = editorialGalleryPrimaryImageIndex(
    images,
    0,
    'White / Green',
    true,
  );
  const markup = renderProductDetailPage({
    product,
    images,
    initialImageIndex: frontIndex,
    galleryPlaceholders: [],
    colourways: ['White / Green', 'All Black'],
    colourwayImageIndexes: [0, 12],
    sizes: productSizeOptions(product),
    price: { label: '', value: '£39.99' },
    canPurchase: false,
  });

  assert.match(images[frontIndex].label, /Front product view/);
  assert.match(markup, /data-catalogue-main-caption[^>]*>White \/ Green \/ Front product view/);
  assert.match(markup, /data-catalogue-secondary-caption[^>]*>White \/ Green \/ Rear product view/);
});

test('editorial gallery selection retains the mapped default when a same-variant front/rear pair is absent', () => {
  const images = [
    { label: 'White / Green / Lifestyle hero', colourway: 'White / Green', src: '/hero.webp' },
    { label: 'All Black / Front product view', colourway: 'All Black', src: '/black-front.webp' },
  ];

  assert.equal(editorialGalleryPrimaryImageIndex(images, 0, 'White / Green', true), 0);
});

test('detail pages pair exact front and back photos even when labels omit the word product', () => {
  const product = products.find(item => item.id === 2);
  const images = productImagesForDisplay(product);
  const variant = 'Luminous aqua / deep teal navy / white';
  const frontIndex = editorialGalleryPrimaryImageIndex(images, 0, variant, false, true);

  assert.match(images[frontIndex].label, /Front view/);
  assert.equal(
    editorialGallerySecondaryImageIndex(images, frontIndex, variant, false, true),
    images.findIndex(image => /Back view/.test(image.label)),
  );

  const markup = renderProductDetailPage({
    product,
    images,
    initialImageIndex: frontIndex,
    galleryPlaceholders: [],
    colourways: [variant],
    colourwayImageIndexes: [frontIndex],
    sizes: productSizeOptions(product),
    price: { label: '', value: '' },
    canPurchase: false,
  });
  assert.match(markup, /data-catalogue-main-caption[^>]*>Luminous aqua[^<]*Front view/);
  assert.match(markup, /data-catalogue-secondary-caption[^>]*>Luminous aqua[^<]*Back view/);
});

test('featured products without approved photos retain named front and back placeholders', () => {
  for (const product of [products.find(item => item.id === 1), products.find(item => item.id === 10)]) {
    const markup = renderProductDetailPage({
      product,
      images: [],
      initialImageIndex: -1,
      galleryPlaceholders: [],
      colourways: [],
      colourwayImageIndexes: [],
      sizes: productSizeOptions(product),
      price: { label: '', value: '' },
      canPurchase: false,
    });

    assert.equal((markup.match(/product-detail-image-stage|product-detail-gallery__secondary-stage/g) || []).length, 2);
    assert.match(markup, /FRONT VIEW — IMAGE PENDING/);
    assert.match(markup, /BACK VIEW — IMAGE PENDING/);
  }
});

test('Quick View keeps its original single-image fallback', () => {
  const product = products.find(item => item.id === 2);
  const images = productImagesForDisplay(product).slice(0, 1);
  const markup = renderProductDetailPage({
    product,
    images,
    initialImageIndex: 0,
    galleryPlaceholders: [],
    colourways: [],
    colourwayImageIndexes: [],
    sizes: [],
    price: { label: '', value: '' },
    canPurchase: false,
    quickView: true,
  });

  assert.match(markup, /product-detail-page--quick-view/);
  assert.doesNotMatch(markup, /data-catalogue-secondary-panel/);
});

test('mapped CORE hijab photos can form a same-colourway front/rear detail pair', () => {
  const product = products.find(item => item.id === 42);
  const images = productImagesForDisplay(product);
  const heroIndex = images.findIndex(image => /Hero portrait/.test(image.label));
  const frontIndex = editorialGalleryPrimaryImageIndex(images, heroIndex, 'Black/Gold', true, true);

  assert.match(images[frontIndex].label, /Front portrait/);
  const markup = renderProductDetailPage({
    product,
    images,
    initialImageIndex: frontIndex,
    galleryPlaceholders: [],
    colourways: ['Black/Gold', 'Black/White'],
    colourwayImageIndexes: [heroIndex, -1],
    sizes: productSizeOptions(product),
    price: { label: '', value: '' },
    canPurchase: false,
  });
  assert.match(markup, /data-catalogue-secondary-caption[^>]*>Black\/Gold \/ Rear view/);
});

test('curated Velocity lifestyle hero remains first rather than being replaced by portrait views', () => {
  const product = products.find(item => item.id === 43);
  const images = productImagesForDisplay(product);

  assert.equal(images[0].src, '/assets/products/velocity-hijab-main-listing.jpg');
  assert.equal(editorialGalleryPrimaryImageIndex(images, 0, 'Black / Gold'), 0);
});

test('product detail markup includes accessible size choices and leaves unconfirmed fields blank', () => {
  assert.deepEqual(productSizeOptions(productFixture), ['XS', 'S', 'M', 'L', 'XL', 'XXL']);

  const markup = renderProductDetailPage({
    product: productFixture,
    images: [{ label: 'Front view', src: '/product-front.jpg' }],
    initialImageIndex: 0,
    galleryPlaceholders: [],
    colourways: ['Obsidian Black', 'Sage Green'],
    colourwayImageIndexes: [-1, -1],
    sizes: productSizeOptions(productFixture),
    price: { label: '', value: '£65.00' },
    canPurchase: true,
  });

  assert.match(markup, /Choose a size/);
  assert.match(markup, /data-product-size/);
  assert.doesNotMatch(markup, /Availability by size:/);
  assert.match(markup, /data-size-guide/);
  assert.match(markup, /data-product-quantity/);
  assert.match(markup, /max="99"/);
  assert.match(markup, /class="product-detail-summary">A supplied catalogue description\./);
  assert.match(markup, /Front view/);
  assert.match(markup, /alt="FSD Test Leggings — Front view"/);
  assert.doesNotMatch(markup, /Verified catalogue values are shown where recorded/);
  assert.doesNotMatch(markup, /UK delivery: \[TO CONFIRM\]|Dispatch: \[TO CONFIRM\]|Returns: \[TO CONFIRM\]/);
  assert.doesNotMatch(markup, /\[TO CONFIRM\] Product details|\[TO CONFIRM\] Material composition|\[TO CONFIRM\] Technical specifications/);
  assert.match(markup, /href="\/delivery-returns\.html"/);
  assert.match(markup, /<summary>Product Details<\/summary>/);
  assert.match(markup, /<summary>Size &amp; Fit<\/summary>/);
  assert.match(markup, /<summary>Shipping &amp; Returns<\/summary>/);
});

test('product JSON-LD omits offers until availability has a verified value', () => {
  const markup = renderProductDetailPage({
    product: productFixture,
    images: [{ label: 'Front view', src: '/product-front.jpg' }],
    initialImageIndex: 0,
    galleryPlaceholders: [],
    colourways: ['Obsidian Black'],
    colourwayImageIndexes: [-1],
    sizes: productSizeOptions(productFixture),
    price: { label: '', value: '£65.00' },
    canPurchase: true,
  });
  const json = markup.match(/<script type="application\/ld\+json" data-product-jsonld>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(json);
  const schema = JSON.parse(json);
  assert.equal(schema['@type'], 'ProductGroup');
  assert.equal(schema.name, 'FSD Test Leggings');
  assert.deepEqual(schema.size, ['XS', 'S', 'M', 'L', 'XL', 'XXL']);
  assert.equal('offers' in schema, false);
});

test('notification state collects no email when no notification provider is connected', () => {
  const markup = renderProductDetailPage({
    product: productFixture,
    images: [],
    initialImageIndex: 0,
    galleryPlaceholders: ['Front view'],
    colourways: [],
    colourwayImageIndexes: [],
    sizes: [],
    price: { label: '', value: '' },
    canPurchase: false,
  });
  assert.match(markup, /Email notifications are not connected\. No email is collected/);
  assert.match(markup, /<button class="product-detail-notify__button" type="button" data-product-notify-primary disabled aria-disabled="true"/);
  assert.match(markup, /Notify me when available<\/button>/);
  assert.match(markup, /class="product-detail-sticky product-detail-sticky--notify" data-sticky-add-bar hidden/);
  assert.match(markup, /data-sticky-notify disabled aria-disabled="true"/);
  assert.doesNotMatch(markup, /type="email"/);
  assert.doesNotMatch(markup, /data-bag-add=/);
  assert.doesNotMatch(markup, /data-product-quantity/);
});

test('Breeze makes unconfirmed stock and fulfilment details explicit without availability actions', () => {
  const product = products.find(item => item.id === 73);
  const markup = renderProductDetailPage({
    product,
    images: productImagesForDisplay(product),
    initialImageIndex: 0,
    galleryPlaceholders: [],
    colourways: product.colourways.split(';').map(value => value.trim()),
    colourwayImageIndexes: [],
    sizes: productSizeOptions(product),
    price: { label: '', value: '£145.00' },
    canPurchase: false,
  });
  const schemaText = markup.match(/<script type="application\/ld\+json" data-product-jsonld>([\s\S]*?)<\/script>/)?.[1];
  const schema = JSON.parse(schemaText);

  assert.match(markup, /Pre-launch: availability is not confirmed\. Stock by colourway and size, dispatch timing, delivery terms, and returns terms are not confirmed\./);
  assert.doesNotMatch(markup, /Notify me when available|data-bag-add=|data-sticky-add-bar/);
  assert.equal('sku' in schema, false);
  assert.equal('offers' in schema, false);
});

test('related products stay within the same category and audience', () => {
  const product = products.find(item => item.id === 60);
  const markup = renderProductDetailPage({
    product,
    images: [],
    initialImageIndex: 0,
    galleryPlaceholders: [],
    colourways: [],
    colourwayImageIndexes: [],
    sizes: [],
    price: { label: '', value: '' },
    canPurchase: false,
  });

  assert.match(markup, /Related products/);
  assert.match(markup, /data-related-product="59"/);
  assert.doesNotMatch(markup, /data-related-product="1"/);
});

test('product size guides do not expose generic or unconfirmed measurement tables', () => {
  const guide = renderSizeGuideDialog(productFixture, productSizeOptions(productFixture));
  assert.match(guide, /data-size-guide-status="CONTENT PENDING"/);
  assert.match(guide, /Product-specific measurements are not available for this item yet\./);
  assert.doesNotMatch(guide, /\[TO CONFIRM\]|<table|View the full size guide/);
});

test('Breeze size guidance shows only the confirmed range and makes missing fit data clear', () => {
  const product = products.find(item => item.id === 73);
  const guide = renderSizeGuideDialog(product);
  const markup = renderProductDetailPage({
    product,
    images: productImagesForDisplay(product),
    initialImageIndex: 0,
    galleryPlaceholders: [],
    colourways: [],
    colourwayImageIndexes: [],
    sizes: productSizeOptions(product),
    price: { label: '', value: '£145.00' },
    canPurchase: false,
  });

  assert.equal(product.sizeGuideStatus, 'No approved measurement chart or fit notes confirmed');
  assert.match(guide, /data-breeze-size-guidance/);
  assert.match(guide, /XS[\s\S]*S[\s\S]*M[\s\S]*L[\s\S]*XL/);
  assert.match(guide, /No approved body or garment measurements, fit classification, compression level or sizing recommendation are available/);
  assert.doesNotMatch(guide, /<table|\d+\s?(?:cm|inches|in\b)|compression fit|size recommendation:|recommend (?:a )?size/i);
  assert.doesNotMatch(guide, /mechanical[- ]stretch|four-way mechanical stretch|fit profile/i);
  assert.match(markup, /<summary>Size &amp; Fit<\/summary>/);
  assert.match(markup, /data-breeze-size-guidance/);
  assert.match(markup, /Confirmed size range/);
});

test('products without confirmed sizes do not show a size guide control', () => {
  const product = { ...productFixture, sizes: '' };
  const markup = renderProductDetailPage({
    product,
    images: [{ label: 'Front view', src: '/product-front.jpg' }],
    initialImageIndex: 0,
    galleryPlaceholders: [],
    colourways: [],
    colourwayImageIndexes: [],
    sizes: [],
    price: { label: '', value: '£65.00' },
    canPurchase: true,
  });
  assert.doesNotMatch(markup, /<summary>Size guide<\/summary>|data-size-guide/);
});
