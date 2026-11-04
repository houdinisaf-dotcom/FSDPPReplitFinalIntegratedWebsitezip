import { productImagesForDisplay } from './data/products.js';
import { productionOrigin } from '../site.config.js';

const text = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const confirmed = value => Boolean(value) && !/^\[?(?:to confirm|tbc|pending)\]?$/i.test(String(value).trim());
const tokens = value => (Array.isArray(value) ? value : String(value || '').split(/[;,]/).map(v => v.trim())).filter(confirmed);
export const productSeoPath = product => `/products/${text(product.name).toLowerCase()
  .normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${product.id}`;

export function validatedProductionOrigin(value) {
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/'
    || url.search || url.hash || /(^localhost$|\.replit\.dev$|^127\.|^example\.com$)/i.test(url.hostname)) {
    throw new Error('SEO requires a verified HTTPS production origin, not a preview or placeholder URL.');
  }
  return url.origin;
}

export function productStructuredData(product, {
  images = productImagesForDisplay(product), colourways = tokens(product.colourways),
  sizes = tokens(String(product.sizes || '').replaceAll('/', ';')), origin = productionOrigin,
} = {}) {
  colourways = tokens(colourways);
  sizes = tokens(sizes);
  const verified = validatedProductionOrigin(origin);
  const imageUrl = src => verified ? new URL(src, verified).href : src;
  const path = productSeoPath(product);
  const price = Number(product.confirmedPrice);
  const availability = {
    instock: 'https://schema.org/InStock', outofstock: 'https://schema.org/OutOfStock',
    preorder: 'https://schema.org/PreOrder', backorder: 'https://schema.org/BackOrder',
  }[String(product.availability || '').toLowerCase()];
  const hasVariants = colourways.length > 0 || sizes.length > 0;
  return {
    '@context': 'https://schema.org', '@type': hasVariants ? 'ProductGroup' : 'Product',
    ...(verified ? { '@id': `${verified}${path}#product`, url: `${verified}${path}` } : {}),
    ...(hasVariants ? { productGroupID: String(product.id) } : {}),
    name: text(product.name), ...(product.description ? { description: text(product.description) } : {}),
    brand: { '@type': 'Brand', name: 'FSD' },
    ...(confirmed(product.sku) ? { sku: product.sku } : {}),
    ...(images.length ? { image: images.map(image => imageUrl(image.src)).filter(Boolean) } : {}),
    ...(colourways.length ? { color: colourways } : {}), ...(sizes.length ? { size: sizes } : {}),
    ...(price > 0 ? { additionalProperty: [{ '@type': 'PropertyValue', name: 'Published price', value: price.toFixed(2), unitText: 'GBP' }] } : {}),
    ...(price > 0 && availability ? { offers: { '@type': 'Offer', priceCurrency: 'GBP', price: price.toFixed(2), availability } } : {}),
    ...(hasVariants ? {
      variesBy: [...(colourways.length ? ['https://schema.org/color'] : []), ...(sizes.length ? ['https://schema.org/size'] : [])],
      hasVariant: (sizes.length ? sizes : ['']).flatMap(size => (colourways.length ? colourways : ['']).map(colour => ({
        '@type': 'Product', name: [text(product.name), colour, size].filter(Boolean).join(' — '),
        ...(size ? { size } : {}), ...(colour ? { color: colour } : {}),
        brand: { '@type': 'Brand', name: 'FSD' },
        ...(images.length ? { image: [imageUrl(images.find(image => image.colourway === colour)?.src || images[0].src)] } : {}),
      }))),
    } : {}),
  };
}
