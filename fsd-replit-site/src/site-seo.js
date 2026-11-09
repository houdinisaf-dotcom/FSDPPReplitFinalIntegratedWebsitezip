import { products, audiences } from './catalogue-data.js';
import { productImagesForDisplay } from './data/products.js';
import { CLOTHING_LINES, productBelongsToLine } from './clothing-lines.js';
import { productionOrigin } from '../site.config.js';
import { productStructuredData, productSeoPath, validatedProductionOrigin } from './product-structured-data.js';
export { productSeoPath, validatedProductionOrigin } from './product-structured-data.js';

export const SITE_NAME = 'FSD — Fitness & Self Defence';
export const DEFAULT_SOCIAL_IMAGE = '/brand/fsd-social-preview.jpg';
export const HOME_DESCRIPTION = 'Explore FSD performance apparel, women’s and men’s collections, training hardware and the House of Performance.';
export const plainText = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
export const escapeSeo = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

const byAudience = pattern => products.filter(product => pattern.test(product.audience));
export const storefrontSeoRoutes = [
  { path: '/', title: `${SITE_NAME} | Performance Apparel & Training Hardware`, description: HOME_DESCRIPTION, route: { view: 'home', target: null } },
  { path: '/shop', title: `SHOP | ${SITE_NAME}`, description: 'Browse the existing FSD catalogue, established clothing lines and product records.', route: { view: 'division-hub', target: 'shop' } },
  { path: '/story', title: `Our Story | ${SITE_NAME}`, description: 'Discover the people, purpose and discipline behind FSD, the British House of Performance.', route: { view: 'story', target: 'our-story' }, hash: '#philosophy' },
  ...[
    { path: '/hardware', title: 'Training Hardware', description: 'Explore FSD training hardware, strength equipment and accessories from the existing catalogue.', view: 'hardware', target: 'hardware', hash: '#hardware-editorial' },
    { path: '/universe', title: 'The FSD Universe', description: 'Discover FSD’s wider performance ecosystem, community and global vision.', view: 'universe', target: 'global', hash: '#universe' },
    { path: '/bio-lab', title: 'Bio-Lab™', description: 'Explore FSD Bio-Lab™ and its published material science, apparel and innovation initiatives.', view: 'bio-lab', target: 'bio-lab', hash: '#innovation-hub' },
  ].map(({ view, target, ...entry }) => ({ ...entry, title: `${entry.title} | FSD`, route: { view, target } })),
  { path: '/private-access', title: `Private Access | ${SITE_NAME}`, description: 'FSD members area, coming soon. Investor, franchise and partnership enquiries.', route: { view: 'division-hub', target: 'private-access' } },
  ...[
    { id: 'men', title: 'Men’s Collections', pattern: /^men/i },
    { id: 'women', title: 'Women’s Collections', pattern: /^women/i },
  ].map(group => ({
    path: `/collections/${group.id}`, title: `${group.title} | FSD`,
    description: `Browse ${group.title.toLowerCase()} from FSD. Explore the existing performance apparel catalogue, available colourways, sizes and product photography.`,
    products: byAudience(group.pattern),
    filter: { audience: audiences.find(value => group.pattern.test(value)) },
    route: { view: 'collection', target: group.id },
  })),
  {
    path: '/collections/accessories', title: 'Training Accessories | FSD',
    description: 'Explore FSD training accessories, bags and footwear with the existing catalogue’s product details and photography.',
    products: products.filter(product => /accessor/i.test(product.category)),
    filter: { query: 'Accessories' }, route: { view: 'collection', target: 'accessories' },
  },
  ...CLOTHING_LINES.map(line => ({
    path: `/collections/${line.id}`, title: `${line.title} Collection | FSD`,
    description: `Discover the FSD ${line.title} collection. Browse its existing products, mapped photographs, colourways and product details.`,
    products: products.filter(product => productBelongsToLine(product, line.id)),
    hash: `#line-${line.id}`, route: { view: 'collection', target: `line-${line.id}` },
  })),
  ...products.map(product => ({
    path: productSeoPath(product), title: `${plainText(product.name)} | FSD`,
    description: plainText(product.description).slice(0, 170)
      || `Explore ${plainText(product.name)} from FSD, with the existing product specifications, colourways, sizes and mapped photography.`,
    image: productImagesForDisplay(product)[0]?.src,
    imageAlt: `${plainText(product.name)} — FSD catalogue photography`,
    product, route: { view: 'product', target: String(product.id) },
  })),
];

export function seoEntryForPath(pathname = '/') {
  const path = String(pathname).replace(/\/+$/, '') || '/';
  return storefrontSeoRoutes.find(entry => entry.path === path) || null;
}

