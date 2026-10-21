import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { products, safe, priceInfo } from '../src/catalogue-data.js';
import { productPageInfo } from '../src/product-seo.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const template = await readFile(resolve(root, 'dist/index.html'), 'utf8');
for (const product of products) {
  const info = productPageInfo(product);
  const price = priceInfo(product);
  const image = product.images[0];
  const fallback = `<main><p>FSD / PRE-LAUNCH CATALOGUE</p><h1>${safe(product.name)}</h1>${image ? `<img src="${safe(image.src)}" alt="${safe(image.alt || image.label)}" width="${image.width}" height="${image.height}" style="max-width:100%;height:auto"/>` : '<p>Approved imagery to follow.</p>'}<p>${safe(product.collection)} · ${safe(product.category)}</p><p>${safe(product.colourways)}</p><p>${safe(product.catalogue.description || '')}</p><p>${safe(product.specifications)}</p><p>${safe(price.label)}: ${safe(price.value)}</p><p>Pre-launch record only. Not available to purchase. Specifications, sizing and availability require approval.</p><a href="/#products">Product catalogue</a> · <a href="/#collections">FSD collections</a></main>`;
  const html = template.replace(/<title>.*?<\/title>/, `<title>${safe(info.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${safe(info.description)}">`)
    .replace('<div id="app"></div>', `<div id="app">${fallback}</div>`);
  const destination = resolve(root, `dist${info.url}`);
  await mkdir(destination, { recursive: true });
  await writeFile(resolve(destination, 'index.html'), html);
}
console.log(`Pre-rendered ${products.length} existing/reviewed product URLs. No private drafts or Product/Offer structured-data claims included.`);
