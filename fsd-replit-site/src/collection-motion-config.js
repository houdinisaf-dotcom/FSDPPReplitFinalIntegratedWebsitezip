import suppliedConfig from './config/priority-three.json' with { type: 'json' };

const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

// Preserve the supplied configuration, including its deliberately null fields.
export const COLLECTION_MOTION_CONFIG = freeze(suppliedConfig);

const aliases = { tiger: 'tiger-series', scorpion: 'scorpion-series' };
const canonicalId = id => aliases[id] || id;
const concepts = Object.freeze({
  master: null, serene: 1, ascent: 2, aligned: 4, signature: 5,
  tiger: null, scorpion: null,
});
const isPublicImagePath = source => typeof source === 'string'
  && /^\/(?!\/)[^\u0000-\u001f?#]+\.(?:svg|png|webp|jpe?g|avif)(?:[?#][^\u0000-\u001f]*)?$/i.test(source);

export function getCollectionMotionEntry(lineId, config = COLLECTION_MOTION_CONFIG) {
  return (config.collections || []).find(entry => canonicalId(entry.id) === canonicalId(lineId)) || null;
}

// Only explicitly assigned, owner-approved artwork can populate the switcher:
// original files or the owner's approved unchanged logo-panel crops.
// Legacy companion SVGs and garment-patch crops are not substitutes.
export function resolveCollectionLogo(lineId, config = COLLECTION_MOTION_CONFIG) {
  const entry = getCollectionMotionEntry(lineId, config);
  const key = entry?.logo || null;
  const base = {
    key, name: null, src: null,
    collectionId: canonicalId(lineId),
    collectionName: entry?.name || String(lineId || ''),
  };
  if (!key) return { ...base, status: 'unassigned' };
  const logo = Object.hasOwn(config.logos || {}, key) ? config.logos[key] : null;
  if (!Object.hasOwn(concepts, key)
    || (base.collectionId === 'tiger-series' && key !== 'tiger')
    || (base.collectionId === 'scorpion-series' && key !== 'scorpion')
    || (!['tiger-series', 'scorpion-series'].includes(base.collectionId) && ['tiger', 'scorpion'].includes(key))
    || (concepts[key] !== null && config.rules?.excludedConcepts?.includes(concepts[key]))) {
    return { ...base, status: 'excluded' };
  }
  const source = logo?.asset;
  if (!isPublicImagePath(source)) return { ...base, name: logo?.name || key, status: 'missing' };
  return { ...base, name: logo.name, src: source, status: 'ready' };
}
