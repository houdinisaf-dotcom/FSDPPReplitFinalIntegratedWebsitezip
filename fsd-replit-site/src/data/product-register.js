import sourceRegister from './master-product-register.json' with { type: 'json' };

export const masterProductRegister = Object.freeze(sourceRegister);
const masterProductIds = new Set(masterProductRegister.products.map(product => product.id));

export const variantSkuPolicy = Object.freeze({
  template: '{masterProductId}-{explicit-variant-key}',
  status: 'No variant SKUs assigned',
  reason: 'The supplied register contains no structured variant or SKU fields; all records are marked on_sale_verified=false.',
});

function normalizedSkuPart(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildVariantSku(masterProductId, variantParts) {
  if (!/^FSD-\d{3}$/.test(String(masterProductId)) || !masterProductIds.has(String(masterProductId))) {
    throw new TypeError('A documented FSD master product ID is required.');
  }
  const parts = (Array.isArray(variantParts) ? variantParts : [variantParts])
    .map(normalizedSkuPart)
    .filter(Boolean);
  if (!parts.length) throw new TypeError('An explicit variant key is required.');
  return `${masterProductId}-${parts.join('-')}`;
}

export function assertUniqueVariantSkus(skus) {
  const seen = new Set();
  for (const sku of skus) {
    if (typeof sku !== 'string' || !sku.trim()) {
      throw new TypeError('Every variant SKU must be a non-empty string.');
    }
    if (seen.has(sku)) throw new Error(`Duplicate variant SKU: ${sku}`);
    seen.add(sku);
  }
  return true;
}
