import { collectionDivisions } from './collection-divisions.js';
import { products as catalogueProducts } from './catalogue-data.js';
import { groupProducts } from './collection-showcase/index.js';
import { hoodedShellCampaign } from './hooded-shell-campaign.js';

export const primaryNavigation = [
  { id: 'collections', label: 'SHOP' },
  { id: 'universe', label: 'UNIVERSE' },
  { id: 'bio-lab', label: 'BIO-LAB™' },
  { id: 'hardware', label: 'HARDWARE' },
  { id: 'house', label: 'THE HOUSE' },
  { id: 'private-access', label: 'PRIVATE ACCESS' },
];

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const slug = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const weightedRopePreviewPath = '/__catalogue-preview/weighted-skipping-rope/';
const hoodedShellPreviewPath = '/__catalogue-preview/hooded-running-shell/';
const privatePreviewTargets = new Map([
  [weightedRopePreviewPath, `${weightedRopePreviewPath}media/weighted-rope-campaign`],
  [hoodedShellPreviewPath, `${hoodedShellPreviewPath}media/${hoodedShellCampaign.id}`],
]);

export const navigationAssetBindings = Object.freeze({
  'FSD NEXUS (smart ring)': Object.freeze({
    src: '/fsd-assets/3daa9883cec9.webp',
    alt: 'FSD Nexus smart ring in golden shadows.',
  }),
});

function featureImageForItem(item) {
  const explicitSource = item?.featureImageSrc;
  if (typeof explicitSource === 'string' && /^\/fsd-assets\/[^/]+\.webp$/i.test(explicitSource)) {
    return {
      src: explicitSource,
      alt: item.featureImageAlt || item.title || item.record?.name || 'FSD product image',
    };
  }
  const productName = item?.record?.name || item?.title;
  return navigationAssetBindings[productName] || null;
}

function makeWeightedRopeDraftMenuItem() {
  return {
    id: 'weighted-skipping-rope-draft-menu-entry',
    title: 'FSD Weighted Skipping Rope',
    kind: 'draft-product',
    href: weightedRopePreviewPath,
    previewOnly: true,
    featureImageSrc: `${weightedRopePreviewPath}media/weighted-rope-campaign`,
    featureImageAlt: 'FSD Weighted Skipping Rope campaign with the athlete and all eight colour editions.',
    description: 'Eight colour editions in the FSD performance training collection.',
    sourceDivisionId: 'hardware',
    sourceGroupIndex: 0,
    sourceSubcategoryIndex: -1,
  };
}

function makeHoodedShellCampaignMenuItem() {
  return {
    id: 'hooded-running-shell-campaign-menu-entry',
    title: 'FSD Hooded Running Shell',
    kind: 'draft-product',
    href: hoodedShellPreviewPath,
    previewOnly: true,
    previewKicker: 'FSD / CAMPAIGN',
    previewActionLabel: 'VIEW CAMPAIGN',
    featureImageSrc: `${hoodedShellPreviewPath}media/${hoodedShellCampaign.id}`,
    featureImageAlt: hoodedShellCampaign.alt,
    description: 'Campaign imagery for the FSD Hooded Running Shell.',
    sourceDivisionId: 'apparel',
    sourceGroupIndex: 0,
    sourceSubcategoryIndex: -1,
  };
}

function divisionById(divisions, id) {
  return divisions.find(division => division.id === id);
}

function makeSubcategoryItems(group, divisionId, groupIndex, subcategories = group.subcategories || []) {
  const items = subcategories.map((subcategory, index) => ({
    id: `${group.id}-subcategory-${index}`,
    title: subcategory.title,
    kind: 'subcategory',
    source: subcategory,
    sourceGroup: group,
    sourceDivisionId: divisionId,
    sourceGroupIndex: groupIndex,
    sourceSubcategoryIndex: group.subcategories?.indexOf(subcategory) ?? -1,
    description: subcategory.concepts?.length
      ? `${subcategory.concepts.join(' · ')}. Details and availability remain subject to confirmation.`
      : '',
  }));

  for (const category of group.categories || []) {
    items.push({
      id: `${group.id}-category-${slug(category)}`,
      title: category,
      kind: 'category',
      source: { categories: [category], audiences: group.audiences || [] },
      sourceGroup: group,
      sourceDivisionId: divisionId,
      sourceGroupIndex: groupIndex,
      sourceSubcategoryIndex: -1,
    });
  }

  return items;
}

function makeDivisionGroup(division, sourceGroup, sourceGroupIndex, products, options = {}) {
  let items;
  if (options.items) {
    items = options.items;
  } else if (sourceGroup.subcategories?.length) {
    items = makeSubcategoryItems(sourceGroup, division.id, sourceGroupIndex);
  } else {
    const records = groupProducts(sourceGroup, products);
    items = records.length
      ? records.map(record => {
        const binding = navigationAssetBindings[record.name];
        return {
          id: `${sourceGroup.id}-product-${record.id}`,
          title: record.name,
          kind: 'product',
          record,
          source: { productTerms: [record.name] },
          sourceGroup,
          sourceDivisionId: division.id,
          sourceGroupIndex,
          sourceSubcategoryIndex: -1,
          ...(binding ? { featureImageSrc: binding.src, featureImageAlt: binding.alt } : {}),
        };
      })
      : (sourceGroup.concepts || []).map((concept, index) => ({
        id: `${sourceGroup.id}-concept-${index}`,
        title: concept,
        kind: 'concept',
        source: { concepts: [concept] },
        sourceGroup,
        sourceDivisionId: division.id,
        sourceGroupIndex,
        sourceSubcategoryIndex: -1,
        description: 'A design direction within the FSD collection.',
      }));
  }

  return {
    id: options.id || sourceGroup.id,
    title: options.title || sourceGroup.title,
    source: sourceGroup,
    sourceDivisionId: division.id,
    sourceGroupIndex,
    description: options.description || division.description || '',
    href: options.href || '',
    navigationUnavailable: options.navigationUnavailable === true,
    items,
  };
}

