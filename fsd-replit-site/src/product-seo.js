let original = null;
export function productPageInfo(product) {
  return {
    title: product.catalogue.seo.title,
    description: product.catalogue.seo.description,
    url: `/products/${product.id}/${product.catalogue.seo.slug}/`,
  };
}
export function productRouteMatch(location) {
  return String(location.hash || '').match(/^#product\/(\d+)$/)
    || String(location.pathname || '').match(/^\/products\/(\d+)(?:\/[a-z0-9-]+)?\/?$/);
}
export function isProductPath(location) {
  return /^\/products\/\d+(?:\/[a-z0-9-]+)?\/?$/.test(location.pathname || '');
}
export function applyProductSEO(product) {
  if (typeof document === 'undefined' || !document.head) return;
  let description = document.querySelector('meta[name="description"]');
  if (!original) original = { title: document.title, description: description?.content ?? null };
  const info = productPageInfo(product);
  document.title = info.title;
  if (!description) {
    description = document.createElement('meta');
    description.name = 'description';
    document.head.append(description);
  }
  description.content = info.description;
}
export function restoreProductSEO() {
  if (!original || typeof document === 'undefined') return;
  document.title = original.title;
  const meta = document.querySelector('meta[name="description"]');
  if (original.description === null) meta?.remove();
  else if (meta) meta.content = original.description;
  original = null;
}
