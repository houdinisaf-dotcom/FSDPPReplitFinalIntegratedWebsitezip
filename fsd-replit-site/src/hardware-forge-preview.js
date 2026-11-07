const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

export const hardwareForgeItems = Object.freeze([
  { id: 69, name: 'FSD AUREUS FORGED CARBON™ SET', category: 'DUMBBELL SET', image: null,
    imageSlots: Object.freeze(['Set overview', 'Alternate set view', 'Product detail']),
    note: 'FSD strength-training equipment.' },
  { id: 70, name: 'FSD OBSIDIAN GOLD™ ELITE SET', category: 'DUMBBELL SET',
    image: '/__hardware-forge-preview/media/obsidian-gold', alt: 'FSD Obsidian Gold dumbbell set.',
    note: 'FSD strength-training equipment.' },
  { id: 52, name: 'FSD Precision Barbell Collars (Pair)', category: 'BARBELL ACCESSORY',
    image: '/__hardware-forge-preview/media/precision-collars', alt: 'FSD precision barbell collars.',
    note: 'FSD barbell accessory.' },
  { id: 54, name: 'FSD Olympic Bar & 5-Cutout Bumper Plate Set', category: 'BARBELL SYSTEM', image: null,
    note: 'FSD barbell and bumper plate set.' },
]);

function renderImage(item) {
  if (item.image) return `<img src="${item.image}" alt="${escapeHTML(item.alt)}" loading="lazy" decoding="async">`;
  if (Array.isArray(item.imageSlots) && item.imageSlots.length) {
    return `<div class="forge-image-slots" aria-label="FSD AUREUS approved product image slots">
      ${item.imageSlots.map((slot, index) => `<div class="forge-image-slot" data-aureus-image-slot="${index + 1}">
        <div class="forge-art-placeholder" role="img"
          aria-label="Image asset pending for ${escapeHTML(item.name)} — ${escapeHTML(slot)}">
          <span class="forge-placeholder-mark" aria-hidden="true"></span>
          <span>[ASSET PENDING]</span>
          <small>${escapeHTML(slot)}</small>
        </div>
      </div>`).join('')}
    </div>`;
  }
  return `<div class="forge-art-placeholder" role="img" aria-label="Product image unavailable for ${escapeHTML(item.name)}">
    <span class="forge-placeholder-mark" aria-hidden="true"></span>
    <span>PRODUCT IMAGE UNAVAILABLE</span>
  </div>`;
}

export function renderHardwareForgePreview({ development = import.meta.env?.DEV } = {}) {
  if (!development) return '';
  const cards = hardwareForgeItems.map((item, index) => `<article class="forge-product" data-master-id="${item.id}">
    <figure class="forge-product-visual forge-product-visual--${index + 1}">
      ${renderImage(item)}
      <figcaption><span>PRODUCT ${String(index + 1).padStart(2, '0')}</span><span>FSD / HARDWARE</span></figcaption>
    </figure>
    <div class="forge-product-copy">
      <p class="forge-product-category">${escapeHTML(item.category)}</p>
      <h3>${escapeHTML(item.name)}</h3>
      <p class="forge-verify">${escapeHTML(item.note)}</p>
    </div>
  </article>`).join('');
  return `<section id="hardware-forge-preview" class="hardware-forge" aria-labelledby="forge-title">
    <div class="forge-shell">
      <header class="forge-intro">
        <p class="forge-eyebrow">FSD HARDWARE <span>/</span> STRENGTH EQUIPMENT</p>
        <div class="forge-title-row">
          <div><p class="forge-index">FIELD NOTES — 01 / STRENGTH EQUIPMENT</p>
            <h2 id="forge-title">THE<br><em>FORGE.</em></h2></div>
          <p class="forge-deck">FSD strength-training equipment and accessories.</p>
        </div>
        <div class="forge-rule"><span>FSD / HARDWARE</span><span>PRODUCT DETAILS</span></div>
      </header>
      <div class="forge-products">${cards}</div>
      <section class="forge-colophon" aria-label="FSD hardware details">
        <span class="forge-colophon-index">FSD / 2026</span>
        <p>FSD hardware product imagery and details.</p>
        <a href="#home">RETURN TO THE HOUSE <span aria-hidden="true">↗</span></a>
      </section>
    </div>
  </section>`;
}
