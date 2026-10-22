import './draft-preview.css';
import { bindCollectionReturn } from './collection-return.js';

const previewApi = '/__catalogue-preview/weighted-skipping-rope/data.json';
const campaignImage = document.querySelector('#campaign-image');
const editionImage = document.querySelector('#edition-image');
const editionOptions = document.querySelector('#edition-options');
const selectedColour = document.querySelector('#selected-colour');
const selectedEdition = document.querySelector('#selected-edition');
const selectionStatus = document.querySelector('#selection-status');
const previewError = document.querySelector('#preview-error');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
bindCollectionReturn(document);
let activeVariantId = null;
let selectionSequence = 0;
let variants = [];

const delay = milliseconds => new Promise(resolve => window.setTimeout(resolve, milliseconds));

function setError(message) {
  previewError.textContent = message;
  previewError.hidden = false;
}

function createOption(variant) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'edition-option';
  button.dataset.edition = variant.id;
  button.setAttribute('aria-label', `Select ${variant.colour}`);
  button.setAttribute('aria-pressed', 'false');

  const swatch = document.createElement('span');
  swatch.className = 'edition-swatch';
  swatch.setAttribute('aria-hidden', 'true');
  swatch.style.setProperty('--swatch-colour', variant.swatch);

  const name = document.createElement('span');
  name.className = 'edition-option-name';
  name.textContent = variant.colour;
  button.append(swatch, name);
  button.addEventListener('click', () => selectEdition(variant));
  return button;
}

function installKeyboardSelection() {
  editionOptions.addEventListener('keydown', event => {
    const button = event.target.closest('button[data-edition]');
    if (!button) return;
    const index = variants.findIndex(variant => variant.id === button.dataset.edition);
    if (index < 0) return;

    let nextIndex = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % variants.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + variants.length) % variants.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = variants.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const nextButton = editionOptions.querySelector(`[data-edition="${variants[nextIndex].id}"]`);
    nextButton?.focus({ preventScroll: true });
    nextButton?.click();
  });
}

async function selectEdition(variant, { initial = false } = {}) {
  if (!variant || variant.id === activeVariantId) return;
  const sequence = ++selectionSequence;

  try {
    const preload = new Image();
    preload.src = variant.imageSrc;
    if (typeof preload.decode === 'function') await preload.decode();
    else await new Promise((resolve, reject) => {
      preload.onload = resolve;
      preload.onerror = reject;
    });
    if (sequence !== selectionSequence) return;

    if (!initial && !reducedMotion.matches) {
      editionImage.classList.add('is-transitioning');
      await delay(110);
      if (sequence !== selectionSequence) return;
    }

    editionImage.src = variant.imageSrc;
    editionImage.alt = variant.imageAlt;
    editionImage.dataset.assetId = variant.assetId;
    editionImage.dataset.variantId = variant.id;
    selectedColour.textContent = variant.colour;
    selectedEdition.textContent = variant.colour;
    selectionStatus.textContent = `${variant.colour} selected.`;
    editionOptions.querySelectorAll('[data-edition]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.edition === variant.id));
    });
    activeVariantId = variant.id;
    editionImage.classList.remove('is-transitioning');
  } catch {
    if (sequence === selectionSequence) {
      editionImage.classList.remove('is-transitioning');
      setError(`The original ${variant.colour} edition image could not be loaded. The current selection has been kept.`);
    }
  }
}

async function loadPreview() {
  try {
    const response = await fetch(previewApi, { cache: 'no-store' });
    if (!response.ok) throw new Error('Draft data unavailable');
    const { product, campaignHero } = await response.json();
    if (product?.key !== 'weighted-skipping-rope'
      || product.editorialStatus !== 'Draft'
      || product.id !== null
      || product.purchaseEnabled !== false
      || !Array.isArray(product.variants)
      || product.variants.length !== 8
      || !campaignHero?.src) {
      throw new Error('Draft data is incomplete or not publication-safe.');
    }

    document.querySelector('#product-title').textContent = product.name;
    campaignImage.src = campaignHero.src;
    campaignImage.alt = campaignHero.alt;
    variants = product.variants;
    editionOptions.replaceChildren(...variants.map(createOption));
    installKeyboardSelection();
    await selectEdition(variants[0], { initial: true });
  } catch {
    setError('This product preview is temporarily unavailable. Return to the collection and try again.');
  }
}

loadPreview();
