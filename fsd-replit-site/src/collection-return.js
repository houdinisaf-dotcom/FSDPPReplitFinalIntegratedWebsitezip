export function bindCollectionReturn(root = document) {
  const onClick = event => {
    const link = event.target.closest?.('[data-collection-return]');
    if (!link || !root.contains(link)) return;

    let referrer;
    try {
      referrer = new URL(document.referrer);
    } catch {
      return;
    }

    const cameFromFsdHome = referrer.origin === window.location.origin
      && (referrer.pathname === '/' || referrer.pathname.endsWith('/index.html'))
      && window.location.pathname !== referrer.pathname;

    if (cameFromFsdHome && window.history.length > 1) {
      event.preventDefault();
      window.history.back();
    }
  };

  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
