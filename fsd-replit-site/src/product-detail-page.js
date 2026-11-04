import {
  getVerifiedProductSpecifications,
  imageSwatchBackground,
  products,
  safe,
} from './catalogue-data.js';
import { renderSizeGuideTable, sizeGuideSectionForProduct, SIZE_GUIDE_FIT_NOTE } from './size-guide-data.js';

export function productSizeOptions(product) {
  return String(product?.sizes || '')
    .split(/[;,/]/)
    .map(value => value.trim())
    .filter(Boolean);
}

function absoluteImageUrl(src) {
  const origin = globalThis.location?.origin;
  try {
    return new URL(src, origin).href;
  } catch {
    try {
      return new URL(src).href;
    } catch {
      return '';
    }
  }
}

function relatedProductsFor(product) {
  const sameCategory = products.filter(candidate =>
    candidate.id !== product.id &&
    candidate.category === product.category &&
    (!product.audience || candidate.audience === product.audience));
  const sameCollection = product.collection
    ? sameCategory.filter(candidate => candidate.collection === product.collection)
    : [];
  const pool = sameCollection.length ? sameCollection : sameCategory;
  return pool.slice(0, 4);
}

function renderRelatedProducts(product) {
  const related = relatedProductsFor(product);
  if (!related.length) return '';
  return `<section class="product-detail-related" aria-labelledby="product-related-title">
    <h3 id="product-related-title">Related products</h3>
    <div class="product-detail-related__grid">
      ${related.map(item => {
        const image = item.images?.[0];
        return `<button class="product-detail-related__item" type="button" data-related-product="${item.id}">
          ${image
            ? `<img src="${safe(image.src)}" alt="${safe(item.name)} — ${safe(image.label)}" loading="lazy" />`
            : `<span class="product-detail-related__placeholder" role="img" aria-label="${safe(item.name)} image not available">IMAGE NOT AVAILABLE</span>`}
          <span>${safe(item.name)}</span>
          <small>${safe(item.category)}</small>
        </button>`;
      }).join('')}
    </div>
  </section>`;
}

function renderColourwayOptions(product, colourways, colourwayImageIndexes) {
  if (!colourways.length) return '';
  return `<fieldset class="product-detail-colourways">
    <legend>Colour</legend>
    <div class="product-detail-options" role="radiogroup" aria-label="Choose a colour">
      ${colourways.map((colourway, index) => {
        const swatch = imageSwatchBackground(colourway, product.colourwayPalette);
        return `<label class="product-detail-option product-detail-option--colour">
          <input type="radio" name="product-colour-${product.id}" value="${safe(colourway)}"
            data-catalogue-colourway-index="${index}" data-catalogue-colourway-image-index="${colourwayImageIndexes[index]}"
            ${index === 0 ? 'checked' : ''} />
          <span class="product-detail-swatch" aria-hidden="true"${swatch ? ` style="--catalogue-swatch:${safe(swatch)}"` : ''}></span>
          <span>${safe(colourway)}</span>
        </label>`;
      }).join('')}
    </div>
    <p class="product-detail-selected-colour" data-catalogue-selected-colourway aria-live="polite">${safe(colourways[0])}</p>
  </fieldset>`;
}

function renderRotationViewer(product, poster) {
  if (Number(product?.id) !== 43 || !poster?.src) return '';
  return `<section class="product-rotation" data-product-rotation data-rotation-product="43"
      aria-labelledby="product-rotation-title-43">
    <header class="product-rotation__heading">
      <p class="section-kicker">FSD / PRODUCT VIEW</p>
      <h3 id="product-rotation-title-43">360° product view</h3>
      <p data-rotation-caption>360° photography has not been supplied. The static catalogue image remains visible.</p>
    </header>
    <figure class="product-rotation__stage">
      <img data-rotation-fallback src="${safe(poster.src)}" alt="${safe(product.name)} — ${safe(poster.label || 'Main product view')}" loading="lazy" decoding="async" />
      <canvas data-rotation-canvas aria-hidden="true" hidden></canvas>
      <figcaption>To complete this view, provide 24–36 separate WebP angles of the same colourway, 10°–15° apart, with consistent camera, lighting and background. Placeholder frames are labels only.</figcaption>
    </figure>
    <p class="product-rotation__hint" data-rotation-hint hidden>Drag to turn the frame, or focus this viewer and use the left and right arrow keys.</p>
    <div class="product-rotation__controls" data-rotation-controls hidden>
      <button type="button" data-rotation-prev aria-label="Previous rotation frame">←</button>
      <span data-rotation-frame-count>24 placeholder frames</span>
      <button type="button" data-rotation-next aria-label="Next rotation frame">→</button>
    </div>
    <p class="sr-only" data-rotation-status role="status" aria-live="polite"></p>
  </section>`;
}

