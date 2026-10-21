const ROUTE = /^#bio-lab(?:\/([^?/#]+))?(?:\?(.*))?$/;
const TABS = ['overview', 'training', 'recovery', 'devices', 'insights'];
const PERIODS = [7, 30, 90];

function parseRoute(hash) {
  const match = String(hash || '').match(ROUTE);
  if (!match) return null;
  const requestedTab = match[1] || 'overview';
  const params = new URLSearchParams(match[2] || '');
  const requestedPeriod = Number(params.get('period') || 7);
  return {
    tab: TABS.includes(requestedTab) ? requestedTab : 'overview',
    period: PERIODS.includes(requestedPeriod) ? requestedPeriod : 7,
    canonical: `#bio-lab/${TABS.includes(requestedTab) ? requestedTab : 'overview'}?period=${PERIODS.includes(requestedPeriod) ? requestedPeriod : 7}`,
    wasCanonical: hash === `#bio-lab/${requestedTab}?period=${requestedPeriod}`,
  };
}

function dashboardRouteFromProduct() {
  if (!/^#product\/\d+$/.test(location.hash)) return null;
  const source = history.state?.fsdSourceURL || '';
  try { return parseRoute(new URL(source, location.href).hash); }
  catch { return null; }
}

export function initBioLab({ products = [] } = {}) {
  const home = document.querySelector('main#home');
  const footer = document.querySelector('#app > footer');
  if (!home || !footer) return;
  const host = document.createElement('main');
  host.id = 'bio-lab-dashboard';
  host.className = 'bio-lab-dashboard';
  host.hidden = true;
  host.setAttribute('data-bio-lab-dashboard', '');
  host.setAttribute('aria-label', 'FSD Bio-Lab demonstration dashboard');
  document.querySelector('.header')?.insertAdjacentElement('afterend', host);

  let instance = null;
  let loadingRequest = 0;
  let activeRoute = null;
  let previousHash = location.hash;
  let entryHash = null;
  let entryScrollY = 0;
  let sourceFocus = null;
  let restoreSourceOnLeave = false;

  const sameRoute = (a, b) => a?.tab === b?.tab && a?.period === b?.period;
  const visible = value => {
    host.hidden = !value;
    home.hidden = value;
    footer.hidden = value;
    document.body.classList.toggle('bio-lab-page-active', value);
  };
  const routeURL = route => `#bio-lab/${route.tab}?period=${route.period}`;

  async function enter(route, { cameFromHash = false, force = false } = {}) {
    const firstView = host.hidden;
    if (cameFromHash && host.hidden && entryHash === null && !parseRoute(previousHash) && !/^#product\//.test(previousHash)) {
      entryHash = previousHash;
      entryScrollY = window.scrollY;
      sourceFocus = document.activeElement;
    }
    visible(true);
    // This is an explicit page destination, unlike opening a collection menu.
    // Do not inherit a distant storefront scroll position on first entry.
    if (firstView) window.scrollTo({ top: 0, behavior: 'instant' });
    if (route.canonical !== location.hash) history.replaceState(history.state, '', route.canonical);
    if (instance && !force) {
      if (!sameRoute(activeRoute, route)) {
        activeRoute = route;
        instance.navigate(route);
      }
      return;
    }
    const request = ++loadingRequest;
    activeRoute = route;
    if (instance) instance.destroy();
    host.onclick = null;
    host.innerHTML = `<section class="bl-loading" aria-label="Loading demonstration experience"><div class="bl-skeleton bl-skeleton-title"></div><div class="bl-skeleton bl-skeleton-row"></div><p>PREPARING THE BIO-LAB EXPERIENCE</p></section>`;
    try {
      const module = await import('./dashboard.js');
      if (request !== loadingRequest || host.hidden) return;
      instance = module.mountDashboard(host, {
        route,
        products,
        onNavigate(next, focus) {
          const normalized = {
            tab: TABS.includes(next.tab) ? next.tab : 'overview',
            period: PERIODS.includes(next.period) ? next.period : 7,
          };
          if (sameRoute(activeRoute, normalized)) return;
          history.pushState({ ...(history.state || {}), bioLab: normalized }, '', routeURL(normalized));
          activeRoute = { ...normalized, canonical: routeURL(normalized) };
          instance?.navigate(activeRoute, focus);
        },
        onExit() {
          restoreSourceOnLeave = true;
          // An explicit destination, not a guessed history distance: Back and
          // Forward may already have moved through any number of dashboard tabs.
          location.hash = entryHash || '#collections';
        },
      });
    } catch (error) {
      if (request !== loadingRequest) return;
      host.innerHTML = `<div class="bl-demo-banner"><span class="bl-demo-dot"></span><strong>BIO-LAB DEMO — SIMULATED DATA</strong><span>LOCAL SAMPLE · NO DEVICE CONNECTION</span></div><section class="bl-error" role="alert"><span>FSD / BIO-LAB</span><h2>The experience could not be opened.</h2>
        <p>The dashboard module failed to load. Your storefront remains available.</p><button type="button" data-bl-lazy-retry>RETRY</button>
        <button type="button" data-bio-lab-exit>RETURN TO FSD</button><small>${String(error?.message || 'Module loading error').replace(/[&<>"']/g, '')}</small></section>`;
      host.onclick = event => {
        // Failed module imports are cached by the browser; a new document is
        // required for a genuine retry of the same built chunk URL.
        if (event.target.closest('[data-bl-lazy-retry]')) location.reload();
        if (event.target.closest('[data-bio-lab-exit]')) {
          restoreSourceOnLeave = true;
          location.hash = entryHash || '#collections';
        }
      };
    }
  }

  function leave() {
    if (host.hidden && !instance && !activeRoute) return;
    loadingRequest++;
    if (instance) instance.destroy();
    instance = null;
    activeRoute = null;
    visible(false);
    host.onclick = null;
    if (entryHash !== null && restoreSourceOnLeave) {
      const focus = sourceFocus;
      const scroll = entryScrollY;
      window.setTimeout(() => {
        if (!host.hidden) return;
        if (focus?.isConnected) focus.focus({ preventScroll: true });
        if (Number.isFinite(scroll)) window.scrollTo({ top: scroll, behavior: 'instant' });
      }, 0);
    } else if (/^#[\w-]+$/.test(location.hash)) {
      // The primary-navigation target was hidden when the hash changed.
      // Reveal first, then honour the visitor's explicit anchor destination.
      const target = document.getElementById(location.hash.slice(1));
      window.setTimeout(() => {
        if (host.hidden) target?.scrollIntoView({ block: 'start', behavior: 'instant' });
      }, 0);
    }
    entryHash = null;
    sourceFocus = null;
    restoreSourceOnLeave = false;
  }

  function sync({ hashChange = false, fromHistory = false } = {}) {
    const route = parseRoute(location.hash);
    const productSource = dashboardRouteFromProduct();
    if (route) {
      if (!route.wasCanonical) history.replaceState(history.state, '', route.canonical);
      enter(route, { cameFromHash: hashChange || fromHistory, force: false });
    } else if (productSource && instance) {
      visible(true);
    } else {
      if (fromHistory && entryHash !== null && location.hash === entryHash) restoreSourceOnLeave = true;
      leave();
    }
    previousHash = location.hash;
  }
  window.addEventListener('hashchange', () => sync({ hashChange: true }));
  window.addEventListener('popstate', () => sync({ fromHistory: true }));
  sync();
}