function makeCollectionsGroups(divisions, products, includeDraftPreviews = false) {
  const division = divisionById(divisions, 'apparel');
  if (!division) return [];
  const mens = division.groups?.[0];
  const womens = division.groups?.[1];
  if (!mens || !womens) return (division.groups || []).map((group, index) =>
    makeDivisionGroup(division, group, index, products));

  const groups = [
    makeDivisionGroup(division, mens, 0, products),
    makeDivisionGroup(division, womens, 1, products),
  ];
  if (includeDraftPreviews) {
    const mensGroup = groups.find(group => group.id === mens.id);
    if (!mensGroup) throw new Error('FSD Apparel must contain its existing performance group for the campaign proof.');
    mensGroup.items = [...mensGroup.items, makeHoodedShellCampaignMenuItem()];
  }

  const capsuleItems = makeSubcategoryItems(
    mens,
    division.id,
    0,
    (mens.subcategories || []).filter(item => /capsule/i.test(item.title)),
  );
  groups.push(makeDivisionGroup(division, mens, 0, products, {
    id: 'limited-collections',
    title: 'LIMITED COLLECTIONS',
    description: 'Selected FSD capsules from the existing collection brief.',
    items: capsuleItems,
    navigationUnavailable: true,
  }));

  const conceptItems = (division.groups || []).flatMap((group, groupIndex) =>
    (group.subcategories || [])
      .filter(item => item.concepts?.length)
      .map((item, index) => ({
        ...makeSubcategoryItems(group, division.id, groupIndex, [item])[0],
        id: `featured-${group.id}-${index}`,
      })));
  groups.push(makeDivisionGroup(division, mens, 0, products, {
    id: 'new-featured-concepts',
    title: 'NEW & FEATURED CONCEPTS',
    description: 'Current concepts from the existing FSD collection data.',
    items: conceptItems,
    navigationUnavailable: true,
  }));
  groups.push({
    id: 'shop-all-products',
    title: 'ALL PRODUCTS',
    description: 'Browse the full FSD product catalogue with collection, category and audience filters.',
    href: '#products',
    navigationUnavailable: false,
    items: [{
      id: 'shop-all-products-entry',
      title: 'Browse all products',
      kind: 'shop-all',
      href: '#products',
      description: 'Open the complete FSD catalogue.',
    }],
  });

  return groups;
}

function makeUniverseGroups(divisions, products) {
  return divisions.map(division => {
    const sourceGroup = division.groups?.[0];
    const item = {
      id: `universe-explore-${division.id}`,
      title: `Explore ${division.title.replace(/^FSD\s+/i, '')}`,
      kind: 'universe-division',
      description: division.description,
      source: sourceGroup,
      sourceGroup,
      sourceDivisionId: division.id,
      sourceGroupIndex: 0,
      sourceSubcategoryIndex: -1,
    };
    return makeDivisionGroup(division, sourceGroup, 0, products, {
      id: `universe-${division.id}`,
      title: division.title,
      description: division.description,
      navigationUnavailable: true,
      items: sourceGroup ? [item] : [],
    });
  });
}

function makeHouseGroups(divisions) {
  const global = divisionById(divisions, 'global');
  const flagship = global?.groups?.[0];
  const promotions = global?.groups?.[1];

  const staticGroup = (id, title, href, description, sourceGroup = null, sourceGroupIndex = 0, options = {}) => ({
    id,
    title,
    href,
    source: sourceGroup,
    sourceDivisionId: global?.id || 'global',
    sourceGroupIndex,
    description,
    navigationUnavailable: options.navigationUnavailable === true,
    items: sourceGroup
      ? (sourceGroup.concepts || []).map((concept, index) => ({
        id: `${id}-item-${index}`,
        title: concept,
        kind: 'concept',
        source: { concepts: [concept] },
        sourceGroup,
        sourceDivisionId: global?.id || 'global',
        sourceGroupIndex,
        sourceSubcategoryIndex: -1,
        href,
        navigationUnavailable: options.navigationUnavailable === true,
        description: 'Proposed concept. No location or service is represented as operational.',
      }))
      : [{
        id: `${id}-destination`,
        title,
        kind: 'destination',
        href,
        navigationUnavailable: options.navigationUnavailable === true,
        description,
      }],
  });

  return [
    staticGroup('our-story', 'OUR STORY', '#philosophy',
      'The FSD philosophy: fitness, discipline, progress and a stronger you.'),
    staticGroup('flagships', 'FLAGSHIPS', '',
      global?.description || 'Proposed FSD flagship concepts.', flagship, 0),
    staticGroup('fight-promotions', 'FIGHT PROMOTIONS', '',
      'Proposed promotion and event concepts.', promotions, 1),
    staticGroup('global-vision', 'GLOBAL VISION', '#fsd-division-global',
      global?.description || 'FSD Global concepts.'),
    staticGroup('investor-relations', 'INVESTOR RELATIONS', '',
      'Investor information requires approved content before launch.', null, 0,
      { navigationUnavailable: true }),
  ];
}

