const publicPages = [
  ['fight-promotions', '/fight-promotions.html', 'Professional Fight Promotions', 'Fight Promotions'],
  ['live-events', '/live-events.html', 'Live Events', 'Fight Promotions'],
  ['broadcast-ppv', '/broadcast-ppv.html', 'Broadcast & PPV', 'Fight Promotions'],
  ['athlete-development', '/athlete-development.html', 'Athlete Development', 'Fight Promotions'],
  ['academy-grassroots', '/academy-grassroots.html', 'Academy & Grassroots Programmes', 'Fight Promotions'],
  ['fsd-pods', '/fsd-pods.html', 'FSD Pods', 'Global Vision & Operations'],
  ['autonomous-popups', '/autonomous-popups.html', 'Autonomous Pop-Ups & Predictive Stock', 'Global Vision & Operations'],
  ['mobile-testing-labs', '/mobile-testing-labs.html', 'Mobile Testing Labs', 'Global Vision & Operations'],
  ['local-micro-manufacturing', '/local-micro-manufacturing.html', 'Local Micro-Manufacturing', 'Global Vision & Operations'],
  ['genetic-microbiome', '/genetic-microbiome.html', 'Genetic & Microbiome Personalisation', 'BIO-LAB™ / Personalisation Research'],
  ['security-vision', '/security-vision.html', 'Security Provisions', 'Global Vision & Operations'],
  ['investor-relations', '/investor.html', 'Investor Relations', 'Investor Relations', 'NOT_READY'],
  ['community-co-creation', '/community-co-creation.html', 'Community Co-Creation', 'Community & Culture'],
  ['performance-partnerships', '/performance-partnerships.html', 'Performance-Linked Partnerships', 'Community & Culture'],
  ['circular-trade-in', '/circular-trade-in.html', 'Circular Trade-In Programme', 'Community & Culture'],
  ['community-first-aid', '/community-first-aid.html', 'Community First Aid & Safety Skills', 'Community & Culture'],
].map(([id, path, title, division, readiness = 'PUBLIC']) => ({
  id,
  path,
  title,
  heading: id === 'security-vision' ? 'SIA-Regulated Event & Venue Protection' : title,
  division,
  readiness,
  contentStatus: readiness === 'NOT_READY'
    ? 'CONTENT PENDING'
    : id === 'fight-promotions' ? 'Approved concept disclosure' : 'Approved public disclosure',
  internalNote: readiness === 'NOT_READY'
    ? 'UK legal review and proposed investor figures remain outstanding.'
    : '',
  heroMedia: 'CONTENT PENDING — no page-specific approved hero photograph is recorded; retain text-led abstract hero.',
  bannerMedia: 'CONTENT PENDING — no approved desktop, tablet, or mobile banner crop is recorded.',
  responsiveStatus: 'Passed 12 viewport browser matrix (320–1920px).',
}));

export const HOUSE_FLAGSHIP_DRAFTS = Object.freeze([
  { id: 'dublin', title: 'Dublin' },
  { id: 'belfast', title: 'Belfast' },
  { id: 'manchester', title: 'Manchester' },
  { id: 'islamabad', title: 'Islamabad' },
  { id: 'future-global-locations', title: 'Future Global Locations' },
].map(page => Object.freeze({
  ...page,
  path: `/flagships/${page.id}.html`,
  division: 'Flagships',
  readiness: 'NOT_READY',
  contentStatus: 'CONTENT PENDING',
  internalNote: 'No approved location, operator, or service details are available for public use.',
  heroMedia: 'CONTENT PENDING — no page-specific approved hero photograph is recorded; retain text-led abstract hero.',
  bannerMedia: 'CONTENT PENDING — no approved desktop, tablet, or mobile banner crop is recorded.',
  responsiveStatus: 'Passed 12 viewport browser matrix (320–1920px).',
})));

const founderStory = Object.freeze({
  id: 'founder-story',
  path: '/story',
  title: 'Founder Story',
  division: 'Our Story',
  readiness: 'NOT_READY',
  contentStatus: 'CONTENT PENDING',
  internalNote: 'Founder biography and replacement copy require verification.',
  heroMedia: 'CONTENT PENDING — no page-specific approved hero photograph is recorded; retain text-led abstract hero.',
  bannerMedia: 'CONTENT PENDING — no approved desktop, tablet, or mobile banner crop is recorded.',
  responsiveStatus: 'Passed 12 viewport browser matrix (320–1920px).',
});

export const HOUSE_PAGE_REGISTRY = Object.freeze([
  founderStory,
  ...HOUSE_FLAGSHIP_DRAFTS,
  ...publicPages,
]);

const byPath = new Map(HOUSE_PAGE_REGISTRY.map(page => [page.path, page]));
const byDirectPath = byPath;

export const HOUSE_DRAFT_BUILD_FILES = Object.freeze([
  'investor.html',
  'story/index.html',
  ...HOUSE_FLAGSHIP_DRAFTS.map(({ id }) => `flagships/${id}.html`),
]);

const houseDraftPaths = new Set([
  ...HOUSE_PAGE_REGISTRY
    .filter(page => page.readiness === 'NOT_READY')
    .map(page => page.path),
]);

export function getHousePageRecord(pathname) {
  return byDirectPath.get(pathname) || null;
}

export function isHouseDraftRoute(path) {
  const normalized = String(path || '').replace(/\/+$/, '') || '/';
  return houseDraftPaths.has(normalized);
}

export function shouldDisableHouseHref(href, production = import.meta.env?.PROD === true) {
  if (!production || typeof href !== 'string') return false;
  const page = byPath.get(href);
  return page?.readiness === 'NOT_READY';
}

export function isHouseDraftBuildFile(fileName) {
  const normalized = String(fileName || '').replace(/\\/g, '/').replace(/^\/+/, '');
  return HOUSE_DRAFT_BUILD_FILES.includes(normalized);
}