export function seoForView(view = {}) {
  if (view.view === 'product') return storefrontSeoRoutes.find(entry => entry.product?.id === Number(view.target));
  if (view.view === 'collection') return storefrontSeoRoutes.find(entry => entry.route.view === 'collection' && entry.route.target === view.target);
  if (view.view === 'division-hub') {
    const landingPath = {
      shop: '/shop',
      universe: '/universe',
      'bio-lab': '/bio-lab',
      hardware: '/hardware',
      'private-access': '/private-access',
    }[view.target];
    return seoEntryForPath(landingPath || '/shop');
  }
  if (view.view === 'page' && view.target === 'innovation-hub') return seoEntryForPath('/bio-lab');
  if (view.view === 'story') return seoEntryForPath('/story');
  if (view.view === 'house') return {
    path: '/the-house.html',
    title: `THE HOUSE | ${SITE_NAME}`,
    description: 'Explore the FSD House, its existing destinations and mapped concepts.',
    route: view,
  };
  if (['hardware', 'universe', 'bio-lab'].includes(view.view)) return storefrontSeoRoutes.find(entry => entry.route.view === view.view);
  return null;
}

export function seoHeadMarkup(entry, configuredOrigin = productionOrigin) {
  const origin = validatedProductionOrigin(configuredOrigin);
  const title = escapeSeo(entry.title);
  const description = escapeSeo(entry.description);
  const image = entry.image || DEFAULT_SOCIAL_IMAGE;
  const imageUrl = origin ? new URL(image, origin).href : image;
  const canonical = origin ? new URL(entry.path, origin).href : null;
  const alt = escapeSeo(entry.imageAlt || 'FSD performance apparel and training — approved campaign photography.');
  return `<title>${title}</title>
    <meta name="description" content="${description}">
    <meta property="og:type" content="${entry.product ? 'product' : 'website'}">
    <meta property="og:site_name" content="${escapeSeo(SITE_NAME)}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${escapeSeo(imageUrl)}">
    <meta property="og:image:alt" content="${alt}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${escapeSeo(imageUrl)}">
    <meta name="twitter:image:alt" content="${alt}">
    ${/^\/(?:private|admin|cart|checkout)(?:[-/.]|$)/i.test(entry.path) ? '<meta name="robots" content="noindex, nofollow">' : ''}
    ${canonical ? `<link rel="canonical" href="${escapeSeo(canonical)}"><meta property="og:url" content="${escapeSeo(canonical)}">` : ''}
    ${structuredDataMarkup(entry, origin)}`;
}

export function structuredDataMarkup(entry, origin = productionOrigin) {
  const verified = validatedProductionOrigin(origin);
  const graph = [];
  if (entry.product) graph.push(productStructuredData(entry.product, { origin: verified }));
  if (entry.products) graph.push({
    '@type': 'CollectionPage', name: plainText(entry.title), description: entry.description,
    ...(verified ? { url: `${verified}${entry.path}` } : {}),
    mainEntity: { '@type': 'ItemList', numberOfItems: entry.products.length,
      itemListElement: entry.products.map((product, index) => ({
        '@type': 'ListItem', position: index + 1, item: {
          '@type': 'Product', name: product.name,
          ...(verified ? { url: `${verified}${productSeoPath(product)}` } : {}),
        },
      })),
    },
  });
  // Breadcrumb item URLs must be real absolute public URLs, never preview guesses.
  if (verified && entry.path !== '/' && (entry.product || entry.products)) {
    const parent = entry.product && storefrontSeoRoutes.find(candidate => candidate.products?.some(p => p.id === entry.product.id));
    const items = [{ name: 'FSD', path: '/' }, ...(parent ? [{ name: parent.title, path: parent.path }] : []),
      { name: entry.product?.name || entry.title, path: entry.path }];
    graph.push({ '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.name, item: `${verified}${item.path}`,
    })) });
  }
  return graph.length ? `<script type="application/ld+json" data-fsd-page-schema>${JSON.stringify({
    '@context': 'https://schema.org', '@graph': graph,
  }).replace(/</g, '\\u003c')}</script>` : '';
}

export function applySeoToHtml(html, entry, origin = productionOrigin) {
  let cleaned = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<script\b[^>]*data-fsd-page-schema[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<link\b[^>]*rel=["'](?:icon|apple-touch-icon|manifest)["'][^>]*>/gi, '')
    .replace(/<meta\b[^>]*(?:name=["'](?:description|twitter:[^"']+)["']|property=["']og:[^"']+["'])[^>]*>/gi, '')
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, '');
  if (/^\/(?:private|admin|cart|checkout)(?:[-/.]|$)/i.test(entry.path)) {
    cleaned = cleaned.replace(/<meta\b[^>]*name=["']robots["'][^>]*>/gi, '');
  }
  return cleaned.replace(/<\/head>/i, `${seoHeadMarkup(entry, origin)}
    <link rel="icon" type="image/svg+xml" sizes="any" href="/favicon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="/brand/favicon-16.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/brand/favicon-32.png">
    <link rel="icon" type="image/png" sizes="48x48" href="/brand/favicon-48.png">
    <link rel="icon" type="image/png" sizes="64x64" href="/brand/favicon-64.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/brand/apple-touch-icon.png">
    <link rel="manifest" href="/site.webmanifest">
  </head>`);
}

export function updateDocumentSeo(document, entry) {
  if (!entry) return;
  const template = document.createElement('template');
  template.innerHTML = seoHeadMarkup(entry);
  document.head.querySelectorAll('title,meta[name="description"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],script[data-fsd-page-schema]').forEach(node => node.remove());
  document.head.append(...template.content.childNodes);
}
