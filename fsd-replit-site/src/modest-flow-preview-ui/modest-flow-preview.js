import './modest-flow-preview.css';

let instanceCount = 0;

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

function safeColour(value) {
  const colour = String(value ?? '').trim();
  if (/^#[\da-f]{3,8}$/i.test(colour)) return colour;
  if (/^(?:rgb|hsl)a?\([\d\s.,%+-]+\)$/i.test(colour)) return colour;
  return '#77736b';
}

function renderSwatches(variants, selectedId) {
  return variants.map(variant => `
    <button class="mf-selector__swatch" type="button"
      data-mf-variant="${escapeHTML(variant.id)}"
      aria-label="Select ${escapeHTML(variant.colour)}"
      aria-pressed="${String(String(variant.id) === String(selectedId))}">
      <span class="mf-selector__swatch-dot" aria-hidden="true"></span>
      <span class="mf-selector__swatch-name">${escapeHTML(variant.colour)}</span>
    </button>`).join('');
}

export function mountModestFlowSelector({ root, product, variants, setComponents = product?.setComponents }) {
  if (!root || typeof root.append !== 'function' || !root.ownerDocument) {
    throw new TypeError('mountModestFlowSelector requires a DOM root element.');
  }
  if (!product || !Array.isArray(variants) || variants.length !== 6) {
    throw new TypeError('Modest Flow requires product data and six colour variants.');
  }
  if (!Array.isArray(setComponents) || setComponents.length !== 3
    || setComponents.some(component => typeof component !== 'string' || !component.trim())) {
    throw new TypeError('Modest Flow requires the three approved coordinated-set components.');
  }

  const document = root.ownerDocument;
  const instanceId = `mf-selector-${++instanceCount}`;
  const selectedVariants = variants.slice();
  let activeVariant = selectedVariants[0];
  let returnFocus = null;
  let previousExpanded = null;
  let destroyed = false;

  const dialog = document.createElement('dialog');
  dialog.className = 'mf-selector';
  dialog.setAttribute('aria-labelledby', `${instanceId}-title`);
  dialog.setAttribute('aria-describedby', `${instanceId}-description`);
  dialog.innerHTML = `
    <div class="mf-selector__layout">
      <div class="mf-selector__visual">
        <img class="mf-selector__image" data-mf-image src="${escapeHTML(activeVariant.imageSrc)}"
          alt="${escapeHTML(activeVariant.imageAlt)}" />
        <span class="mf-selector__visual-note" aria-hidden="true">FSD / MODEST FLOW</span>
      </div>
      <section class="mf-selector__details">
        <button class="mf-selector__close" type="button" data-mf-close aria-label="Close product details">
          <span class="mf-selector__close-mark" aria-hidden="true">×</span>
        </button>
        <p class="mf-selector__eyebrow">FSD <span aria-hidden="true">/</span> PRIVATE PRODUCT VIEW</p>
        <h2 class="mf-selector__title" id="${instanceId}-title">${escapeHTML(product.name)}</h2>
        <p class="mf-selector__subtitle">${escapeHTML(product.subtitle)}</p>
        <p class="mf-selector__description" id="${instanceId}-description">${escapeHTML(product.description)}</p>
        <div class="mf-selector__set" aria-label="Coordinated set components">
          <p class="mf-selector__set-label">THE MATCHING SET</p>
          <ul>${setComponents.map((component, index) => `
            <li><span aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>${escapeHTML(component)}</li>
          `).join('')}</ul>
        </div>
        <hr class="mf-selector__rule" />
        <div class="mf-selector__colour-heading">
          <span>Colour</span>
          <span class="mf-selector__current-colour" data-mf-colour aria-live="polite">${escapeHTML(activeVariant.colour)}</span>
        </div>
        <div class="mf-selector__swatches" role="group" aria-label="Choose a colour">
          ${renderSwatches(selectedVariants, activeVariant.id)}
        </div>
        <span class="mf-selector__live" data-mf-live aria-live="polite" aria-atomic="true"></span>
      </section>
    </div>`;

  const image = dialog.querySelector('[data-mf-image]');
  const colourLabel = dialog.querySelector('[data-mf-colour]');
  const liveRegion = dialog.querySelector('[data-mf-live]');
  const closeButton = dialog.querySelector('[data-mf-close]');

  dialog.querySelectorAll('[data-mf-variant]').forEach((button, index) => {
    button.querySelector('.mf-selector__swatch-dot').style.setProperty(
      '--mf-swatch',
      safeColour(selectedVariants[index].swatch),
    );
  });

  const restoreOpener = () => {
    if (returnFocus?.isConnected) {
      if (previousExpanded === null) returnFocus.removeAttribute('aria-expanded');
      else returnFocus.setAttribute('aria-expanded', previousExpanded);
      returnFocus.focus({ preventScroll: true });
    }
    returnFocus = null;
    previousExpanded = null;
  };

  const open = opener => {
    if (destroyed) return;
    if (dialog.open) return;
    const possibleOpener = opener || (document.activeElement !== document.body ? document.activeElement : null);
    returnFocus = possibleOpener && root.contains(possibleOpener)
      ? possibleOpener
      : root.querySelector('[data-modest-flow-open]');
    previousExpanded = returnFocus?.getAttribute('aria-expanded') ?? null;
    returnFocus?.setAttribute('aria-expanded', 'true');
    dialog.showModal();
    closeButton.focus({ preventScroll: true });
  };

  const close = () => {
    if (dialog.open) dialog.close();
  };

  const onRootClick = event => {
    const opener = event.target.closest?.('[data-modest-flow-open]');
    if (opener && root.contains(opener)) {
      event.preventDefault();
      open(opener);
      return;
    }
    const swatch = event.target.closest?.('[data-mf-variant]');
    if (swatch && dialog.contains(swatch)) {
      const next = selectedVariants.find(variant => String(variant.id) === swatch.dataset.mfVariant);
      if (!next || next === activeVariant) return;
      activeVariant = next;
      image.classList.add('is-changing');
      window.requestAnimationFrame(() => {
        image.src = next.imageSrc;
        image.alt = next.imageAlt;
        colourLabel.textContent = next.colour;
        liveRegion.textContent = `${next.colour} selected`;
        dialog.querySelectorAll('[data-mf-variant]').forEach(button => {
          button.setAttribute('aria-pressed', String(button === swatch));
        });
        window.requestAnimationFrame(() => image.classList.remove('is-changing'));
      });
      return;
    }
    if (event.target.closest?.('[data-mf-close]')) close();
  };

  const onDialogClick = event => {
    if (event.target === dialog) close();
  };

  const onDialogClose = () => {
    if (!destroyed) restoreOpener();
  };

  const onDialogCancel = event => {
    event.preventDefault();
    close();
  };

  const onWindowKeyDown = event => {
    if (event.key === 'Escape' && dialog.open) {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    }
  };

  root.append(dialog);
  root.addEventListener('click', onRootClick);
  dialog.addEventListener('click', onDialogClick);
  dialog.addEventListener('close', onDialogClose);
  dialog.addEventListener('cancel', onDialogCancel);
  window.addEventListener('keydown', onWindowKeyDown, true);

  return {
    open,
    close,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      root.removeEventListener('click', onRootClick);
      dialog.removeEventListener('click', onDialogClick);
      dialog.removeEventListener('close', onDialogClose);
      dialog.removeEventListener('cancel', onDialogCancel);
      window.removeEventListener('keydown', onWindowKeyDown, true);
      if (dialog.open) dialog.close();
      dialog.remove();
      restoreOpener();
    },
  };
}
