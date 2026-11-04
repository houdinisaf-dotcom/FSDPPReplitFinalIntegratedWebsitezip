import { collectionDivisions } from './collection-divisions.js';
import { groupProducts } from './collection-showcase/index.js';
import { productImagesForDisplay } from './data/products.js';
import { CLOTHING_LINES, CLOTHING_LINE_ASSETS } from './clothing-lines.js';
import { COLLECTION_IMAGE_ASSETS } from './collection-image-config.js';
import { resolveCollectionLogo } from './collection-motion-config.js';

const technicalIds = new Set(['strength-equipment', 'combat-equipment', 'performance-accessories', 'bio-lab-concepts']);
const technicalGroups = collectionDivisions.flatMap(division => (division.groups || [])
  .filter(group => technicalIds.has(group.id)).map(group => ({ ...group, divisionId: division.id })));

// Existing identifiers, colours and approved logo references only. Missing
// campaign or standalone mark files stay null; images resolve from the catalogue.
export const CATALOGUE_COLLECTIONS = Object.freeze([
  ...CLOTHING_LINES.map(line => Object.freeze({
    id: line.id, title: line.title, kind: 'clothing-line',
    href: `/collections/${line.id}`, accentColour: line.colour,
    linkedCatalogueCollection: line.id,
    logoAsset: resolveCollectionLogo(line.id).src,
    bannerImageReference: CLOTHING_LINE_ASSETS[line.id]?.banner || null,
    mobileBannerImageReference: CLOTHING_LINE_ASSETS[line.id]?.mobileBanner || null,
  })),
  ...technicalGroups.map(group => Object.freeze({
    id: group.id, title: group.title, kind: 'catalogue-collection',
    href: `/#collection-${group.id}`, accentColour: '#D4AF37',
    linkedCatalogueCollection: group.id, divisionId: group.divisionId,
    logoAsset: COLLECTION_IMAGE_ASSETS[group.id]?.logo || null,
    bannerImageReference: COLLECTION_IMAGE_ASSETS[group.id]?.banner || null,
    mobileBannerImageReference: COLLECTION_IMAGE_ASSETS[group.id]?.mobileBanner || null,
  })),
]);

export function deriveTechnicalCollections(products) {
  return technicalGroups.map(group => {
    const config = CATALOGUE_COLLECTIONS.find(item => item.id === group.id);
    const existing = new Set(groupProducts(group, products).map(product => product.id));
    const members = products.filter(product => {
      const ids = Array.isArray(product.collectionIds) ? product.collectionIds : [];
      const technicalAssignments = ids.filter(id => technicalIds.has(id));
      if (technicalAssignments.length) return technicalAssignments.includes(group.id);
      return existing.has(product.id);
    });
    const first = members.flatMap(product => productImagesForDisplay(product).slice(0, 1))[0] || null;
    return { ...config, products: members, bannerImage: config.bannerImageReference
      ? { src: config.bannerImageReference, label: group.title } : first };
  });
}

export function confirmedCollectionText(value) {
  const text = String(value || '').trim();
  return /^\[?(?:to confirm|tbc|pending|unknown)\]?$/i.test(text) ? '' : text;
}
