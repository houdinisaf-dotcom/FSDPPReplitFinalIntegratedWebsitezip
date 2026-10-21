import assets from './catalogue-assets.json' with { type: 'json' };
export const EDITORIAL_STATUSES = Object.freeze(['Draft', 'Awaiting Images', 'Awaiting Approval', 'Approved', 'Published']);
export const IMAGE_ROLES = Object.freeze(['hero', 'front', 'back', 'side', 'detail', 'lifestyle', 'lineup', 'variant']);
const explicitCommaLists = new Set([18, 19, 26, 38, 42, 45, 47, 51]);
const slug = value => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function colourNames(product) {
  let value = String(product.colourways || '').trim();
  if (!value || /to be selected|to be confirmed|beanies and scarf/i.test(value)) return [];
  if (product.id === 18) value = value.slice(value.indexOf('(') + 1, value.lastIndexOf(')'));
  // Commas can describe one finish, not necessarily separate colour variants.
  const separator = value.includes(';') ? ';' : explicitCommaLists.has(product.id) ? ',' : null;
  return [...new Set((separator ? value.split(separator) : [value]).map(name => name.trim()).filter(Boolean))];
}

function placementFor(product) {
  if (product.id === 43) return { division: 'apparel', groupId: 'womens-modest-combat', subcategory: 'Performance Hijabs', needsApproval: false };
  if (product.category === 'Smart Tech') return { division: 'bio-lab', groupId: 'bio-lab-concepts', subcategory: null, needsApproval: false };
  if (product.category === 'Women’s Performance') return { division: 'apparel', groupId: null, subcategory: null, needsApproval: true };
  if (product.category === 'Gym Hardware and Accessories') return { division: 'hardware', groupId: null, subcategory: null, needsApproval: true };
  return { division: 'apparel', groupId: null, subcategory: null, needsApproval: true };
}

function mappedImage(asset) {
  return {
    ...asset, role: asset.roles[0],
    srcset: asset.responsive?.map(image => `${image.src} ${image.width}w`).join(', ') || '',
  };
}

/** Add editorial capabilities without changing any original source field. */
export function extendCatalogueProduct(product) {
  const mapped = assets.filter(asset => asset.productId === product.id && asset.approved && asset.approval).map(mappedImage);
  const legacy = product.images || [];
  const images = legacy.map(image => ({ ...image, ...mapped.find(asset => asset.src === image.src) }));
  for (const image of mapped) if (!images.some(existing => existing.src === image.src)) images.push(image);
  const names = colourNames(product);
  const variants = names.map((colour, index) => ({
    id: `colour-${index + 1}`, colour, sku: null, sizes: [], stock: null,
    availability: 'unconfirmed',
    images: mapped.filter(image => image.variantId === `colour-${index + 1}`),
    imageState: mapped.some(image => image.variantId === `colour-${index + 1}`) ? 'available' : 'awaiting-image',
  }));
  const imageRoles = Object.fromEntries(IMAGE_ROLES.map(role => [role, mapped.filter(image => image.roles.includes(role))]));
  const catalogue = {
    schemaVersion: 1,
    editorialStatus: images.length ? 'Awaiting Approval' : 'Awaiting Images',
    currency: 'GBP',
    price: { confirmed: product.confirmedPrice, suggested: product.suggestedPrice },
    description: null, sizes: [], variants, imageRoles,
    placement: placementFor(product),
    seo: {
      title: `${product.name} | FSD`,
      description: `${product.name}. ${product.collection}. ${product.category}. Pre-launch catalogue record; not available to purchase.`,
      slug: slug(product.name),
    },
    legacyListed: true, contentApproval: null, publishAuthorisation: null,
    purchaseEnabled: false,
  };
  return { ...product, images, catalogue };
}

export function getVariantGallery(product, variantId) {
  return (product.catalogue?.variants.find(variant => variant.id === variantId)?.images || [])
    .filter(image => image.approved && image.approval).map(image => ({ ...image }));
}