function renderSizeOptions(product, sizes) {
  if (!sizes.length) return '';
  return `<fieldset class="product-detail-sizes">
    <legend>Size</legend>
    <div class="product-detail-options" role="radiogroup" aria-label="Choose a size">
      ${sizes.map(size => {
        const unavailable = product.stockBySize?.[size] === 0
          || product.availabilityBySize?.[size] === 'out-of-stock'
          || product.outOfStockSizes?.includes?.(size);
        return `<label class="product-detail-option product-detail-option--size${unavailable ? ' is-out-of-stock' : ''}">
        <input type="radio" name="product-size-${product.id}" value="${safe(size)}" data-product-size
          ${unavailable ? `aria-disabled="true" aria-label="${safe(size)}, out of stock" data-out-of-stock="true" title="Out of stock"` : ''} />
        <span>${safe(size)}${unavailable ? '<small class="product-detail-out-of-stock">OUT OF STOCK</small>' : ''}</span>
      </label>`;
      }).join('')}
    </div>
    <p class="product-detail-size-availability">Availability by size: <strong>[TO CONFIRM]</strong></p>
    <button class="product-detail-text-link" type="button" data-size-guide>Size guide</button>
  </fieldset>`;
}

function renderGallery(product, images, initialImageIndex, galleryPlaceholders) {
  const selectedImage = images[initialImageIndex];
  if (!selectedImage && galleryPlaceholders.length) {
    return `<div class="product-detail-gallery product-detail-gallery--placeholders" role="group" aria-label="${safe(product.name)} image gallery">
      ${galleryPlaceholders.map((label, index) => `<div class="catalogue-gallery-placeholder${index === 0 ? ' catalogue-gallery-placeholder--primary' : ''}" role="note">
        <span>VIEW ${String(index + 1).padStart(2, '0')}</span><strong>${safe(label)}</strong><small>[TO CONFIRM] Product photography</small>
      </div>`).join('')}
    </div>`;
  }
  if (!selectedImage) {
    return `<div class="product-detail-gallery product-detail-gallery--empty" role="note">
      <span>IMAGE NOT AVAILABLE</span><strong>${safe(product.name)}</strong>
    </div>`;
  }
  return `<div class="product-detail-gallery">
    <figure class="catalogue-selector__main">
      <div class="product-detail-image-stage">
        <button type="button" class="product-detail-image-zoom" data-catalogue-zoom aria-pressed="false" aria-label="Zoom product image">
          <img class="mapped-gallery-image" data-mapped-gallery-active="true" data-catalogue-main-image
            src="${safe(selectedImage.src)}" alt="${safe(product.name)} — ${safe(selectedImage.label)}"
            loading="eager" fetchpriority="high" decoding="async" />
        </button>
      </div>
      <figcaption data-catalogue-main-caption>${safe(selectedImage.label)}</figcaption>
    </figure>
    ${images.length > 1 ? `<div class="catalogue-selector__thumbs" role="group" aria-label="Choose a product view">
      ${images.map((image, index) => `<button type="button" class="catalogue-selector__thumb"
        data-catalogue-image-index="${index}" aria-label="Show ${safe(image.label)}" aria-pressed="${index === initialImageIndex}">
        <img src="${safe(image.src)}" alt="${safe(product.name)} — ${safe(image.label)}" loading="lazy" decoding="async" />
        <span>${safe(image.label)}</span>
      </button>`).join('')}
    </div>` : ''}
  </div>`;
}

