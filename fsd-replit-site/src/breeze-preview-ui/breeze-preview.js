import './breeze-preview.css';

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

function validateData(product, variants) {
  if (!product || !Array.isArray(variants) || variants.length !== 6) {
    throw new TypeError('Breeze preview requires product data and exactly six colour variants.');
  }
  for (const variant of variants) {
    if (!variant || !Array.isArray(variant.views) || variant.views.length !== 4) {
      throw new TypeError('Each Breeze colour variant must provide four views.');
    }
    for (const view of variant.views) {
      if (!view || !view.src || !view.id || !view.label) {
        throw new TypeError('Each Breeze view requires an id, label, and image source.');
      }
    }
  }
}

function renderFeatures(features) {
  if (!Array.isArray(features) || !features.length) return '';
  return `<ul class="breeze-preview__features" aria-label="Provisional features">
    ${features.map(feature => `<li>${escapeHTML(feature)}</li>`).join('')}
  </ul>`;
}

export function mountBreezePreview({ root, product, variants }) {
  if (!root || typeof root.append !== 'function' || !root.ownerDocument) {
    throw new TypeError('mountBreezePreview requires a DOM root element.');
  }
  validateData(product, variants);

  const document = root.ownerDocument;
  const instanceId = `breeze-preview-${++instanceCount}`;
  const options = variants.slice();
  const views = options[0].views.slice();
  let activeVariant = options[0];
  let activeView = views[0];
  let requestedVariant = activeVariant;
  let requestedView = activeView;
  let returnFocus = null;
  let priorExpanded = null;
  let destroyed = false;
  let imageChangeId = 0;
  let cancelFade = null;

  const dialog = document.createElement('dialog');
  dialog.className = 'breeze-preview';
  dialog.setAttribute('aria-labelledby', `${instanceId}-title`);
  dialog.setAttribute('aria-describedby', `${instanceId}-description`);
  dialog.innerHTML = `
    <div class="breeze-preview__layout">
      <section class="breeze-preview__visual" aria-label="Garment view">
        <img class="breeze-preview__image" data-breeze-image
          src="${escapeHTML(activeView.src)}"
          alt="${escapeHTML(activeView.alt || `${activeVariant.label} — ${activeView.label}`)}" />
        <span class="breeze-preview__visual-note" data-breeze-image-note aria-live="polite">
          ${escapeHTML(activeView.label)}
        </span>
      </section>
      <section class="breeze-preview__details">
        <button class="breeze-preview__close" type="button" data-breeze-close aria-label="Close preview">
          <span aria-hidden="true">×</span>
        </button>
        <p class="breeze-preview__eyebrow">FSD <span aria-hidden="true">/</span> PRIVATE CONCEPT PREVIEW</p>
        <h2 class="breeze-preview__title" id="${instanceId}-title">${escapeHTML(product.name)}</h2>
        ${product.priceLabel || product.priceNote ? `<p class="breeze-preview__reference">
          ${product.priceLabel ? `<span>Reference only · ${escapeHTML(product.priceLabel)}</span>` : ''}
          ${product.priceNote ? `<span class="breeze-preview__price-note">${escapeHTML(product.priceNote)}</span>` : ''}
        </p>` : ''}
        <p class="breeze-preview__description" id="${instanceId}-description">${escapeHTML(product.description)}</p>
        ${renderFeatures(product.provisionalFeatures)}
        <div class="breeze-preview__notices" role="note">
          <p><span aria-hidden="true">01</span> Draft status: ${escapeHTML(product.draftStatus || 'Not provided')}.</p>
          <p><span aria-hidden="true">02</span> Image status: ${escapeHTML(product.imageStatus || 'Not provided')}.</p>
          <p><span aria-hidden="true">03</span> Commercial status: ${escapeHTML(product.commercialStatus || 'Not provided')}.</p>
          <p><span aria-hidden="true">04</span> Brand status is unverified${product.brandStatus ? ` — ${escapeHTML(product.brandStatus)}` : ''}.</p>
        </div>
        <hr class="breeze-preview__rule" />
        <div class="breeze-preview__section-heading">
          <span>View</span>
          <span class="breeze-preview__current-view" data-breeze-view-label aria-live="polite">${escapeHTML(activeView.label)}</span>
        </div>
        <div class="breeze-preview__views" role="group" aria-label="Choose a garment view">
          ${views.map((view, index) => `<button class="breeze-preview__view${index === 0 ? ' is-active' : ''}"
            type="button" data-breeze-view="${escapeHTML(view.id)}"
            aria-pressed="${String(index === 0)}">${escapeHTML(view.label)}</button>`).join('')}
        </div>
        <div class="breeze-preview__section-heading breeze-preview__colour-heading">
          <span>Colour concept</span>
          <span class="breeze-preview__current-colour" data-breeze-colour aria-live="polite">${escapeHTML(activeVariant.label)}</span>
        </div>
        <div class="breeze-preview__swatches" role="group" aria-label="Choose one of six colour concepts">
          ${options.map((variant, index) => `<button class="breeze-preview__swatch"
            type="button" data-breeze-variant="${escapeHTML(variant.id)}"
            aria-label="${escapeHTML(variant.label)}${variant.approvalStatus ? ` — ${escapeHTML(variant.approvalStatus)}` : ''}"
            aria-pressed="${String(index === 0)}">
            <span class="breeze-preview__swatch-dot" aria-hidden="true"></span>
            <span class="breeze-preview__swatch-name">${escapeHTML(variant.label)}</span>
            ${variant.approvalStatus ? `<span class="breeze-preview__swatch-status">${escapeHTML(variant.approvalStatus)}</span>` : ''}
          </button>`).join('')}
        </div>
        <p class="breeze-preview__view-status">${escapeHTML(activeView.approvalStatus || 'Draft view')}</p>
        <span class="breeze-preview__live" data-breeze-live aria-live="polite" aria-atomic="true"></span>
      </section>
    </div>`;

  const image = dialog.querySelector('[data-breeze-image]');
  const imageNote = dialog.querySelector('[data-breeze-image-note]');
  const colourLabel = dialog.querySelector('[data-breeze-colour]');
  const viewLabel = dialog.querySelector('[data-breeze-view-label]');
  const viewStatus = dialog.querySelector('.breeze-preview__view-status');
  const liveRegion = dialog.querySelector('[data-breeze-live]');
  const closeButton = dialog.querySelector('[data-breeze-close]');

  dialog.querySelectorAll('[data-breeze-variant]').forEach((button, index) => {
    button.querySelector('.breeze-preview__swatch-dot').style.setProperty(
      '--breeze-swatch',
      safeColour(options[index].hex),
    );
  });

  const selectedView = variant => variant.views.find(view => String(view.id) === String(requestedView.id))
    || variant.views.find(view => String(view.label).toLowerCase() === String(requestedView.label).toLowerCase())
    || variant.views[0];

  const changeImage = (variant, view) => {
    const changeId = ++imageChangeId;
    if (cancelFade) {
      cancelFade();
      cancelFade = null;
    }
    image.classList.remove('is-changing');
    requestedVariant = variant;
    requestedView = view;
    const preload = new window.Image();
    const commit = () => {
      if (changeId !== imageChangeId) return;
      const apply = () => {
        if (changeId !== imageChangeId) return;
        image.src = view.src;
        image.alt = view.alt || `${variant.label} — ${view.label}`;
        imageNote.textContent = view.label;
        colourLabel.textContent = variant.label;
        viewLabel.textContent = view.label;
        viewStatus.textContent = view.approvalStatus || variant.approvalStatus || 'Draft view';
        activeVariant = variant;
        activeView = view;
        dialog.querySelectorAll('[data-breeze-variant]').forEach(button => {
          button.setAttribute('aria-pressed', String(button.dataset.breezeVariant === String(variant.id)));
        });
        dialog.querySelectorAll('[data-breeze-view]').forEach(button => {
          const buttonView = views.find(item => String(item.id) === button.dataset.breezeView);
          const selected = buttonView && String(buttonView.label).toLowerCase() === String(view.label).toLowerCase();
          button.setAttribute('aria-pressed', String(Boolean(selected)));
          button.classList.toggle('is-active', Boolean(selected));
        });
        liveRegion.textContent = `${variant.label}, ${view.label} selected`;
        image.classList.remove('is-changing');
      };

      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        apply();
        return;
      }

      image.classList.add('is-changing');
      let finished = false;
      const finish = event => {
        if (event && (event.target !== image || event.propertyName !== 'opacity')) return;
        if (finished) return;
        finished = true;
        image.removeEventListener('transitionend', finish);
        window.clearTimeout(fallback);
        cancelFade = null;
        apply();
      };
      const fallback = window.setTimeout(finish, 230);
      image.addEventListener('transitionend', finish);
      cancelFade = () => {
        if (finished) return;
        finished = true;
        image.removeEventListener('transitionend', finish);
        window.clearTimeout(fallback);
        image.classList.remove('is-changing');
      };
    };

    preload.onload = commit;
    preload.onerror = () => {
      if (changeId !== imageChangeId) return;
      requestedVariant = activeVariant;
      requestedView = activeView;
      liveRegion.textContent = 'That image could not be loaded. The current image remains selected.';
    };
    preload.src = view.src;
    if (preload.complete && preload.naturalWidth > 0) window.queueMicrotask(commit);
  };

  const restoreOpener = () => {
    if (returnFocus?.isConnected) {
      if (priorExpanded === null) returnFocus.removeAttribute('aria-expanded');
      else returnFocus.setAttribute('aria-expanded', priorExpanded);
      returnFocus.focus({ preventScroll: true });
    }
    returnFocus = null;
    priorExpanded = null;
  };

  const open = opener => {
    if (destroyed || dialog.open) return;
    const candidate = opener || (document.activeElement !== document.body ? document.activeElement : null);
    returnFocus = candidate && root.contains(candidate)
      ? candidate
      : root.querySelector('[data-fsd-breeze-open]');
    priorExpanded = returnFocus?.getAttribute('aria-expanded') ?? null;
    returnFocus?.setAttribute('aria-expanded', 'true');
    dialog.showModal();
    closeButton.focus({ preventScroll: true });
  };

  const close = () => {
    if (dialog.open) dialog.close();
  };

  const onRootClick = event => {
    const opener = event.target.closest?.('[data-fsd-breeze-open]');
    if (opener && root.contains(opener)) {
      event.preventDefault();
      open(opener);
      return;
    }
    if (!dialog.contains(event.target)) return;
    const swatch = event.target.closest?.('[data-breeze-variant]');
    if (swatch) {
      const next = options.find(variant => String(variant.id) === swatch.dataset.breezeVariant);
      if (next && next !== requestedVariant) changeImage(next, selectedView(next));
      return;
    }
    const viewButton = event.target.closest?.('[data-breeze-view]');
    if (viewButton) {
      const chosen = views.find(view => String(view.id) === viewButton.dataset.breezeView);
      const variant = requestedVariant;
      const next = variant.views.find(view => String(view.id) === viewButton.dataset.breezeView)
        || variant.views.find(view => String(view.label).toLowerCase() === String(chosen?.label).toLowerCase());
      if (next && next !== requestedView) changeImage(variant, next);
      return;
    }
    if (event.target.closest?.('[data-breeze-close]')) close();
  };

  const onDialogClick = event => {
    if (event.target === dialog) close();
  };
  const onDialogClose = () => {
    if (!destroyed) restoreOpener();
  };
  const onDialogCancel = event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    close();
  };
  const onDialogKeydown = event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target.closest?.('[data-breeze-view], [data-breeze-variant]');
    if (!target) return;
    const group = target.matches('[data-breeze-view]')
      ? [...dialog.querySelectorAll('[data-breeze-view]')]
      : [...dialog.querySelectorAll('[data-breeze-variant]')];
    const index = group.indexOf(target);
    let nextIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % group.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + group.length) % group.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = group.length - 1;
    else return;
    event.preventDefault();
    group[nextIndex].focus({ preventScroll: true });
    group[nextIndex].click();
  };

  root.append(dialog);
  root.addEventListener('click', onRootClick);
  dialog.addEventListener('click', onDialogClick);
  dialog.addEventListener('close', onDialogClose);
  dialog.addEventListener('cancel', onDialogCancel);
  dialog.addEventListener('keydown', onDialogKeydown);

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
      dialog.removeEventListener('keydown', onDialogKeydown);
      if (dialog.open) dialog.close();
      dialog.remove();
      restoreOpener();
    },
  };
}
