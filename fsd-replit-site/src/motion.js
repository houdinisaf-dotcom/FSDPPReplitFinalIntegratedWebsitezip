const DEFAULT_TOKENS = Object.freeze({
  micro: 180,
  panel: 300,
  reveal: 520,
  easing: 'cubic-bezier(.22, .72, .24, 1)',
});
let motionTokens = DEFAULT_TOKENS;
const activeAnimations = new Map();
let finishPanelExit = null;

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const canAnimate = () =>
  typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function' && !reducedMotion();

function parseDuration(value, fallback) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  return value.trim().endsWith('ms') ? parsed : parsed * 1000;
}

function readMotionTokens() {
  try {
    const styles = getComputedStyle(document.documentElement);
    const easing = styles.getPropertyValue('--fsd-motion-ease').trim();
    return {
      micro: parseDuration(styles.getPropertyValue('--fsd-motion-micro').trim(), DEFAULT_TOKENS.micro),
      panel: parseDuration(styles.getPropertyValue('--fsd-motion-panel').trim(), DEFAULT_TOKENS.panel),
      reveal: parseDuration(styles.getPropertyValue('--fsd-motion-reveal').trim(), DEFAULT_TOKENS.reveal),
      easing: easing || DEFAULT_TOKENS.easing,
    };
  } catch {
    return DEFAULT_TOKENS;
  }
}

function cancelAnimations(kind) {
  activeAnimations.forEach((animation, activeKind) => {
    if (!kind || kind === activeKind || (Array.isArray(kind) && kind.includes(activeKind))) {
      try { animation.cancel(); } catch { /* Best-effort cleanup. */ }
      activeAnimations.delete(animation);
    }
  });
}

const animate = (element, keyframes, duration, delay = 0, kind = 'reveal') => {
  if (!element || !canAnimate()) return null;
  try {
    const animation = element.animate(keyframes, {
      duration,
      delay,
      easing: motionTokens.easing,
      fill: 'none',
    });
    activeAnimations.set(animation, kind);
    const release = () => activeAnimations.delete(animation);
    animation.addEventListener?.('finish', release, { once: true });
    animation.addEventListener?.('cancel', release, { once: true });
    return animation;
  } catch {
    return null;
  }
};

