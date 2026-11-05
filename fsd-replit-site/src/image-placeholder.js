const PLACEHOLDER_KINDS = new Set(['product', 'collection', 'banner', 'hero', 'gallery', 'detail']);
const installedDocuments = new WeakSet();

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

export function imagePlaceholderMarkup({
  title = 'FSD image',
  variantLabel = '',
  kind = 'product',
  className = '',
} = {}) {
  const safeKind = PLACEHOLDER_KINDS.has(kind) ? kind : 'product';
  const safeClassName = String(className).split(/\s+/).filter(token => /^[a-zA-Z0-9_-]+$/.test(token)).join(' ');
  const accessibleTitle = [title, variantLabel].filter(Boolean).join(' — ');

  return `<span class="fsd-image-placeholder fsd-image-placeholder--${safeKind}${safeClassName ? ` ${safeClassName}` : ''}"
      role="img" aria-label="${escapeHTML(`${accessibleTitle} [ASSET PENDING]`)}">
    <span class="fsd-image-placeholder__mark" aria-hidden="true">FSD / ${safeKind} media</span>
    <strong class="fsd-image-placeholder__title">${escapeHTML(title)}</strong>
    ${variantLabel ? `<span class="fsd-image-placeholder__variant">${escapeHTML(variantLabel)}</span>` : ''}
    <small class="fsd-image-placeholder__note">[ASSET PENDING]</small>
  </span>`;
}

export function installImageErrorFallbacks(documentRef = document) {
  if (installedDocuments.has(documentRef)) return () => {};
  installedDocuments.add(documentRef);
  const handleImageError = event => {
    const image = event.target;
    if (image?.tagName !== 'IMG' || image.dataset.fsdImageFallback !== 'true') return;
    const parent = image.parentElement;
    if (!parent) return;
    if (image.hidden || image.closest('[hidden]')) {
      image.dataset.fsdImageFailed = 'true';
      return;
    }

    const title = image.dataset.fsdImageTitle
      || image.alt?.split(/[—–]/)[0]?.trim()
      || 'FSD image';
    const variantLabel = image.dataset.fsdImageVariant || '';
    const kind = PLACEHOLDER_KINDS.has(image.dataset.fsdImageKind)
      ? image.dataset.fsdImageKind
      : 'product';
    parent.classList.add('fsd-image-slot--failed');
    parent.querySelectorAll('[data-fsd-generated-placeholder]').forEach(existing => existing.remove());
    image.hidden = true;

    const placeholder = documentRef.createElement('span');
    placeholder.className = `fsd-image-placeholder fsd-image-placeholder--${kind} fsd-image-placeholder--fill`;
    placeholder.dataset.fsdGeneratedPlaceholder = 'true';
    placeholder.setAttribute('role', 'img');
    placeholder.setAttribute('aria-label', `${[title, variantLabel].filter(Boolean).join(' — ')} [ASSET PENDING]`);

    const mark = documentRef.createElement('span');
    mark.className = 'fsd-image-placeholder__mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = `FSD / ${kind} media`;

    const heading = documentRef.createElement('strong');
    heading.className = 'fsd-image-placeholder__title';
    heading.textContent = title;

    const note = documentRef.createElement('small');
    note.className = 'fsd-image-placeholder__note';
    note.textContent = '[ASSET PENDING]';

    placeholder.append(mark, heading);
    if (variantLabel) {
      const variant = documentRef.createElement('span');
      variant.className = 'fsd-image-placeholder__variant';
      variant.textContent = variantLabel;
      placeholder.append(variant);
    }
    placeholder.append(note);
    parent.append(placeholder);

    image.addEventListener('load', () => {
      image.hidden = false;
      placeholder.remove();
      parent.classList.remove('fsd-image-slot--failed');
      delete image.dataset.fsdImageFailed;
    }, { once: true });
  };

  documentRef.addEventListener('error', handleImageError, true);
  return () => {
    documentRef.removeEventListener('error', handleImageError, true);
    installedDocuments.delete(documentRef);
  };
}