function makePrivateGroups() {
  const details = [
    ['vip-registration', 'VIP ACCESS REGISTRATION',
      'Registration is not collecting sign-ups yet. The destination and approved privacy and consent details are still required.', false],
    ['collection-announcements', 'COLLECTION ANNOUNCEMENTS',
      'Collection announcements are part of VIP Access. No sign-up is collected here.', true],
    ['private-enquiries', 'PRIVATE ENQUIRIES',
      'Private access information is not yet connected to an enquiry destination.', false],
  ];
  return details.map(([id, title, description, hasDestination]) => ({
    id,
    title,
    href: hasDestination ? '#contact' : '',
    sourceDivisionId: '',
    sourceGroupIndex: -1,
    description,
    navigationUnavailable: !hasDestination,
    items: [{
      id: `${id}-details`,
      title,
      kind: 'destination',
      href: hasDestination ? '#contact' : '',
      navigationUnavailable: !hasDestination,
      description,
    }],
  }));
}

export function createNavigationModel({
  divisions = collectionDivisions,
  products = catalogueProducts,
  includeDraftPreviews = false,
  draftMenuItems = [],
} = {}) {
  const findDivision = id => divisionById(divisions, id);
  const divisionMenu = (id, label) => {
    const division = findDivision(id);
    const groups = (division?.groups || []).map((group, index) =>
      makeDivisionGroup(division, group, index, products));
    if (id === 'hardware' && includeDraftPreviews) {
      const strengthEquipment = groups.find(group => group.title === 'STRENGTH EQUIPMENT');
      if (!strengthEquipment) {
        throw new Error('Hardware must contain the approved Strength Equipment group for the draft preview.');
      }
      strengthEquipment.items = [...strengthEquipment.items, makeWeightedRopeDraftMenuItem()];
    }
    if (includeDraftPreviews) {
      for (const item of draftMenuItems.filter(entry => entry.sourceDivisionId === id)) {
        const sourceGroup = groups.find(group => group.id === item.sourceGroupId);
        if (!sourceGroup || item.kind !== 'draft-product' || item.previewOnly !== true) {
          throw new Error(`A private draft menu entry must map to an existing ${id} collection group.`);
        }
        sourceGroup.items = [...sourceGroup.items, item];
      }
    }
    return {
      id,
      label,
      title: label,
      description: division?.description || '',
      divisionId: id,
      groups,
    };
  };

  return [
    {
      id: 'collections',
      label: 'SHOP',
      title: 'SHOP',
      description: findDivision('apparel')?.description || '',
      divisionId: 'apparel',
      groups: makeCollectionsGroups(divisions, products, includeDraftPreviews),
      defaultItemTitle: '2-in-1 Combat Training Shorts & Tanks',
    },
    {
      id: 'universe',
      label: 'UNIVERSE',
      title: 'FSD UNIVERSE',
      description: 'Explore FSD apparel, Bio-Lab™, Hardware, and the wider FSD Global vision.',
      divisionId: '',
      groups: makeUniverseGroups(divisions, products),
      defaultItemTitle: 'Explore Apparel',
    },
    divisionMenu('bio-lab', 'BIO-LAB™'),
    divisionMenu('hardware', 'HARDWARE'),
    {
      id: 'house',
      label: 'THE HOUSE',
      title: 'THE HOUSE',
      description: 'The story and proposed FSD global vision.',
      divisionId: 'global',
      groups: makeHouseGroups(divisions),
    },
    {
      id: 'private-access',
      label: 'PRIVATE ACCESS',
      title: 'PRIVATE ACCESS',
      description: 'VIP Access information. Sign-ups remain deferred.',
      divisionId: '',
      groups: makePrivateGroups(),
    },
  ];
}

function hasVerifiedDestination({
  menu, group, item,
}, { root, divisions, products, previewTargets = privatePreviewTargets }) {
  if (item?.navigationUnavailable || (!item && group?.navigationUnavailable)) return false;
  const ownerDocument = root.ownerDocument || document;
  if (item?.kind === 'draft-product') {
    return item.previewOnly === true
      && previewTargets.get(item.href) === item.featureImageSrc;
  }
  if (item?.record) {
    return products.some(product => product.id === item.record.id)
      && Boolean(ownerDocument.querySelector('#product-dialog'));
  }
  if (menu?.id === 'collections') {
    const hasShopDestination = Boolean(
      ownerDocument.querySelector('#catalogue-archive')
      && ownerDocument.querySelector('#products'),
    );
    if (group?.id === 'shop-all-products' || item?.kind === 'shop-all') {
      return hasShopDestination;
    }
    if (!item && ['mens-luxury-performance', 'womens-modest-combat'].includes(group?.id)) {
      return hasShopDestination && groupProducts(group.source, products).length > 0;
    }
    if (item?.kind === 'subcategory') {
      return hasShopDestination
        && groupProducts(item.sourceGroup || group?.source, products, item.source).length > 0;
    }
  }
  if (item?.kind === 'category') {
    const category = item.source?.categories?.[0];
    const select = ownerDocument.querySelector('#catalogue-category');
    return Boolean(
      category
      && ownerDocument.querySelector('#catalogue-archive')
      && ownerDocument.querySelector('#products')
      && select
      && [...select.options].some(option => option.value === category),
    );
  }

  const explicitTarget = item?.href || group?.href;
  if (explicitTarget) {
    if (!explicitTarget.startsWith('#') || explicitTarget === '#') return false;
    try {
      return Boolean(ownerDocument.querySelector(explicitTarget));
    } catch {
      return false;
    }
  }

  const divisionId = item?.sourceDivisionId || group?.sourceDivisionId || menu?.divisionId;
  const division = divisions.find(entry => entry.id === divisionId);
  const groupIndex = item?.sourceGroupIndex ?? group?.sourceGroupIndex ?? 0;
  return Boolean(
    division
    && Number.isInteger(groupIndex)
    && groupIndex >= 0
    && groupIndex < (division.groups || []).length
    && ownerDocument.querySelector(`[data-division="${divisionId}"]`),
  );
}

