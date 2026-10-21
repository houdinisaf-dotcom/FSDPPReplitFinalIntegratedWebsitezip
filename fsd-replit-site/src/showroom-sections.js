import { renderImageAttributes } from './product-assets.js';
import { products, safe, priceInfo } from './catalogue-data.js';
import { renderMappedImageChoices } from './product-card-media.js';

export const featuredProducts = products.filter(product => [43, 69, 61, 59].includes(product.id));

export function featuredInnovationsSection() {
  return `<section class="showroom-featured" id="innovations" aria-labelledby="featured-title">
    <div class="section-heading"><div><p class="section-kicker">SELECTED FSD RECORDS</p>
      <h2 id="featured-title">FEATURED INNOVATIONS<span class="period">.</span></h2></div>
      <div class="showroom-carousel-controls"><button type="button" data-feature-prev aria-label="Previous featured products">←</button>
        <button type="button" data-feature-next aria-label="Next featured products">→</button></div></div>
    <div class="showroom-feature-track" tabindex="0" aria-label="Featured FSD products; swipe or use the arrow buttons" aria-roledescription="carousel">
      ${featuredProducts.map(product => {
        const image = product.images[0];
        const price = priceInfo(product);
        return `<article class="showroom-feature-card">
          <div class="showroom-feature-media">${image
            ? `<img ${renderImageAttributes(image, { lazy: true, sizes: '(max-width:700px) 90vw, 420px' })}/>`
            : `<div class="showroom-feature-placeholder"><span>FSD</span><small>DESIGN CONCEPT</small></div>`}</div>
          ${renderMappedImageChoices(product.images)}
          <div class="showroom-feature-copy"><p class="section-kicker">${safe(product.category)}</p>
          <h3>${safe(product.name)}</h3><p>${safe(product.priceBasis || product.coverage || 'Pre-launch record. Specifications and availability are subject to confirmation.')}</p>
          <span class="showroom-feature-price">${safe(price.label)} · ${safe(price.value)}</span>
          <button class="text-link" type="button" data-product="${product.id}">VIEW DETAILS ↗<span class="sr-only"> for ${safe(product.name)}</span></button></div>
        </article>`;
      }).join('')}
    </div><p class="showroom-carousel-note">${featuredProducts.length} selected records. Swipe or use the arrows to explore; no autoplay.</p>
  </section>`;
}

export function vipAccessSection() {
  return `<section class="showroom-vip" id="contact" aria-labelledby="vip-title">
    <p class="section-kicker">VIP PRE-LAUNCH ACCESS</p><h2 id="vip-title">BE PART OF<br/><em>WHAT COMES NEXT.</em></h2>
    <p>Register your interest in future FSD collections, innovation concepts and exclusive brand announcements.</p>
    <button class="primary-btn" type="button" disabled aria-describedby="vip-status">REQUEST VIP ACCESS <span aria-hidden="true">↗</span></button>
    <p class="showroom-vip-status" id="vip-status">Registration is not collecting sign-ups yet. It will open once the sign-up destination and approved privacy and consent details are ready.</p>
  </section>`;
}

export function initFeaturedCarousel(root) {
  const track = root.querySelector('.showroom-feature-track');
  const previous = root.querySelector('[data-feature-prev]');
  const next = root.querySelector('[data-feature-next]');
  const update = () => {
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  };
  const move = direction => {
    track.scrollBy({
      left: direction * track.clientWidth * .85,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('scroll', update, { passive: true });
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });
  window.addEventListener('resize', update, { passive: true });
  update();
}

export function initArchiveNavigation() {
  const reveal = hash => {
    const archive = hash === '#products' ? '#catalogue-archive' : hash === '#full-gallery' ? '#gallery-archive' : null;
    if (!archive) return;
    document.querySelector(archive).open = true;
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link) reveal(link.getAttribute('href'));
  });
  window.addEventListener('hashchange', () => reveal(window.location.hash));
  reveal(window.location.hash);
}