function renderDetails(product, sizes, hardwarePreview = false) {
  if (hardwarePreview) {
    return `<dl class="product-detail-catalogue-facts">
      <dt>Category</dt><dd>${safe(product.category || '[TO CONFIRM]')}</dd>
    </dl>`;
  }
  const verified = getVerifiedProductSpecifications(product.id);
  const technicalSpecs = verified?.technicalSpecs || {};
  const details = product.description
    ? `<p>${safe(product.description)}</p>`
    : '<p>[TO CONFIRM] Product details.</p>';
  const alias = product.alias?.trim() && /^confirmed$/i.test(product.aliasStatus || '')
    ? `<p><strong>Also appears as:</strong> ${safe(product.alias)}</p>`
    : '';
  const sku = product.sku
    ? `<p><strong>Product code:</strong> ${safe(product.sku)}</p>`
    : '';
  const fit = product.coverage
    ? `<p><strong>Coverage:</strong> ${safe(product.coverage)}</p>`
    : technicalSpecs.fit
      ? `<p><strong>Fit:</strong> ${safe(technicalSpecs.fit)}</p>`
      : '<p><strong>Fit:</strong> [TO CONFIRM]</p>';
  const features = verified?.benefits.length
    ? `<ul>${verified.benefits.map(feature => `<li>${safe(feature)}</li>`).join('')}</ul>`
    : '';
  const materials = verified?.materials.length
    ? safe(verified.materials.join(' '))
    : '[TO CONFIRM] Material composition';
  const specificationLabel = technicalSpecs.fabricWeight ? 'Fabric weight' : 'GSM / specifications';
  const specifications = technicalSpecs.fabricWeight
    ? safe(technicalSpecs.fabricWeight)
    : technicalSpecs.composition
      ? safe(technicalSpecs.composition)
    : '[TO CONFIRM] Technical specifications';
  const care = technicalSpecs.care ? safe(technicalSpecs.care) : '[TO CONFIRM]';
  const deliverySummary = `<p>UK delivery times and fees: [TO CONFIRM]</p>
    <p>Dispatch timing: [TO CONFIRM]</p>
    <p>Returns window and process: [TO CONFIRM]</p>`;
  const sizeRows = sizes.length ? sizes : ['[TO CONFIRM]'];
  return `<div class="product-detail-accordions">
    <details class="product-detail-accordion">
      <summary>Details and fit</summary>
      <div>${details}${sku}${alias}${fit}${features}</div>
    </details>
    <details class="product-detail-accordion">
      <summary>Fabric and care</summary>
      <div>
        <p><strong>Material:</strong> ${materials}</p>
        <p><strong>${specificationLabel}:</strong> ${specifications}</p>
        <p><strong>Care instructions:</strong> ${care}</p>
      </div>
    </details>
    <details class="product-detail-accordion">
      <summary>Delivery and returns</summary>
      <div>${deliverySummary}<a href="/delivery-returns.html">Full delivery and returns information</a></div>
    </details>
    <details class="product-detail-accordion">
      <summary>Size guide</summary>
      <div>
        <p>Measurements are [TO CONFIRM] body or garment measurements.</p>
        <p>Model height: [TO CONFIRM]. Model size worn: [TO CONFIRM].</p>
        <button class="product-detail-text-link" type="button" data-size-guide>Open size guide</button>
      </div>
    </details>
  </div>`;
}