function renderFeature(menu, group, item, canNavigate) {
  const image = featureImageForItem(item);
  const exactItemImage = Boolean(image);
  const featureTitle = item?.record?.name || item?.title || group?.title || 'FSD';
  const description = item?.description ||
    item?.record?.coverage ||
    item?.record?.priceBasis ||
    group?.description ||
    'Details and availability are subject to confirmation.';

  const media = image
    ? `<div class="fsd-feature-media fsd-feature-media--1" data-feature-image="${escapeHTML(image.src)}">
        <img src="${escapeHTML(image.src)}" alt="${escapeHTML(image.alt)}" loading="eager" fetchpriority="low" decoding="async">
      </div>`
    : '<div class="fsd-feature-media fsd-feature-media--unmapped" aria-hidden="true"></div>';

  const available = canNavigate({ menu, group, item });
  const actionLabel = !available ? 'DESTINATION UNAVAILABLE'
    : item?.kind === 'draft-product' ? (item.previewActionLabel || 'EXPLORE PRODUCT')
      : item?.kind === 'shop-all' ? 'SHOP ALL PRODUCTS'
      : item?.record ? 'VIEW DETAILS'
      : menu.id === 'private-access' ? 'VIEW ACCESS INFORMATION'
        : menu.id === 'house' && item?.href === '#philosophy' ? 'READ THE FSD STORY'
          : item?.kind === 'concept' ? 'EXPLORE CONCEPT'
            : item?.kind === 'subcategory' ? 'VIEW COLLECTION'
            : item?.kind === 'category' ? 'VIEW CATEGORY'
              : menu.id === 'house' ? 'EXPLORE THE HOUSE'
                : 'EXPLORE COLLECTION';

  return `<article class="fsd-feature-card">
    ${media}
    <div class="fsd-feature-copy">
      <p class="fsd-feature-kicker">${item?.kind === 'draft-product' ? escapeHTML(item.previewKicker || 'FSD / CONCEPT') : exactItemImage ? 'FSD / SELECTED RECORD' : 'FSD / COLLECTION FEATURE'}</p>
      <h3>${escapeHTML(featureTitle)}</h3>
      <p>${escapeHTML(description)}</p>
      <button type="button" class="fsd-feature-cta" data-nav-destination
        ${available ? '' : 'disabled aria-disabled="true" title="No verified destination is available for this selection."'}>
        ${actionLabel}<span aria-hidden="true">${available ? '↗' : '—'}</span>
      </button>
    </div>
  </article>`;
}

function renderGroupButtons(menu, activeGroupIndex, canNavigate) {
  return menu.groups.map((group, index) => {
    const available = canNavigate({ menu, group, item: null });
    const status = available ? 'Open this collection group.' : 'Preview only; no verified group destination is available.';
    return `<button type="button"
      class="fsd-nav-option fsd-nav-group${index === activeGroupIndex ? ' is-active' : ''}"
      data-nav-group="${index}" data-nav-available="${available}" aria-label="${escapeHTML(group.title)}. ${status}"
      title="${status}" aria-pressed="${index === activeGroupIndex}">
    <span class="fsd-nav-index">${String(index + 1).padStart(2, '0')}</span>
    <span>${escapeHTML(group.title)}</span>
    <span class="fsd-nav-arrow" aria-hidden="true">${available ? '↗' : '—'}</span>
  </button>`;
  }).join('');
}

function renderItemButtons(menu, group, activeItemIndex, canNavigate) {
  return group.items.map((item, index) => {
    const available = canNavigate({ menu, group, item });
    const status = item.kind === 'draft-product'
      ? 'Open this FSD product concept.'
      : available ? 'Open this destination.' : 'Preview only; no verified destination is available.';
    return `<button type="button"
      class="fsd-nav-option fsd-nav-item${index === activeItemIndex ? ' is-active' : ''}"
      data-nav-item="${index}" data-nav-available="${available}"
      aria-label="${escapeHTML(item.title)}. ${status}" title="${status}"
      aria-pressed="${index === activeItemIndex}">
    <span class="fsd-nav-index">${String(index + 1).padStart(2, '0')}</span>
    <span>${escapeHTML(item.title)}</span>
    <span class="fsd-nav-arrow" aria-hidden="true">${available ? '↗' : '—'}</span>
  </button>`;
  }).join('');
}

function renderPanel(menu, activeGroupIndex, activeItemIndex, mobileStep, products, canNavigate, currentPrimaryId = '') {
  const group = menu.groups[activeGroupIndex] || menu.groups[0];
  const item = group?.items?.[activeItemIndex] || group?.items?.[0];
  const mobilePrimaries = primaryNavigation.map(entry => `<button type="button"
      class="fsd-mobile-primary${entry.id === menu.id ? ' is-active' : ''}"
      data-nav-primary="${entry.id}" aria-expanded="${entry.id === menu.id}"
      ${entry.id === currentPrimaryId ? 'aria-current="page"' : ''}>
    ${escapeHTML(entry.label)}<span aria-hidden="true">↗</span>
  </button>`).join('');

  return `<div class="fsd-mega-inner">
    <div class="fsd-mega-heading">
      <div>
        <p class="fsd-mega-eyebrow">${escapeHTML(menu.label)} <span>/</span> DIVISIONS</p>
        <h2>${escapeHTML(menu.title)}</h2>
      </div>
      <button type="button" class="fsd-mega-close" data-nav-close aria-label="Close navigation">
        CLOSE <span aria-hidden="true">×</span>
      </button>
    </div>
    <div class="fsd-mobile-stepbar">
      <button type="button" data-nav-back>${mobileStep === 'detail' ? '← BACK TO GROUPS' : '← ALL CATEGORIES'}</button>
      <span>${escapeHTML(menu.label)}</span>
    </div>
    <nav class="fsd-mobile-primary-list" aria-label="FSD sections">${mobilePrimaries}</nav>
    <div class="fsd-nav-columns">
      <section class="fsd-nav-column fsd-nav-column--groups" aria-labelledby="fsd-group-heading" data-nav-column="groups">
        <h3 id="fsd-group-heading">COLLECTION GROUPS</h3>
        <div class="fsd-nav-list" role="group" aria-label="Collection groups">
          ${renderGroupButtons(menu, activeGroupIndex, canNavigate)}
        </div>
      </section>
      <section class="fsd-nav-column fsd-nav-column--items" aria-labelledby="fsd-item-heading" data-nav-column="items">
        <h3 id="fsd-item-heading">SUBCATEGORIES</h3>
        <div class="fsd-nav-list" role="group" aria-label="Subcategories">
          ${group ? renderItemButtons(menu, group, activeItemIndex, canNavigate) : '<p class="fsd-nav-empty">Select a collection group.</p>'}
        </div>
      </section>
      <section class="fsd-nav-column fsd-nav-column--feature" aria-label="Featured collection">
        ${group ? renderFeature(menu, group, item, canNavigate) : ''}
      </section>
    </div>
  </div>`;
}