export function validateContentRecord(record, existingIds = []) {
  const errors = [];
  if (!record || typeof record !== 'object') return ['Record must be an object.'];
  if (!record.key || !/^[a-z0-9-]+$/.test(record.key)) errors.push('A stable lowercase editorial key is required.');
  if (!record.name || typeof record.name !== 'string') errors.push('A product name is required.');
  if (!EDITORIAL_STATUSES.includes(record.editorialStatus)) errors.push('Unknown editorial status.');
  if (record.id !== null && (!Number.isInteger(record.id) || record.id < 1)) errors.push('Product ID must be an existing positive integer or null for an unassigned draft.');
  if (record.currency !== 'GBP') errors.push('Currency must be GBP for this catalogue.');
  if (!Array.isArray(record.variants) || !Array.isArray(record.assetIds)) errors.push('Variants and assetIds must be arrays.');
  for (const field of ['confirmedPrice', 'suggestedPrice']) {
    if (record[field] !== null && (!Number.isFinite(record[field]) || record[field] < 0)) errors.push(`${field} must be null or a non-negative number.`);
  }
  const variants = Array.isArray(record.variants) ? record.variants : [];
  if (new Set(variants.map(variant => variant?.id)).size !== variants.length) errors.push('Variant identifiers must be unique.');
  for (const variant of variants) {
    if (!variant || typeof variant !== 'object') { errors.push('Each variant must be an object.'); continue; }
    if (!variant.id || !variant.colour || typeof variant.colour !== 'string') errors.push('Each variant needs an ID and a confirmed colour name.');
    if (!Array.isArray(variant.sizes) || variant.sizes.some(size => typeof size !== 'string') || variant.sku !== null && (typeof variant.sku !== 'string' || !variant.sku.trim())) errors.push('Variant sizes must be an array of labels; unknown SKU must be null.');
    if (variant.stock !== null && (!Number.isInteger(variant.stock) || variant.stock < 0)) errors.push('Unknown stock must be null, not an invented quantity.');
  }
  if (['Approved', 'Published'].includes(record.editorialStatus) && !record.contentApproval) errors.push('Approved content requires an explicit approval reference.');
  if (record.editorialStatus === 'Published') {
    if (!record.publishAuthorisation) errors.push('Published content requires explicit publication authorisation.');
    if (record.id === null || existingIds.includes(record.id) && record.sourceId !== record.id) errors.push('A new published supplement requires a unique assigned ID; existing master records must not be duplicated.');
    if (!record.category || !record.collection || !record.placement || record.placement.needsApproval) errors.push('Collection placement must be confirmed before publication.');
    if (!record.assetIds?.length) errors.push('An approved hero asset is required before publishing a new supplement.');
  }
  if (record.purchaseEnabled !== false) errors.push('Purchasing must remain explicitly disabled.');
  if (record.seo?.slug && !/^[a-z0-9-]{1,160}$/.test(record.seo.slug)) errors.push('SEO slugs must contain only lowercase letters, numbers and hyphens.');
  return errors;
}

export function validateAssetManifest(manifest) {
  const errors = [];
  if (!Array.isArray(manifest)) return ['Asset manifest must be an array.'];
  const ids = new Set();
  const sources = new Map();
  for (const asset of manifest) {
    if (!asset || typeof asset !== 'object') { errors.push('Every image entry must be an object.'); continue; }
    if (!/^[a-z0-9-]+$/.test(asset.id || '') || ids.has(asset.id)) errors.push(`Missing, unsafe or duplicate asset ID: ${asset.id}`);
    ids.add(asset.id);
    if (!/^\/images\/[a-z0-9/_-]+\.(png|jpe?g|webp|avif)$/.test(asset.src || '') || asset.src.includes('..')) errors.push(`Unsafe image reference: ${asset.id}`);
    if (!Array.isArray(asset.roles) || !asset.roles.length || asset.roles.some(role => !IMAGE_ROLES.includes(role))) errors.push(`Unknown image role: ${asset.id}`);
    if (!asset.alt?.trim() || !asset.label?.trim()) errors.push(`Alt text and image label required: ${asset.id}`);
    if (asset.approved && (!asset.approval?.trim() || !Number.isInteger(asset.productId) || asset.productId < 1)) errors.push(`Approved assets require an assigned product and approval reference: ${asset.id}`);
    if (!asset.variantId) errors.push(`Variant association required: ${asset.id}`);
    const association = `${asset.productId}:${asset.variantId}`;
    if (sources.has(asset.src) && sources.get(asset.src) !== association) errors.push(`One image cannot be substituted for a different product or colour: ${asset.id}`);
    sources.set(asset.src, association);
    if (asset.stagedPath && !/^content\/incoming\/[a-z0-9-]+\.(png|jpe?g|webp|avif)$/.test(asset.stagedPath)) errors.push(`Unsafe staged image path: ${asset.id}`);
    for (const image of asset.responsive || []) {
      if (!/^\/images\/responsive\/[a-z0-9-]+\.webp$/.test(image.src || '') || !Number.isInteger(image.width) || image.width < 1 || !Number.isInteger(image.height) || image.height < 1) errors.push(`Invalid responsive derivative: ${asset.id}`);
    }
  }
  return errors;
}

