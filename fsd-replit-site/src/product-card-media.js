import { safe } from './catalogue-data.js';
import { animateWithTokens, cancelMotion } from './motion.js';

const pending = new Map();
const activations = new WeakMap();
const cardKinds = new WeakMap();
let nextCardKind = 0;
let installed = false;

export function renderMappedImageChoices(images = []) {
  if (!Array.isArray(images) || images.length < 2) return '';
  return `<div class="mapped-image-choices" role="group" aria-label="Mapped product colourway images">
    ${images.map((image, index) => `<button type="button" data-card-image-index="${index}"
      data-image-src="${safe(image.src)}" data-image-label="${safe(image.label)}"
      aria-pressed="${index === 0}" aria-label="Show mapped image: ${safe(image.label)}">
      <span>${String(index + 1).padStart(2, '0')}</span><small>${safe(image.label)}</small>
    </button>`).join('')}
  </div><span class="mapped-image-status sr-only" aria-live="polite"></span>`;
}

function mappedImage(button) {
  const src = button.dataset.imageSrc;
  if (!src) return Promise.resolve(null);
  if (!pending.has(src)) {
    pending.set(src, new Promise(resolve => {
      if (typeof Image !== 'function') { resolve(null); return; }
      const image = new Image();
      image.decoding = 'async';
      image.onload = async () => {
        try { await image.decode?.(); } catch { /* An already loaded image can still be used. */ }
        resolve(image);
      };
      image.onerror = () => { pending.delete(src); resolve(null); };
      image.src = src;
    }));
  }
  return pending.get(src);
}

async function activate(button) {
  const card = button.closest('.product-card, .fsd-product-card, .showroom-feature-card');
  const image = card?.querySelector('.product-image img, .fsd-product-media img, .showroom-feature-media img');
  if (!image) return;
  const activation = (activations.get(card) || 0) + 1;
  activations.set(card, activation);
  if (!cardKinds.has(card)) cardKinds.set(card, `product-card-image-${++nextCardKind}`);
  const kind = cardKinds.get(card);
  cancelMotion(kind);
  const loaded = await mappedImage(button);
  if (activations.get(card) !== activation) return;
  const status = card.querySelector('.mapped-image-status');
  if (!loaded) {
    if (status) status.textContent = `Mapped image unavailable: ${button.dataset.imageLabel}.`;
    return;
  }
  const commit = () => {
    if (activations.get(card) !== activation) return;
    image.src = button.dataset.imageSrc;
    image.closest('.product-image, .fsd-product-media, .showroom-feature-media')?.classList.remove('mapped-image-unavailable');
    image.alt = `${image.alt.split(' — ')[0]} — ${button.dataset.imageLabel}; design concept`;
    card.querySelectorAll('[data-card-image-index]').forEach(choice => {
      const selected = choice === button;
      choice.setAttribute('aria-pressed', String(selected));
    });
    if (status) status.textContent = `Showing ${button.dataset.imageLabel}.`;
    animateWithTokens(image, [{ opacity: 0.62 }, { opacity: 1 }], kind);
  };
  const fade = animateWithTokens(image, [{ opacity: 1 }, { opacity: 0.42 }], kind);
  if (!fade) { commit(); return; }
  if (fade.addEventListener) {
    fade.addEventListener('finish', commit, { once: true });
    fade.addEventListener('cancel', commit, { once: true });
  } else {
    fade.onfinish = commit;
    fade.oncancel = commit;
  }
}

function onIntent(event) {
  const choice = event.target.closest?.('[data-card-image-index]');
  if (choice) mappedImage(choice);
}

function onClick(event) {
  const choice = event.target.closest?.('[data-card-image-index]');
  if (choice) {
    event.preventDefault();
    activate(choice);
  }
}

function onImageError(event) {
  const image = event.target;
  const wrapper = image?.closest?.('.product-image, .fsd-product-media, .showroom-feature-media');
  if (wrapper && image.matches?.('img')) wrapper.classList.add('mapped-image-unavailable');
}

export function initProductCardMedia(root = document) {
  if (!root || installed) return;
  installed = true;
  root.addEventListener('pointerover', onIntent, { passive: true });
  root.addEventListener('focusin', onIntent);
  root.addEventListener('click', onClick);
  root.addEventListener('error', onImageError, true);
}
