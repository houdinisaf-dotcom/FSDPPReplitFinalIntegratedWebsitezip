import './style.css';
import './catalogue.css';
import './product-options.css';
import './product-experience.css';
import './draft-preview.css';
import { loadWeightedRopeDraft } from './draft-catalogue.js';
import { applyImageSource } from './product-assets.js';
import { initProductExperience, showProductExperience } from './product-experience.js';
import { safe } from './catalogue-data.js';

const imageHost = document.querySelector('#campaign-image');
const errorPanel = document.querySelector('#draft-load-error');
const retryButton = document.querySelector('#draft-retry');
let loadSequence = 0;

function showCampaign(campaignHero) {
  imageHost.replaceChildren();
  const image = document.createElement('img');
  image.className = 'draft-campaign-asset';
  applyImageSource(image, campaignHero, '(max-width:700px) 100vw, 1240px');
  image.alt = campaignHero.alt || '';
  image.width = campaignHero.width;
  image.height = campaignHero.height;
  image.decoding = 'async';
  image.fetchPriority = 'high';
  imageHost.append(image);
}

function showSourceBoards(product) {
  const boards = product.catalogue?.sourceBoards;
  const host = document.querySelector('#source-boards');
  if (!Array.isArray(boards) || !boards.length) return;
  host.hidden = false;
  host.innerHTML = `<p class="draft-eyebrow">SOURCE BOARDS</p><div>${boards.map(board =>
    `<a href="${safe(board.src)}" target="_blank" rel="noopener noreferrer">${safe(board.label || 'Open original board')} ↗</a>`,
  ).join('')}</div>`;
}

async function loadDraft() {
  const request = ++loadSequence;
  retryButton.disabled = true;
  errorPanel.hidden = true;
  try {
    const { product, campaignHero } = await loadWeightedRopeDraft();
    if (request !== loadSequence) return;
    if (!product || !campaignHero) throw new Error('Incomplete draft payload');
    document.querySelector('#draft-review-title').textContent = product.name;
    showCampaign(campaignHero);
    initProductExperience({ products: [product], preview: true, inline: true });
    showProductExperience(product.id);
    showSourceBoards(product);
  } catch {
    if (request !== loadSequence) return;
    errorPanel.hidden = false;
  } finally {
    if (request === loadSequence) retryButton.disabled = false;
  }
}

retryButton.addEventListener('click', loadDraft);
loadDraft();