export function renderProductDetailPage({
  product,
  images,
  initialImageIndex,
  galleryPlaceholders,
  colourways,
  colourwayImageIndexes,
  sizes,
  price,
  canPurchase,
  hardwarePreview = false,
}) {
  const breadcrumbCategory = product.category || 'FSD Collection';
  const description = product.description || '';
  const imageMarkup = renderGallery(product, images, initialImageIndex, galleryPlaceholders);
  const rotationMarkup = renderRotationViewer(product, images[0]);
  const sizeMarkup = renderSizeOptions(product, sizes);
  const actionMarkup = canPurchase
    ? `<button class="catalogue-bag-add product-detail-add" type="button" data-bag-add="${product.id}"
        data-product-primary-add ${sizes.length ? 'disabled aria-disabled="true"' : ''}>ADD TO BAG</button>
       ${sizes.length ? '<p class="product-detail-size-help" data-size-help role="status">Choose a size to continue.</p>' : ''}`
    : `<div class="product-detail-notify" role="note">
        <h3>Notify me when available</h3>
        <p>Email notifications are not connected. No email is collected. Availability: [TO CONFIRM]</p>
      </div>`;
  const availability = hardwarePreview
    ? 'Not available for purchase. Availability details: [TO CONFIRM]'
    : 'Availability: [TO CONFIRM]';
  const priceMarkup = price.label || price.value
    ? `<p class="product-detail-price">${price.label ? `<span>${safe(price.label)}</span>` : ''}${price.value ? `<strong>${safe(price.value)}</strong>` : ''}</p>`
    : '<p class="product-detail-price"><strong>[TO CONFIRM]</strong></p>';
  const priceForSchema = Number(product.confirmedPrice);
  const availabilityValue = String(product.availability || '').toLowerCase();
  const schemaAvailability = {
    instock: 'https://schema.org/InStock',
    outofstock: 'https://schema.org/OutOfStock',
    preorder: 'https://schema.org/PreOrder',
    backorder: 'https://schema.org/BackOrder',
  }[availabilityValue];
  const schemaBase = {
    name: product.name,
    ...(description ? { description } : {}),
    brand: { '@type': 'Brand', name: 'FSD' },
    ...(images.length ? { image: images.map(image => absoluteImageUrl(image.src)).filter(Boolean) } : {}),
    ...(colourways.length ? { color: colourways } : {}),
    ...(sizes.length ? { size: sizes } : {}),
    ...(priceForSchema > 0 && schemaAvailability
      ? { offers: { '@type': 'Offer', priceCurrency: 'GBP', price: priceForSchema.toFixed(2), availability: schemaAvailability } }
      : {}),
  };
  const hasVariants = colourways.length > 0 || sizes.length > 0;
  const variants = hasVariants
    ? (sizes.length ? sizes : ['']).flatMap(size =>
      (colourways.length ? colourways : ['']).map(colour => ({
        '@type': 'Product',
        name: [product.name, colour, size].filter(Boolean).join(' — '),
        ...(size ? { size } : {}),
        ...(colour ? { color: colour } : {}),
        brand: { '@type': 'Brand', name: 'FSD' },
        image: [absoluteImageUrl(images.find(image => image.colourway === colour)?.src || images[0]?.src || '')].filter(Boolean),
      })))
    : [];
  const schema = hasVariants
    ? { '@context': 'https://schema.org', '@type': 'ProductGroup', productGroupID: String(product.id), ...schemaBase, variesBy: [
      ...(colourways.length ? ['https://schema.org/color'] : []),
      ...(sizes.length ? ['https://schema.org/size'] : []),
    ], hasVariant: variants }
    : { '@context': 'https://schema.org', '@type': 'Product', ...schemaBase };

  return `<div class="product-detail-page">
    <div class="product-detail-layout">
      <section class="product-detail-media" aria-label="${safe(product.name)} product images">${imageMarkup}${rotationMarkup}</section>
      <section class="product-detail-purchase" aria-labelledby="product-title">
        <nav class="catalogue-breadcrumbs" aria-label="Breadcrumb"><ol>
          <li><a href="#products" data-shop-breadcrumb>Collections</a></li>
          <li><a href="#products" data-category-link="${safe(product.category)}">${safe(breadcrumbCategory)}</a></li>
          <li aria-current="page">${safe(product.name)}</li>
        </ol></nav>
        <button class="catalogue-back" type="button" data-catalogue-back>RETURN TO THE HOUSE</button>
        <p class="section-kicker">${safe(breadcrumbCategory)}</p>
        <h2 id="product-title">${safe(product.name)}</h2>
        ${priceMarkup}
        ${renderColourwayOptions(product, colourways, colourwayImageIndexes)}
        ${sizeMarkup}
        <p class="product-detail-availability">${safe(availability)}</p>
        ${actionMarkup}
        <p class="product-detail-delivery-summary">
          <span>UK delivery: [TO CONFIRM]</span>
          <span>Dispatch: [TO CONFIRM]</span>
          <span>Returns: [TO CONFIRM]</span>
          <a href="/delivery-returns.html">Delivery and returns</a>
        </p>
        <button class="product-detail-wishlist" type="button" data-product-wishlist="${product.id}" aria-pressed="false">
          <span aria-hidden="true">♡</span><span data-wishlist-label>Add to wishlist</span>
        </button>
        <p class="product-detail-action-status" data-product-action-status role="status" aria-live="polite"></p>
        <div data-product-specifications-root data-product-id="${product.id}"></div>
      </section>
    </div>
    <p class="product-detail-disclaimer" role="note">Verified catalogue values are shown where recorded; missing or unconfirmed details are marked [TO CONFIRM].</p>
    ${renderDetails(product, sizes, hardwarePreview)}
    ${renderRelatedProducts(product)}
    ${Array.isArray(product.reviews) && product.reviews.length
      ? `<section class="product-detail-reviews" aria-label="Customer reviews">
          <h3>Customer reviews</h3><p>${safe(product.reviews.length)} verified reviews</p>
        </section>`
      : ''}
    ${canPurchase ? `<div class="product-detail-sticky" data-sticky-add-bar hidden>
      <strong>${safe(product.name)} · ${price.value ? safe(price.value) : '[TO CONFIRM]'}</strong>
      <button class="catalogue-bag-add" type="button" data-bag-add="${product.id}" data-sticky-add ${sizes.length ? 'disabled aria-disabled="true"' : ''}>ADD TO BAG</button>
    </div>` : ''}
    <script type="application/ld+json" data-product-jsonld>${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
  </div>`;
}

export function renderSizeGuideDialog(product, sizes) {
  const section = sizeGuideSectionForProduct(product);
  return `<div class="size-guide-dialog__shell">
    <header><div><p class="section-kicker">FSD / SIZE GUIDE</p><h2 id="size-guide-title">${safe(product.name)}</h2></div>
      <button type="button" data-size-guide-close aria-label="Close size guide">×</button></header>
    <p>${safe(SIZE_GUIDE_FIT_NOTE)} Model height: [TO CONFIRM]. Model size worn: [TO CONFIRM].</p>
    ${renderSizeGuideTable(section, sizes)}
    <a class="size-guide-full-link" href="/size-guide.html">View the full size guide</a>
  </div>`;
}