export function integrateReviewedRecords(baseProducts, records) {
  if (!Array.isArray(records)) throw new Error('Reviewed catalogue records must be an array.');
  const ids = baseProducts.map(product => product.id);
  const extra = [];
  const reviewed = new Map();
  for (const record of records) {
    if (!record || typeof record !== 'object') throw new Error('Each reviewed catalogue record must be an object.');
    // Draft data is not imported here. Even a manually copied draft cannot
    // acquire public visibility or sales permissions by accident.
    const existing = baseProducts.find(product => product.id === record.id);
    if (existing && ['Approved', 'Published'].includes(record.editorialStatus)) {
      const errors = validateContentRecord(record, ids);
      if (record.sourceId !== record.id) errors.push('An existing-record review must identify its original source ID.');
      for (const field of ['name', 'category', 'collection', 'confirmedPrice', 'suggestedPrice']) {
        if (record[field] !== null && record[field] !== undefined && record[field] !== existing[field]) errors.push(`A review cannot overwrite source field ${field}.`);
      }
      const variants = record.variants.length ? record.variants : existing.catalogue.variants;
      for (const variant of existing.catalogue.variants) {
        if (!variants.some(next => next.id === variant.id && next.colour === variant.colour)) errors.push('Existing colour identities must be retained.');
      }
      if (reviewed.has(record.id)) errors.push('Duplicate review for the same product.');
      if (errors.length) throw new Error(`Invalid review ${record.key}: ${errors.join(' ')}`);
      reviewed.set(record.id, {
        ...existing,
        catalogue: {
          ...existing.catalogue,
          editorialStatus: record.editorialStatus,
          description: record.description || existing.catalogue.description,
          sizes: record.sizes || existing.catalogue.sizes,
          variants: variants.map(variant => ({
            ...variant,
            availability: variant.availability || 'unconfirmed',
            images: existing.images.filter(image => image.approved && image.variantId === variant.id),
            imageState: existing.images.some(image => image.variantId === variant.id) ? 'available' : 'awaiting-image',
          })),
          placement: record.placement || existing.catalogue.placement,
          seo: { ...existing.catalogue.seo, ...(record.seo || {}) },
          contentApproval: record.contentApproval,
          publishAuthorisation: record.publishAuthorisation, purchaseEnabled: false,
        },
      });
      continue;
    }
    if (record.editorialStatus !== 'Published') continue;
    const errors = validateContentRecord(record, [...ids, ...extra.map(product => product.id)]);
    if (errors.length) throw new Error(`Invalid reviewed catalogue record ${record.key}: ${errors.join(' ')}`);
    const allowedAssets = assets.filter(asset => record.assetIds.includes(asset.id) && asset.productId === record.id && asset.approved && asset.approval);
    if (allowedAssets.length !== record.assetIds.length || allowedAssets.some(asset => !record.variants.some(variant => variant.id === asset.variantId))) throw new Error(`Unapproved, missing or mismatched asset/variant for ${record.key}.`);
    if (!allowedAssets.some(asset => asset.roles.includes('hero'))) throw new Error(`Missing approved hero for ${record.key}.`);
    const product = extendCatalogueProduct({
      id: record.id, name: record.name, category: record.category, alsoShowIn: record.alsoShowIn || [],
      collection: record.collection, audience: record.audience || '',
      confirmedPrice: record.confirmedPrice, suggestedPrice: record.suggestedPrice,
      colourways: record.variants.map(variant => variant.colour).join('; '),
      specifications: record.specifications || '', notes: record.notes || '',
      specificationStatus: '', coverage: record.coverage || '', priceBasis: record.priceBasis || '',
      alias: '', aliasStatus: '', source: 'Explicitly reviewed catalogue supplement',
      imageStatus: 'Approved asset mapping', images: [],
    });
    const approvedIds = new Set(allowedAssets.map(asset => asset.id));
    product.images = product.images.filter(image => approvedIds.has(image.id));
    product.catalogue = {
      ...product.catalogue, editorialStatus: record.editorialStatus,
      description: record.description || null, placement: record.placement,
      sizes: record.sizes || [],
      variants: record.variants.map(variant => ({
        ...variant,
        availability: variant.availability || 'unconfirmed',
        images: allowedAssets.filter(image => image.variantId === variant.id).map(mappedImage),
        imageState: allowedAssets.some(image => image.variantId === variant.id) ? 'available' : 'awaiting-image',
      })),
      imageRoles: Object.fromEntries(IMAGE_ROLES.map(role => [role, allowedAssets.filter(image => image.roles.includes(role)).map(mappedImage)])),
      seo: { ...product.catalogue.seo, ...(record.seo || {}) },
      legacyListed: false, contentApproval: record.contentApproval,
      publishAuthorisation: record.publishAuthorisation, purchaseEnabled: false,
    };
    extra.push(product);
  }
  return [...baseProducts.map(product => reviewed.get(product.id) || product), ...extra];
}
