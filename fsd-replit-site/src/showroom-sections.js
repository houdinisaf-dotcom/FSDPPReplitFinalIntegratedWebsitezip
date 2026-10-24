import { products, priceInfo } from './catalogue-data.js';
import { FSD_STORY_HASH, FSD_STORY_PATH } from './react-router.js';

export const featuredProducts = products.filter(product => {
  const price = priceInfo(product);
  return [1, 10].includes(product.id) && product.images?.length > 0 && price.value && !price.label;
});

export function featuredInnovationsSection() {
  return `<section class="showroom-featured" id="innovations" aria-labelledby="featured-title">
    <div data-fsd-featured-carousel-slot></div>
  </section>`;
}

export function vipAccessSection() {
  return `<section class="showroom-vip" id="contact" aria-labelledby="vip-title">
    <p class="section-kicker">VIP ACCESS</p><h2 id="vip-title">BE PART OF<br/><em>WHAT COMES NEXT.</em></h2>
    <p>Discover FSD collections, innovation and exclusive brand announcements.</p>
    <button class="primary-btn" type="button" disabled aria-describedby="vip-status">REQUEST VIP ACCESS <span aria-hidden="true">↗</span></button>
    <p class="showroom-vip-status" id="vip-status">Registration is not collecting sign-ups yet. It will open once the sign-up destination and approved privacy and consent details are ready.</p>
  </section>`;
}

export function initCatalogueNavigation() {
  const reveal = hash => {
    if (!hash?.startsWith('#')) return null;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return null;
    for (let parent = target.parentElement; parent; parent = parent.parentElement) {
      if (parent instanceof HTMLDetailsElement) parent.open = true;
    }
    return target;
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link) reveal(link.getAttribute('href'));
  });
  window.addEventListener('hashchange', () => reveal(window.location.hash));
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const initialHash = window.location.hash || (pathname === FSD_STORY_PATH ? FSD_STORY_HASH : '');
  const initialTarget = reveal(initialHash);
  if (initialTarget) {
    requestAnimationFrame(() => {
      if (initialTarget.isConnected) {
        initialTarget.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    });
  }
}