export function renderNavigationHeader(brandMarkup) {
  const primaryItems = primaryNavigation.map(item => `<button type="button"
      class="fsd-primary-trigger" data-nav-primary="${item.id}" aria-controls="fsd-mega-menu"
      aria-expanded="false">${escapeHTML(item.label)}</button>`).join('');

  return `<div class="announcement fsd-announcement">FSD / THE HOUSE OF PERFORMANCE <span>— DESIGN PREVIEW</span></div>
    <div class="fsd-navigation-shell" data-navigation-shell>
      <header class="header fsd-header fsd-glass-surface">
        <a class="brand fsd-brand" href="#home" aria-label="FSD Home">
          ${brandMarkup}
        </a>
        <nav class="fsd-primary-nav" aria-label="Main navigation">${primaryItems}</nav>
        <span class="fsd-header-note">UNITED KINGDOM <i aria-hidden="true">·</i> FSD</span>
        <button type="button" class="fsd-bag-toggle" data-bag-open aria-controls="fsd-bag-dialog"
          aria-expanded="false" aria-label="Open bag, 0 items">
          <svg viewBox="0 0 20 20" aria-hidden="true" fill="none">
            <path d="M4.5 7.2h11l.9 10H3.6l.9-10Z" stroke="currentColor" stroke-width="1.2"/>
            <path d="M7 7.2V5.7a3 3 0 0 1 6 0v1.5" stroke="currentColor" stroke-width="1.2"/>
          </svg>
          <span>BAG</span><span class="fsd-bag-count" data-bag-count>0</span>
        </button>
        <button type="button" class="fsd-mobile-toggle" data-nav-mobile-toggle
          aria-controls="fsd-mega-menu" aria-expanded="false" aria-label="Open navigation">
          <span>MENU</span><i aria-hidden="true"></i><i aria-hidden="true"></i>
        </button>
      </header>
      <section class="fsd-mega-menu fsd-glass-surface" id="fsd-mega-menu" data-nav-panel hidden aria-label="FSD navigation">
        <div data-nav-content></div>
      </section>
    </div>`;
}