function revealHomepage() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const image = hero.querySelector('.hero-image');
  if (image) {
    const restingOpacity = Number.parseFloat(getComputedStyle(image).opacity) || 1;
    animate(image, [
      { opacity: restingOpacity * 0.65, transform: 'scale(1.025)' },
      { opacity: restingOpacity, transform: 'scale(1)' },
    ], motionTokens.reveal * 1.15, 0, 'hero');
  }
  animate(hero.querySelector('h1'), [
    { opacity: 0, transform: 'translateY(14px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ], motionTokens.reveal, motionTokens.micro * 0.4, 'hero');
  animate(hero.querySelector('.hero-actions'), [
    { opacity: 0, transform: 'translateY(8px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ], motionTokens.reveal * 0.8, motionTokens.micro * 0.85, 'hero');
}

function observeEditorialSections() {
  if (typeof IntersectionObserver !== 'function' || !canAnimate()) return;
  const targets = document.querySelectorAll(
    '.showroom-featured, .manifesto, .showroom-vip, .fsd-showcase-heading, .fsd-showcase-note',
  );
  if (!targets.length) return;
  let observer;
  try {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        try { observer.unobserve(entry.target); } catch { /* Keep revealed content visible. */ }
        animate(entry.target, [
          { opacity: 0.72, transform: 'translateY(12px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], motionTokens.reveal);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    targets.forEach(target => observer.observe(target));
  } catch {
    try { observer?.disconnect(); } catch { /* Observation is optional. */ }
  }
}

function markActiveNavigation() {
  const links = [...document.querySelectorAll('.header nav a[href^="#"]')];
  if (!links.length || typeof IntersectionObserver !== 'function') return;
  const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (!sections.length) return;
  let observer;
  try {
    observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach(link => {
        const active = link.getAttribute('href') === `#${visible.target.id}`;
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-22% 0px -66% 0px', threshold: [0, 0.1, 0.35] });
    sections.forEach(section => observer.observe(section));
  } catch {
    try { observer?.disconnect(); } catch { /* Navigation continues to use native links. */ }
  }
}

function nearViewport(item, container, margin = 120) {
  const itemRect = item.getBoundingClientRect();
  const rootRect = container.getBoundingClientRect();
  return itemRect.bottom >= rootRect.top - margin &&
    itemRect.top <= rootRect.bottom + margin &&
    itemRect.right >= rootRect.left - margin &&
    itemRect.left <= rootRect.right + margin;
}

function stagger(container, selector, duration, kind) {
  if (!container || !canAnimate()) return;
  const step = motionTokens.micro * 0.12;
  const delayCap = motionTokens.micro * 0.65;
  const candidates = [...container.querySelectorAll(selector)]
    .filter(item => nearViewport(item, container) &&
      !item.contains(document.activeElement) && item !== document.activeElement)
    .slice(0, 8);
  candidates.forEach((item, index) => {
    animate(item, [
      { opacity: 0.72, transform: 'translateY(7px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], duration, Math.min(index * step, delayCap), kind);
  });
}

function initPanelMotion() {
  const dialog = document.querySelector('[data-showcase-dialog]');
  if (!dialog) return;
  const content = dialog.querySelector('[data-dialog-content]');
  let closing = false;
  let closeTimer = 0;
  let panelAnimation = null;
  let frameAnimation = null;
  const exitKinds = ['panel-enter', 'frame-enter', 'stagger'];

  const clearPanelAnimations = () => {
    window.clearTimeout(closeTimer);
    [panelAnimation, frameAnimation].forEach(animation => {
      try { animation?.cancel(); } catch { /* Already finished. */ }
    });
    panelAnimation = null;
    frameAnimation = null;
    cancelAnimations(exitKinds);
  };

  const finishClose = () => {
    if (!closing || !dialog.open) return;
    clearPanelAnimations();
    dialog.close();
  };
  finishPanelExit = finishClose;

  const closeWithMotion = () => {
    if (closing || !dialog.open) return;
    closing = true;
    clearPanelAnimations();
    if (!canAnimate()) {
      finishClose();
      return;
    }
    try {
      const mobile = window.matchMedia('(max-width: 760px)').matches;
      const finalTransform = getComputedStyle(dialog).transform;
      const exitTransform = mobile ? 'translateY(10px)' : 'translate(-50%, -48%) scale(.985)';
      panelAnimation = animate(dialog, [
        { opacity: 1, transform: finalTransform },
        { opacity: 0, transform: exitTransform },
      ], motionTokens.panel * 0.93, 0, 'panel-exit');
      frameAnimation = animate(dialog.querySelector('.fsd-dialog-frame'), [
        { transform: 'translateY(0)' },
        { transform: 'translateY(6px)' },
      ], motionTokens.panel * 0.93, 0, 'frame-exit');
      if (!panelAnimation) {
        finishClose();
        return;
      }
      panelAnimation.addEventListener?.('finish', finishClose, { once: true });
      closeTimer = window.setTimeout(finishClose, motionTokens.panel + 80);
    } catch {
      finishClose();
    }
  };

  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeWithMotion();
  });
  dialog.addEventListener('click', event => {
    if (closing && event.target !== dialog) event.stopImmediatePropagation();
  }, true);

  document.addEventListener('fsd:dialog-render', () => {
    if (!dialog.open || closing) return;
    cancelAnimations('stagger');
    stagger(content, '.fsd-group-tab, .fsd-subcategory-nav button', motionTokens.micro, 'stagger');
    stagger(content, '.fsd-product-card, .fsd-concept-card', motionTokens.micro * 1.2, 'stagger');
  });

  document.addEventListener('fsd:dialog-open', () => {
    closing = false;
    clearPanelAnimations();
    stagger(content, '.fsd-group-tab, .fsd-subcategory-nav button', motionTokens.micro, 'stagger');
    stagger(content, '.fsd-product-card, .fsd-concept-card', motionTokens.micro * 1.2, 'stagger');
    if (!canAnimate()) return;
    try {
      const mobile = window.matchMedia('(max-width: 760px)').matches;
      const finalTransform = getComputedStyle(dialog).transform;
      const startTransform = mobile ? 'translateY(12px)' : 'translate(-50%, -48%) scale(.985)';
      panelAnimation = animate(dialog, [
        { opacity: 0, transform: startTransform },
        { opacity: 1, transform: finalTransform },
      ], motionTokens.panel, 0, 'panel-enter');
      frameAnimation = animate(dialog.querySelector('.fsd-dialog-frame'), [
        { transform: 'translateY(6px)' },
        { transform: 'translateY(0)' },
      ], motionTokens.panel, 0, 'frame-enter');
    } catch {
      cancelAnimations(['panel-enter', 'frame-enter']);
    }
  });

  document.addEventListener('fsd:dialog-close-request', event => {
    if (!dialog.open) return;
    try {
      closeWithMotion();
      event.preventDefault();
    } catch {
      /* The collection owner falls back to native close when this listener cannot handle it. */
    }
  });
  dialog.addEventListener('close', () => {
    closing = false;
    clearPanelAnimations();
  });
}

function watchReducedMotionChanges() {
  let query;
  try {
    query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return;
    const handleChange = event => {
      if (!event.matches) return;
      cancelAnimations();
      finishPanelExit?.();
    };
    if (query.addEventListener) query.addEventListener('change', handleChange);
    else query.addListener?.(handleChange);
  } catch {
    /* CSS reduced-motion rules remain active even when media-query events are unavailable. */
  }
}

export function initMotion() {
  motionTokens = readMotionTokens();
  [
    revealHomepage,
    observeEditorialSections,
    markActiveNavigation,
    initPanelMotion,
    watchReducedMotionChanges,
  ].forEach(initialize => {
    try { initialize(); } catch { /* Motion is optional; content and native controls remain usable. */ }
  });
}
