import './house-editorial.css';

const MEDIA_SELECTOR = '[data-fsd-house-media-slot]';

function getDocument(root) {
  if (root?.nodeType === 9) return root;
  return root?.ownerDocument || globalThis.document || null;
}

function isNotReady(root, document) {
  const candidates = [
    root?.getAttribute?.('data-fsd-status'),
    root?.getAttribute?.('data-fsd-draft-status'),
    document?.body?.getAttribute('data-fsd-status'),
    document?.body?.getAttribute('data-fsd-draft-status'),
    document?.documentElement?.getAttribute('data-fsd-status'),
    document?.documentElement?.getAttribute('data-fsd-draft-status'),
  ];
  return candidates.some(value => String(value || '').trim().toUpperCase() === 'NOT READY');
}

function findHost(root, document) {
  if (root?.nodeType === 1) return root;
  return document?.body || null;
}

function markEditorialStructures(host) {
  const selectors = [
    '.hero',
    '#hero',
    'main',
    '.fsd > section',
    '.investor-card',
    '.content-section',
    '.house-sections',
    '.sub-nav',
  ];
  for (const selector of selectors) {
    host.querySelectorAll(selector).forEach(element => {
      element.setAttribute('data-fsd-editorial-region', '');
      if (element.matches('.hero, #hero')) {
        element.setAttribute('data-fsd-house-media-slot', '');
      }
    });
  }
}

function mountDraftRibbon(host, document) {
  if (host.querySelector('[data-fsd-house-draft-ribbon]')) return;
  const ribbon = document.createElement('aside');
  ribbon.className = 'fsd-house-draft-ribbon';
  ribbon.setAttribute('data-fsd-house-draft-ribbon', '');
  ribbon.setAttribute('role', 'status');
  ribbon.textContent = 'Internal review · NOT READY';
  const navigation = host.querySelector('[data-fsd-standalone-navigation]');
  if (navigation?.parentNode) navigation.parentNode.insertBefore(ribbon, navigation.nextSibling);
  else host.insertBefore(ribbon, host.firstChild);
}

/**
 * Mount FSD's shared House editorial layer on an existing House page.
 * The helper only adds presentation hooks; it does not replace page content,
 * navigation, logos, or route behavior.
 *
 * @param {object} options
 * @param {Document|Element} [options.root=document] Host document or page root.
 * @param {boolean} [options.development=false] Explicit development-mode opt-in.
 * @param {Array<{target: Element|string, label: string}>} [options.reviewSlots]
 *        Internal-only review notes for absent approved assets. Never public.
 * @returns {{ mounted: boolean, unmount: () => void }}
 */
export function mountHouseEditorial({
  root = globalThis.document,
  development = false,
  reviewSlots = [],
} = {}) {
  const document = getDocument(root);
  const host = findHost(root, document);
  if (!document || !host) return { mounted: false, unmount() {} };

  document.body?.setAttribute('data-fsd-house-editorial', 'true');
  markEditorialStructures(host);

  const inserted = [];
  if (development && isNotReady(root, document)) {
    mountDraftRibbon(host, document);
    const ribbon = host.querySelector('[data-fsd-house-draft-ribbon]');
    if (ribbon) inserted.push(ribbon);
  }

  if (development && Array.isArray(reviewSlots)) {
    for (const slot of reviewSlots) {
      if (!slot || typeof slot.label !== 'string' || !slot.label.trim()) continue;
      const target = typeof slot.target === 'string'
        ? host.querySelector(slot.target)
        : slot.target;
      if (!target || target.ownerDocument !== document) continue;
      const note = document.createElement('aside');
      note.className = 'fsd-house-review-slot';
      note.setAttribute('data-fsd-internal-review-only', '');
      note.setAttribute('role', 'note');
      const heading = document.createElement('strong');
      heading.textContent = 'Internal review only';
      const detail = document.createElement('span');
      detail.textContent = slot.label.trim();
      note.append(heading, detail);
      target.append(note);
      inserted.push(note);
    }
  }

  return {
    mounted: true,
    unmount() {
      inserted.forEach(element => element.remove());
      document.body?.removeAttribute('data-fsd-house-editorial');
    },
  };
}