export function mountNavigation({
  root = document.querySelector('[data-navigation-shell]'),
  divisions = collectionDivisions,
  products = catalogueProducts,
  includeDraftPreviews = false,
  draftMenuItems = [],
  draftPreviewTargets = new Map(),
  onNavigate = () => {},
} = {}) {
  if (!root) throw new TypeError('mountNavigation requires the FSD navigation shell.');
  const panel = root.querySelector('[data-nav-panel]');
  const content = root.querySelector('[data-nav-content]');
  const mobileToggle = root.querySelector('[data-nav-mobile-toggle]');
  const model = createNavigationModel({ divisions, products, includeDraftPreviews, draftMenuItems });
  const triggers = [...root.querySelectorAll('.fsd-primary-trigger')];
  if (!panel || !content || !mobileToggle) throw new TypeError('The FSD navigation markup is incomplete.');
  const canNavigate = selection => hasVerifiedDestination(selection, {
    root,
    divisions,
    products,
    previewTargets: new Map([...privatePreviewTargets, ...draftPreviewTargets]),
  });

  let activePrimaryId = '';
  let currentPrimaryId = '';
  let activeGroupIndex = 0;
  let activeItemIndex = 0;
  let mobileStep = 'primary';
  let isOpen = false;
  let hoverOpened = false;
  let closeTimer = 0;
  let pointerTimer = 0;
  let pointerInside = false;
  let suppressFocusPreview = false;
  let hoveredNavigationKey = '';
  let featureTransitionTimer = 0;

  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;
  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const currentMenu = () => model.find(menu => menu.id === activePrimaryId) || model[0];
  const syncExpanded = () => {
    for (const trigger of triggers) {
      trigger.setAttribute('aria-expanded', String(isOpen && trigger.dataset.navPrimary === activePrimaryId));
      trigger.classList.toggle('is-active', isOpen && trigger.dataset.navPrimary === activePrimaryId);
      trigger.classList.toggle('is-current', trigger.dataset.navPrimary === currentPrimaryId);
      if (trigger.dataset.navPrimary === currentPrimaryId) trigger.setAttribute('aria-current', 'page');
      else trigger.removeAttribute('aria-current');
    }
    mobileToggle.setAttribute('aria-expanded', String(isOpen));
    mobileToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    mobileToggle.classList.toggle('is-active', isOpen);
  };
  const hashNavigation = new Map([
    ['#products', 'collections'],
    ['#universe', 'universe'],
    ['#fsd-division-global', 'universe'],
    ['#hardware-editorial', 'hardware'],
    ['#innovations', 'bio-lab'],
    ['#philosophy', 'house'],
    ['#contact', 'private-access'],
  ]);
  const setCurrentPrimary = id => {
    currentPrimaryId = model.some(menu => menu.id === id) ? id : '';
    syncExpanded();
  };
  const updateCurrentFromHash = () => setCurrentPrimary(hashNavigation.get(window.location.hash) || '');
  currentPrimaryId = hashNavigation.get(window.location.hash) || '';

  const render = () => {
    clearTimeout(featureTransitionTimer);
    const oldMedia = content.querySelector('.fsd-feature-media');
    const oldImage = oldMedia?.querySelector('img:not(.fsd-feature-image--outgoing)');
    const oldSource = oldImage?.getAttribute('src') || '';
    const outgoingImage = oldImage?.cloneNode(false) || null;
    const menu = currentMenu();
    panel.dataset.primary = menu.id;
    panel.dataset.step = mobileStep;
    content.innerHTML = renderPanel(menu, activeGroupIndex, activeItemIndex, mobileStep, products, canNavigate, currentPrimaryId);
    const media = content.querySelector('.fsd-feature-media');
    const incomingImage = media?.querySelector('img');
    const incomingSource = incomingImage?.getAttribute('src') || '';
    if (!media || oldSource === incomingSource || (!oldSource && !incomingSource)) {
      syncExpanded();
      return;
    }

    media.classList.add('fsd-feature-media--transitioning');
    if (outgoingImage) {
      outgoingImage.className = 'fsd-feature-image--outgoing';
      outgoingImage.alt = '';
      outgoingImage.removeAttribute('loading');
      outgoingImage.setAttribute('aria-hidden', 'true');
      media.append(outgoingImage);
    }
    if (incomingImage) incomingImage.classList.add('fsd-feature-image--incoming');

    const finishTransition = () => {
      if (!media.isConnected) return;
      if (prefersReducedMotion()) {
        outgoingImage?.remove();
        incomingImage?.classList.remove('fsd-feature-image--incoming', 'is-visible');
        media.classList.remove('fsd-feature-media--transitioning');
        return;
      }
      requestAnimationFrame(() => {
        if (!media.isConnected) return;
        incomingImage?.classList.add('is-visible');
        outgoingImage?.classList.add('is-fading');
        featureTransitionTimer = window.setTimeout(() => {
          outgoingImage?.remove();
          incomingImage?.classList.remove('fsd-feature-image--incoming', 'is-visible');
          media.classList.remove('fsd-feature-media--transitioning');
        }, 200);
      });
    };
    const handleIncomingError = () => {
      incomingImage?.remove();
      media.classList.remove('fsd-feature-media--1');
      media.classList.add('fsd-feature-media--unmapped');
      media.removeAttribute('data-feature-image');
      finishTransition();
    };
    if (incomingImage) {
      if (incomingImage.complete) {
        if (incomingImage.naturalWidth > 0) finishTransition();
        else handleIncomingError();
      } else {
        incomingImage.addEventListener('load', finishTransition, { once: true });
        incomingImage.addEventListener('error', handleIncomingError, { once: true });
      }
    } else {
      finishTransition();
    }
    syncExpanded();
  };

  const selectorForNavigationRow = row => {
    if (!row) return '';
    if (row.hasAttribute('data-nav-group')) return `[data-nav-group="${row.dataset.navGroup}"]`;
    if (row.hasAttribute('data-nav-item')) return `[data-nav-item="${row.dataset.navItem}"]`;
    return '';
  };

  const renderPreservingFocus = focusSelector => {
    const activeRow = panel.contains(root.ownerDocument.activeElement)
      ? root.ownerDocument.activeElement.closest('[data-nav-group], [data-nav-item]')
      : null;
    const selector = focusSelector || selectorForNavigationRow(activeRow);
    render();
    if (!selector) return;
    const replacement = root.querySelector(selector);
    if (!replacement) return;
    suppressFocusPreview = true;
    try {
      replacement.focus({ preventScroll: true });
    } finally {
      suppressFocusPreview = false;
    }
  };

  const defaultItemIndex = menu => {
    const group = menu.groups[0];
    if (!group?.items?.length) return 0;
    const exact = group.items.findIndex(item => item.title === menu.defaultItemTitle);
    return exact >= 0 ? exact : 0;
  };

  const openMenu = (menuId, { hover = false, step = 'desktop' } = {}) => {
    const menu = model.find(entry => entry.id === menuId);
    if (!menu) return;
    clearTimeout(closeTimer);
    clearTimeout(pointerTimer);
    activePrimaryId = menu.id;
    activeGroupIndex = 0;
    activeItemIndex = defaultItemIndex(menu);
    mobileStep = step === 'mobile' ? 'primary' : 'desktop';
    hoverOpened = hover;
    isOpen = true;
    panel.hidden = false;
    root.classList.add('is-open');
    document.body.classList.toggle('fsd-mobile-nav-open', isMobile());
    render();
  };

  const closeMenu = ({ restoreFocus = false, immediate = false } = {}) => {
    if (!isOpen && panel.hidden) return;
    isOpen = false;
    hoverOpened = false;
    clearTimeout(pointerTimer);
    root.classList.remove('is-open');
    document.body.classList.remove('fsd-mobile-nav-open');
    syncExpanded();
    const shouldRestore = restoreFocus || panel.contains(document.activeElement);
    const activeTrigger = triggers.find(trigger => trigger.dataset.navPrimary === activePrimaryId);
    if (shouldRestore) (isMobile() ? mobileToggle : activeTrigger)?.focus({ preventScroll: true });
    clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      if (!isOpen) panel.hidden = true;
    }, immediate || prefersReducedMotion() ? 0 : 230);
  };

  const choosePrimary = (menuId, mobile = false) => {
    const menu = model.find(entry => entry.id === menuId);
    if (!menu) return;
    clearTimeout(closeTimer);
    activePrimaryId = menuId;
    activeGroupIndex = 0;
    activeItemIndex = defaultItemIndex(menu);
    mobileStep = mobile ? 'groups' : 'desktop';
    isOpen = true;
    panel.hidden = false;
    root.classList.add('is-open');
    document.body.classList.toggle('fsd-mobile-nav-open', isMobile());
    render();
  };

  const chooseGroup = (index, { focus = false, mobile = false } = {}) => {
    const menu = currentMenu();
    if (!menu.groups[index]) return;
    const groupChanged = activeGroupIndex !== index;
    const stepChanged = mobile && mobileStep !== 'detail';
    if (!groupChanged && !stepChanged) {
      if (focus) root.querySelector(`[data-nav-group="${index}"]`)?.focus({ preventScroll: true });
      return;
    }
    activeGroupIndex = index;
    activeItemIndex = 0;
    if (mobile) mobileStep = 'detail';
    const selector = focus
      ? mobile ? '[data-nav-item="0"]' : `[data-nav-group="${index}"]`
      : mobile ? '[data-nav-item="0"]' : '';
    renderPreservingFocus(selector);
  };

  const chooseItem = (index, { focus = false } = {}) => {
    const group = currentMenu().groups[activeGroupIndex];
    if (!group?.items[index]) return;
    if (activeItemIndex === index) {
      if (focus) root.querySelector(`[data-nav-item="${index}"]`)?.focus({ preventScroll: true });
      return;
    }
    activeItemIndex = index;
    renderPreservingFocus(focus ? `[data-nav-item="${index}"]` : '');
  };

  const schedulePointerClose = () => {
    clearTimeout(pointerTimer);
    pointerTimer = window.setTimeout(() => {
      if (!pointerInside && isOpen) closeMenu({ restoreFocus: panel.contains(document.activeElement) });
    }, 230);
  };

  const navigateSelection = selection => {
    if (!canNavigate(selection)) return false;
    setCurrentPrimary(selection.menu.id);
    closeMenu();
    onNavigate(selection);
    return true;
  };

  const onClick = event => {
    const primaryButton = event.target.closest('[data-nav-primary]');
    if (primaryButton && root.contains(primaryButton)) {
      const mobileList = primaryButton.closest('.fsd-mobile-primary-list');
      if (mobileList) {
        choosePrimary(primaryButton.dataset.navPrimary, true);
        const firstGroup = root.querySelector('[data-nav-group="0"]');
        firstGroup?.focus({ preventScroll: true });
        return;
      }
      const id = primaryButton.dataset.navPrimary;
      if (isOpen && activePrimaryId === id) {
        if (hoverOpened) {
          hoverOpened = false;
          return;
        }
        closeMenu({ restoreFocus: true });
      } else {
        openMenu(id);
      }
      return;
    }

    if (event.target.closest('[data-nav-mobile-toggle]')) {
      if (isOpen) closeMenu({ restoreFocus: true });
      else openMenu(model[0].id, { step: 'mobile' });
      return;
    }
    if (event.target.closest('[data-nav-close]')) {
      closeMenu({ restoreFocus: true });
      return;
    }
    if (event.target.closest('[data-nav-back]')) {
      mobileStep = mobileStep === 'detail' ? 'groups' : 'primary';
      render();
      const focusSelector = mobileStep === 'primary'
        ? '.fsd-mobile-primary-list [data-nav-primary]'
        : '[data-nav-group="0"]';
      panel.querySelector(focusSelector)?.focus({ preventScroll: true });
      return;
    }

    const groupButton = event.target.closest('[data-nav-group]');
    if (groupButton && panel.contains(groupButton)) {
      const index = Number(groupButton.dataset.navGroup);
      if (isMobile()) {
        chooseGroup(index, { mobile: true });
        return;
      }
      const menu = currentMenu();
      const group = menu.groups[index];
      const selection = { menu, group, item: null };
      if (!navigateSelection(selection)) chooseGroup(index);
      return;
    }
    const itemButton = event.target.closest('[data-nav-item]');
    if (itemButton && panel.contains(itemButton)) {
      const menu = currentMenu();
      const group = menu.groups[activeGroupIndex];
      const itemIndex = Number(itemButton.dataset.navItem);
      const item = group?.items[itemIndex];
      const selection = { menu, group, item };
      if (!navigateSelection(selection)) chooseItem(itemIndex);
      return;
    }
    if (event.target.closest('[data-nav-destination]')) {
      const menu = currentMenu();
      const group = menu.groups[activeGroupIndex];
      const item = group?.items[activeItemIndex];
      navigateSelection({ menu, group, item });
    }
  };

  const onPanelPointerMove = event => {
    if (!isOpen || isMobile() || event.pointerType === 'touch') return;
    const row = event.target.closest('[data-nav-group], [data-nav-item]');
    if (!row || !panel.contains(row)) {
      hoveredNavigationKey = '';
      return;
    }
    const key = row.hasAttribute('data-nav-group')
      ? `group:${row.dataset.navGroup}`
      : `item:${row.dataset.navItem}`;
    const alreadySelected = row.hasAttribute('data-nav-group')
      ? Number(row.dataset.navGroup) === activeGroupIndex
      : Number(row.dataset.navItem) === activeItemIndex;
    if (key === hoveredNavigationKey && alreadySelected) return;
    hoveredNavigationKey = key;
    if (row.hasAttribute('data-nav-group')) {
      chooseGroup(Number(row.dataset.navGroup));
    } else {
      chooseItem(Number(row.dataset.navItem));
    }
  };

  const onPanelFocusIn = event => {
    if (!isOpen || suppressFocusPreview) return;
    const row = event.target.closest('[data-nav-group], [data-nav-item]');
    if (!row || !panel.contains(row)) return;
    if (row.hasAttribute('data-nav-group')) {
      chooseGroup(Number(row.dataset.navGroup));
    } else {
      chooseItem(Number(row.dataset.navItem));
    }
  };

  const onKeyDown = event => {
    if (event.key === 'Tab' && isOpen && isMobile()) {
      const focusable = [...root.querySelectorAll('a[href], button:not([disabled])')]
        .filter(element => element.getClientRects().length > 0 && !element.closest('[hidden]'));
      if (focusable.length) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus({ preventScroll: true });
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus({ preventScroll: true });
        }
      }
    }

    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeMenu({ restoreFocus: true });
      return;
    }

    const primaryButton = event.target.closest('[data-nav-primary]');
    if (primaryButton && root.contains(primaryButton) &&
      ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      if (event.key === 'ArrowDown') {
        if (!isOpen || activePrimaryId !== primaryButton.dataset.navPrimary) {
          openMenu(primaryButton.dataset.navPrimary);
        }
        panel.querySelector('[data-nav-group="0"]')?.focus({ preventScroll: true });
        return;
      }
      const index = primaryNavigation.findIndex(item => item.id === primaryButton.dataset.navPrimary);
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? primaryNavigation.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + primaryNavigation.length) % primaryNavigation.length;
      const next = primaryNavigation[nextIndex];
      root.querySelector(`.fsd-primary-trigger[data-nav-primary="${next.id}"]`)?.focus({ preventScroll: true });
      choosePrimary(next.id);
      return;
    }

    const groupButton = event.target.closest('[data-nav-group]');
    const itemButton = event.target.closest('[data-nav-item]');
    const row = groupButton || itemButton;
    if (!row || !panel.contains(row) || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const isGroup = Boolean(groupButton);
    const entries = isGroup ? currentMenu().groups : currentMenu().groups[activeGroupIndex]?.items || [];
    if (!entries.length) return;
    const currentIndex = Number(row.dataset[isGroup ? 'navGroup' : 'navItem']);
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? entries.length - 1
      : (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + entries.length) % entries.length;
    if (isGroup) chooseGroup(nextIndex, { focus: true });
    else chooseItem(nextIndex, { focus: true });
  };

  const onDocumentClick = event => {
    if (isOpen && !root.contains(event.target)) {
      closeMenu({ restoreFocus: panel.contains(document.activeElement) });
    }
  };

  const onRootPointerEnter = () => {
    pointerInside = true;
    clearTimeout(pointerTimer);
  };
  const onRootPointerLeave = event => {
    if (event.pointerType !== 'mouse') return;
    pointerInside = false;
    schedulePointerClose();
  };

  for (const trigger of triggers) {
    trigger.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' && !isMobile()) openMenu(trigger.dataset.navPrimary, { hover: true });
    });
  }
  root.addEventListener('click', onClick);
  panel.addEventListener('pointermove', onPanelPointerMove);
  panel.addEventListener('focusin', onPanelFocusIn);
  document.addEventListener('keydown', onKeyDown);
  root.addEventListener('pointerenter', onRootPointerEnter);
  root.addEventListener('pointerleave', onRootPointerLeave);
  document.addEventListener('click', onDocumentClick);
  const onCurrentNavigation = event => setCurrentPrimary(event.detail?.id || '');
  document.addEventListener('fsd:navigation-active', onCurrentNavigation);
  window.addEventListener('hashchange', updateCurrentFromHash);
  window.addEventListener('popstate', updateCurrentFromHash);
  const sectionObserver = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (!visible.length) return;
      const hash = `#${visible[0].target.id}`;
      const id = hashNavigation.get(hash);
      if (id) setCurrentPrimary(id);
    }, { rootMargin: '-18% 0px -64% 0px', threshold: [0, .15, .4, .7] })
    : null;
  if (sectionObserver) {
    for (const hash of hashNavigation.keys()) {
      const target = root.ownerDocument.querySelector(hash);
      if (target) sectionObserver.observe(target);
    }
  }
  window.addEventListener('resize', () => {
    if (isOpen) closeMenu({ immediate: true });
  }, { passive: true });

  return () => {
    clearTimeout(closeTimer);
    clearTimeout(pointerTimer);
    root.removeEventListener('click', onClick);
    panel.removeEventListener('pointermove', onPanelPointerMove);
    panel.removeEventListener('focusin', onPanelFocusIn);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('fsd:navigation-active', onCurrentNavigation);
    root.removeEventListener('pointerenter', onRootPointerEnter);
    root.removeEventListener('pointerleave', onRootPointerLeave);
    document.removeEventListener('click', onDocumentClick);
    window.removeEventListener('hashchange', updateCurrentFromHash);
    window.removeEventListener('popstate', updateCurrentFromHash);
    sectionObserver?.disconnect();
    document.body.classList.remove('fsd-mobile-nav-open');
  };
}

export function getNavigationFeature(menu, groupIndex, itemIndex, products = catalogueProducts) {
  const group = menu?.groups?.[groupIndex];
  const item = group?.items?.[itemIndex];
  if (!group || !item) return null;
  const image = featureImageForItem(item);
  return {
    menu: menu.id,
    group: group.title,
    item: item.title,
    imageSources: image ? [image.src] : [],
    itemKind: item.kind,
    sourceDivisionId: item.sourceDivisionId || group.sourceDivisionId || menu.divisionId || '',
  };
}