/**
 * Add one approved image to an existing hero. No image is created when no
 * approved source is supplied; missing media is not represented publicly.
 * `desktop` and `mobile` accept { src, alt, position }.
 */
export function mountApprovedHouseMedia({
  hero,
  desktop,
  mobile,
  caption = '',
} = {}) {
  if (!hero || !hero.ownerDocument) return null;
  const document = hero.ownerDocument;
  const desktopSource = validSource(desktop);
  const mobileSource = validSource(mobile);
  const fallback = desktopSource || mobileSource;
  if (!fallback) return null;

  const figure = document.createElement('figure');
  figure.className = 'fsd-house-media';
  figure.setAttribute('data-fsd-house-media-slot', '');

  const picture = document.createElement('picture');
  if (mobileSource) {
    const source = document.createElement('source');
    source.media = '(max-width: 760px)';
    source.srcset = mobileSource.src;
    picture.append(source);
  }

  const image = document.createElement('img');
  image.src = fallback.src;
  image.alt = fallback.alt;
  image.loading = 'eager';
  image.decoding = 'async';
  image.style.objectPosition = fallback.position;
  if (mobileSource) {
    image.style.setProperty('--fsd-house-mobile-focal', mobileSource.position);
    const mediaQuery = document.defaultView?.matchMedia?.('(max-width: 760px)');
    const syncMobileAlt = event => {
      const isMobile = event?.matches ?? mediaQuery?.matches;
      image.alt = isMobile ? mobileSource.alt : (desktopSource?.alt || mobileSource.alt);
      image.style.objectPosition = isMobile ? mobileSource.position : fallback.position;
    };
    syncMobileAlt();
    mediaQuery?.addEventListener?.('change', syncMobileAlt);
    figure._fsdCleanup = () => mediaQuery?.removeEventListener?.('change', syncMobileAlt);
  }
  picture.append(image);
  figure.append(picture);

  if (caption.trim()) {
    const figcaption = document.createElement('figcaption');
    figcaption.textContent = caption.trim();
    figure.append(figcaption);
  }
  hero.insertBefore(figure, hero.firstChild);
  return figure;
}

function validSource(source) {
  if (!source || typeof source.src !== 'string' || !source.src.trim()) return null;
  if (typeof source.alt !== 'string' || !source.alt.trim()) return null;
  return {
    src: source.src.trim(),
    alt: source.alt.trim(),
    position: typeof source.position === 'string' && source.position.trim()
      ? source.position.trim()
      : '50% 50%',
  };
}

/**
 * Enhance media slots declared directly in host markup:
 * data-fsd-house-media-slot + data-desktop-src / data-desktop-alt,
 * with optional data-mobile-src, data-mobile-alt, data-focal and data-caption.
 */
export function mountDeclaredHouseMedia(root = globalThis.document) {
  const document = getDocument(root);
  const host = findHost(root, document);
  if (!host) return [];
  const mounted = [];

  host.querySelectorAll(MEDIA_SELECTOR).forEach(slot => {
    if (slot.querySelector('img')) return;
    const desktop = sourceFromAttributes(slot, 'desktop');
    const mobile = sourceFromAttributes(slot, 'mobile');
    const existingHero = slot.matches('.hero, #hero')
      ? slot
      : slot.closest('.hero, #hero');
    if (!existingHero) return;
    const figure = mountApprovedHouseMedia({
      hero: existingHero,
      desktop,
      mobile,
      caption: slot.getAttribute('data-caption') || '',
    });
    if (figure) {
      slot.setAttribute('data-fsd-house-media-mounted', '');
      mounted.push(figure);
    }
  });
  return mounted;
}

function sourceFromAttributes(element, prefix) {
  const src = element.getAttribute(`data-${prefix}-src`);
  const alt = element.getAttribute(`data-${prefix}-alt`);
  if (!src || !alt) return null;
  return {
    src,
    alt,
    position: element.getAttribute(`data-${prefix}-focal`)
      || element.getAttribute('data-focal')
      || '50% 50%',
  };
}
