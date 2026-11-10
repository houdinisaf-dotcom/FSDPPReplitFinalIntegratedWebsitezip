import { collectionDivisions } from './collection-divisions.js';
import { CATALOGUE_COLLECTIONS, deriveTechnicalCollections } from './catalogue-collections.js';
import { CLOTHING_LINES } from './clothing-lines.js';
import { products as catalogueProducts } from './catalogue-data.js';
import { groupProducts } from './collection-showcase/index.js';
import { hoodedShellCampaign } from './hooded-shell-campaign.js';
import { getInnovationPageForTitle } from './flagship-pages.js';
import { HOUSE_FLAGSHIP_DRAFTS, shouldDisableHouseHref } from './data/house-page-readiness.js';
import { FSD_HOUSE_PAGE_PATH, FSD_STORY_HASH, FSD_STORY_PATH } from './react-router.js';
import { outlineIcon } from './brand/outline-icons.js';
import { imagePlaceholderMarkup, installImageErrorFallbacks } from './image-placeholder.js';
import { STRATEGIC_CONCEPTS, conceptItem, conceptsForPlacement } from './strategic-concepts.js';

export const primaryNavigation = [
  { id: 'collections', label: 'SHOP' },
  { id: 'universe', label: 'UNIVERSE' },
  { id: 'bio-lab', label: 'BIO-LAB™' },
  { id: 'hardware', label: 'HARDWARE' },
  { id: 'house', label: 'THE HOUSE' },
  { id: 'private-access', label: 'PRIVATE ACCESS' },
];

export const divisionLandingPaths = Object.freeze({
  collections: '/shop',
  universe: '/universe',
  'bio-lab': '/bio-lab',
  hardware: '/hardware',
  house: FSD_HOUSE_PAGE_PATH,
  'private-access': '/private-access',
});

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
  'Performance Hijabs': Object.freeze({
    src: '/fsd-assets/4acbbfb65f79.webp',
    alt: 'FSD performance sports hijab in black and gold.',
  }),
  'Sports Hijabs': Object.freeze({
    src: '/fsd-assets/4acbbfb65f79.webp',
    alt: 'FSD performance sports hijab in black and gold.',
  }),
  'FSD Breeze Set': Object.freeze({
    src: '/fsd-assets/breeze-set-onyx-black-full-length.webp',
    alt: 'FSD Breeze Onyx Black set, full-length product photo.',
  }),
  BREEZE: Object.freeze({
    src: '/fsd-assets/breeze-set-onyx-black-full-length.webp',
    alt: 'FSD Breeze Onyx Black set, full-length product photo.',
  }),
  AEROFORGE: Object.freeze({
    src: '/assets/products/aeroforge-training-tee/aeroforge-white-green-lifestyle-hero.webp',
    alt: 'FSD Aeroforge Training Tee in White / Green, wide lifestyle view.',
    sourceProductName: 'FSD Aeroforge Training Tee',
    presentation: 'product',
  }),
  FLEX: Object.freeze({
    src: '/assets/products/flex-leggings-obsidian-front.webp',
    alt: 'FSD FLEX leggings in Obsidian Black, front lifestyle hero.',
    sourceProductName: 'FLEX — High-Waisted Sculpt Leggings',
    presentation: 'product',
  }),
  COMBAT: Object.freeze({
    src: '/fsd-assets/8ffe2fd45a06.webp',
    alt: 'FSD women’s combat collection, athlete training in boxing gloves.',
  }),
  'FSD NEXUS (smart ring)': Object.freeze({
    src: '/fsd-assets/3daa9883cec9.webp',
    alt: 'FSD Nexus smart ring in golden shadows.',
  }),
});

function featureImageForItem(item) {
  const explicitSource = item?.featureImageSrc;
  const isProductImage = typeof explicitSource === 'string'
    && /^\/(?:assets\/products|products)\/[a-z0-9/_-]+\.(?:webp|png|jpe?g)$/i.test(explicitSource);
  if (typeof explicitSource === 'string'
    && (/^\/fsd-assets\/[^/]+\.webp$/i.test(explicitSource) || isProductImage)) {
    return {
      src: explicitSource,
      alt: item.featureImageAlt || item.title || item.record?.name || 'FSD product image',
      presentation: item.featureImagePresentation || (isProductImage ? 'product' : 'editorial'),
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
      ? subcategory.concepts.join(' · ')
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
  const conceptItems = () => (sourceGroup.concepts || []).map((concept, index) => {
    const innovationPage = division.id === 'bio-lab'
      ? getInnovationPageForTitle(concept)
      : null;
    return {
      id: `${sourceGroup.id}-concept-${index}`,
      title: concept,
      kind: 'concept',
      source: { concepts: [concept] },
      sourceGroup,
      sourceDivisionId: division.id,
      sourceGroupIndex,
      sourceSubcategoryIndex: -1,
      ...(innovationPage ? { href: `#${innovationPage.id}` } : {}),
      description: innovationPage
        ? 'Product details, features, and availability.'
        : 'Part of the FSD collection.',
    };
  });
  let items;
  if (options.items) {
    items = options.items;
  } else if (sourceGroup.subcategories?.length) {
    items = makeSubcategoryItems(sourceGroup, division.id, sourceGroupIndex);
  } else {
    const records = groupProducts(sourceGroup, products);
    const recordItems = records.map(record => {
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
        ...(binding ? {
          featureImageSrc: binding.src,
          featureImageAlt: binding.alt,
          featureImagePresentation: binding.presentation,
        } : {}),
      };
    });
    items = records.length
      ? [...recordItems, ...(division.id === 'bio-lab' ? conceptItems() : [])]
      : conceptItems();
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

  const clothingLineItems = CLOTHING_LINES.map(line => ({
    id: `clothing-line-${line.id}`,
    title: line.title,
    kind: 'clothing-line',
    href: `/collections/${line.id}`,
    description: `Open the ${line.title} collection.`,
    ...(navigationAssetBindings[line.title]
      ? {
          featureImageSrc: navigationAssetBindings[line.title].src,
          featureImageAlt: navigationAssetBindings[line.title].alt,
          featureImagePresentation: navigationAssetBindings[line.title].presentation,
        }
      : {}),
  }));
  const womenLineItems = clothingLineItems.filter(item =>
    CLOTHING_LINES.find(line => `clothing-line-${line.id}` === item.id)?.audience === 'WOMEN');
  const menLineItems = clothingLineItems.filter(item =>
    CLOTHING_LINES.find(line => `clothing-line-${line.id}` === item.id)?.audience === 'MEN');
  groups.push(
    {
      id: 'womens-collections',
      title: 'WOMEN’S COLLECTIONS',
      description: 'Browse the established women’s apparel collections.',
      href: '#clothing-lines',
      items: womenLineItems,
    },
    {
      id: 'mens-collections',
      title: 'MEN’S COLLECTIONS',
      description: 'Browse the established Tiger and Scorpion collections.',
      href: '#clothing-lines',
      items: menLineItems,
    },
  );

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
    title: 'NEW & FEATURED',
    description: 'Current products and features from the FSD collection.',
    items: conceptItems,
    navigationUnavailable: true,
  }));
  groups.push({
    id: 'clothing-lines',
    title: 'ALL COLLECTIONS',
    description: 'Browse the seven established FSD clothing lines.',
    href: '#clothing-lines',
    items: [{
      id: 'clothing-lines-all',
      title: 'BROWSE ALL CLOTHING LINES',
      kind: 'clothing-lines',
      href: '#clothing-lines',
      description: 'Open the complete clothing-lines archive.',
    }],
  });
  groups.push({
    id: 'catalogue-collections',
    title: 'ACCESSORIES & TECHNICAL',
    description: 'Existing FSD accessories and technical catalogue collections.',
    href: '/#technical-collections-archive',
    items: deriveTechnicalCollections(products).map(collection => ({
      id: `catalogue-collection-${collection.id}`,
      title: collection.title,
      kind: 'catalogue-collection',
      href: collection.href,
      description: `${collection.products.length} existing catalogue pieces. Browse images, colours and current product details.`,
      ...(collection.bannerImage ? { featureImageSrc: collection.bannerImage.src,
        featureImageAlt: `${collection.title} — catalogue product photography` } : {}),
    })),
  });
  for (const section of ['Circularity', 'Technical Innovation']) {
    const items = conceptsForPlacement('SHOP', section).map(conceptItem);
    if (!items.length) continue;
    groups.push({
      id: `shop-${slug(section)}`,
      title: section.toUpperCase(),
      description: 'FSD product-development concepts connected to the existing SHOP catalogue.',
      items,
    });
  }
  return groups;
}

function makeUniverseGroups(divisions, products) {
  const groups = divisions.map(division => {
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
  const communityDevelopment = conceptsForPlacement('UNIVERSE', 'Community Development').map(conceptItem);
  if (communityDevelopment.length) {
    groups.push({
      id: 'universe-community-development',
      title: 'COMMUNITY DEVELOPMENT',
      description: 'Community-led product and partnership concepts. Participation channels are not open.',
      href: '#fsd-strategic-concepts',
      items: communityDevelopment,
    });
  }
  groups.push({
    id: 'universe-strategic-concepts',
    title: 'TWELVE STRATEGIC CONCEPTS',
    description: 'Open the complete, mapped FSD concept directory.',
    href: '#fsd-strategic-concepts',
    items: [{
      id: 'universe-strategic-concepts-index',
      title: 'Browse all twelve concepts',
      kind: 'destination',
      href: '#fsd-strategic-concepts',
      description: 'View the complete directory and its approved division placements.',
    }],
  });
  return groups;
}

function makeHouseGroups(divisions) {
  const global = divisionById(divisions, 'global');
  const flagship = global?.groups?.[0];
  const promotions = global?.groups?.[1];
  const flagshipDraftByTitle = new Map(HOUSE_FLAGSHIP_DRAFTS.map(page => [page.title, page]));
  const storySections = [
    ['founder', 'Founder Story', 'Fitness. Discipline. Progress.'],
  ].map(([id, title, description]) => ({
    id: `our-story-${id}`,
    title,
    kind: 'destination',
    href: FSD_STORY_PATH,
    navigationUnavailable: shouldDisableHouseHref(FSD_STORY_PATH),
    description,
  }));
  const flagshipItems = (flagship?.concepts || []).map((title, index) => {
    const page = flagshipDraftByTitle.get(title);
    const href = page?.path || '';
    return {
      id: `flagships-${page?.id || index}`,
      title,
      kind: 'destination',
      href,
      navigationUnavailable: !href || shouldDisableHouseHref(href),
      description: 'Proposed FSD flagship concept: the location vision, franchise and partnership enquiries.',
    };
  });
  flagshipItems.push(...conceptsForPlacement('THE HOUSE', 'Flagships').map(conceptItem));
  const fightPromotionRoutes = new Map([
    ['Professional Fight Promotions', '/fight-promotions.html'],
    ['Live Events', '/live-events.html'],
    ['Broadcast & PPV', '/broadcast-ppv.html'],
    ['Athlete Development', '/athlete-development.html'],
    ['Academy & Grassroots Programmes', '/academy-grassroots.html'],
  ]);
  const fightPromotionItems = (promotions?.concepts || []).map((concept, index) => {
    const href = fightPromotionRoutes.get(concept) || '';
    const isLiveEvents = concept === 'Live Events';
    const isBroadcastPpv = concept === 'Broadcast & PPV';
    const isAthleteDevelopment = concept === 'Athlete Development';
    const isAcademyGrassroots = concept === 'Academy & Grassroots Programmes';
    const isOperatingInitiative = isAthleteDevelopment || isAcademyGrassroots;
    return {
      id: `fight-promotions-item-${index}`,
      title: concept,
      kind: isLiveEvents || isBroadcastPpv || isOperatingInitiative ? 'initiative' : 'concept',
      status: isOperatingInitiative ? 'Operating' : undefined,
      source: { concepts: [concept] },
      sourceGroup: promotions,
      sourceDivisionId: global?.id || 'global',
      sourceGroupIndex: 1,
      sourceSubcategoryIndex: -1,
      href,
      navigationUnavailable: !href,
      description: isLiveEvents
        ? 'Strategic initiative; not yet operational. No FSD location, event, or service is represented as live.'
        : isBroadcastPpv
          ? 'Strategic initiative; not yet operational. No FSD broadcast, PPV event, or service is represented as live.'
        : isAthleteDevelopment
          ? 'Operating initiative covering athlete development and supervised recovery. No location or booking details are published here.'
        : isAcademyGrassroots
          ? 'Operating initiative supporting community mentorship and youth development. No schedule or registration details are published here.'
        : concept === 'Professional Fight Promotions'
          ? 'Exploratory concept only. No event, location, or service is represented as operational.'
          : 'Concept for exploration; no event, location, or service is represented as operational.',
    };
  });

  const staticGroup = (id, title, href, description, sourceGroup = null, sourceGroupIndex = 0, options = {}) => ({
    id,
    title,
    href,
    source: sourceGroup,
    sourceDivisionId: global?.id || 'global',
    sourceGroupIndex,
    description,
    navigationUnavailable: options.navigationUnavailable === true,
    items: options.items || (sourceGroup
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
         description: 'FSD locations and services. No location or service is represented as operational.',
      }))
      : [{
        id: `${id}-destination`,
        title,
        kind: 'destination',
        href,
        navigationUnavailable: options.navigationUnavailable === true,
        description,
        status: options.status,
        chapterCount: options.chapterCount,
        houseCodeCount: options.houseCodeCount,
      }]),
  });

  const initiativeGroup = (id, title, description, initiatives) => ({
    id,
    title,
    description,
    href: initiatives[0]?.href || '',
    sourceDivisionId: global?.id || 'global',
    sourceGroupIndex: -1,
    items: initiatives.map(initiative => ({
      id: `${id}-${initiative.id}`,
      title: initiative.title,
      kind: initiative.kind || 'destination',
      href: initiative.href || '',
      navigationUnavailable: shouldDisableHouseHref(initiative.href || ''),
      description: initiative.description,
      status: initiative.status,
    })),
  });

  return [
    staticGroup('our-story', 'OUR STORY', storySections[0].href,
      'Founder Story.',
      null, 0, {
        items: storySections,
        navigationUnavailable: shouldDisableHouseHref(storySections[0].href),
        status: 'EDITORIAL / FOUNDER STORY',
      }),
    staticGroup('flagships', 'FLAGSHIPS', '',
      'FSD flagship locations.', flagship, 0, {
        items: flagshipItems,
      }),
    staticGroup('fight-promotions', 'FIGHT PROMOTIONS', '',
      'Exploratory fight-promotion concepts. No event, location, or service is represented as operational.',
      promotions, 1, { items: fightPromotionItems }),
    initiativeGroup('global-vision-operations', 'GLOBAL VISION & OPERATIONS',
      global?.description || 'Active FSD infrastructure and long-horizon R&D initiatives.',
      [
        {
          id: 'pods',
          title: 'FSD Pods',
          hash: 'global/pods',
          href: '/fsd-pods.html',
          kind: 'initiative',
          status: 'Strategic concept',
          description: 'Proposed modular training, retail, education, and community-space concept. No Pod, location, or service is operational.',
        },
        {
          id: 'predictive-popups',
          title: 'Autonomous Pop-Ups & Predictive Stock',
          hash: 'global/predictive-popups',
          href: '/autonomous-popups.html',
          kind: 'initiative',
          status: 'Strategic concept',
          description: 'Proposed staffed flexible retail and demand-informed stock planning. No venue or stock service is live; “autonomous” refers to planning, not unstaffed or cashier-less retail.',
        },
        {
          id: 'mobile-testing-labs',
          title: 'Mobile Testing Labs',
          hash: 'global/mobile-testing-labs',
          href: '/mobile-testing-labs.html',
          kind: 'initiative',
          status: 'Strategic concept',
          description: 'Proposed mobile product-testing and consent-based feedback framework. No unit, venue, test, or data collection is live; biometric sensor tracking is not in confirmed scope.',
        },
        {
          id: 'local-micro-manufacturing',
          title: 'Local Micro-Manufacturing Workshop',
          hash: 'global/local-micro-manufacturing',
          href: '/local-micro-manufacturing.html',
          kind: 'initiative',
          status: 'Strategic concept',
          description: 'Proposed local small-batch production model. No partner, hub, site, or custom-order service is live; environmental benefits are not verified.',
        },
        {
          ...conceptItem(STRATEGIC_CONCEPTS.find(concept => concept.id === 'performance-linked-partnerships')),
          id: 'global-vision-operations-performance-linked-partnerships',
        },
        {
          id: 'security-provisions',
          title: 'Security Provisions',
          hash: 'global/security-provisions',
          href: '/security-vision.html',
          kind: 'initiative',
          status: 'Strategic expansion; not operational',
          description: 'Proposed event and venue security expansion. Not an active tender; deployment depends on corporate, licensing, insurance, and legal conditions.',
        },
      ]),
    staticGroup('investor-relations', 'INVESTOR RELATIONS', '/investor.html',
      'Investor Relations: the FSD business concept and how to contact the investor team.',
      null, 0, { navigationUnavailable: shouldDisableHouseHref('/investor.html') }),
    initiativeGroup('community-culture', 'COMMUNITY & CULTURE',
      'Active House & Universe initiatives across co-creation, partnerships, reuse, and community safety.',
      [
        {
          id: 'co-creation',
          title: 'Community Co-Creation',
          hash: 'community/co-creation',
          href: '/community-co-creation.html',
          kind: 'initiative',
          status: 'Strategic concept',
          description: 'Proposed framework for feedback and co-creation. No workshops, trials, forums, portal, or submissions are open.',
        },
        {
          id: 'performance-partnerships',
          title: 'Performance-Linked Partnerships',
          hash: 'community/performance-partnerships',
          href: '/performance-partnerships.html',
          kind: 'initiative',
          status: 'Strategic concept',
          description: 'Proposed framework for athlete, corporate, workplace-wellbeing, and brand partnerships. No named partner, live testing programme, participation criteria, or application flow is confirmed.',
        },
        {
          id: 'circular-trade-in',
          title: 'Circular Trade-In Programme',
          hash: 'community/circular-trade-in',
          href: '/circular-trade-in.html',
          kind: 'initiative',
          status: 'Strategic concept',
          description: 'Proposed circularity framework for trade-in, reuse, repair, refurbishment, and resale. No trade-ins, eligibility, or credit terms are available.',
        },
        {
          id: 'first-aid-safety',
          title: 'Community First Aid & Safety Skills',
          hash: 'community/first-aid-safety',
          href: '/community-first-aid.html',
          kind: 'initiative',
          status: 'Operating or rollout underway',
          description: 'Civic-resilience initiative covering first aid and personal-safety awareness. No provider or training programme is confirmed here.',
        },
        ...conceptsForPlacement('THE HOUSE', 'Community & Culture')
          .filter(concept => ['civic-response-auxiliary', 'tactical-shield-membership'].includes(concept.id))
          .map(conceptItem),
      ]),
  ];
}

function makePrivateGroups() {
  const details = [
    ['tactical-shield-membership', 'TACTICAL SHIELD MEMBERSHIP',
      'Proposed membership concept only. Terms and benefits are not confirmed; registration is not open and no sign-up data is collected.', true, '#tactical-shield-membership'],
    ['vip-registration', 'VIP ACCESS REGISTRATION',
      'Registration is not collecting sign-ups yet. The destination and approved privacy and consent details are still required.', false],
    ['collection-announcements', 'COLLECTION ANNOUNCEMENTS',
      'Collection announcements are part of VIP Access. No sign-up is collected here.', true],
    ['private-enquiries', 'PRIVATE ENQUIRIES',
      'A considered point of connection for strategic partnerships, commercial opportunities and private business matters.', true, '/enquiries.html'],
  ];
  return details.map(([id, title, description, hasDestination, explicitDestination]) => ({
    id,
    title,
    href: hasDestination ? (explicitDestination || '#contact') : '',
    sourceDivisionId: '',
    sourceGroupIndex: -1,
    description,
    navigationUnavailable: !hasDestination,
    items: [{
      id: `${id}-details`,
      title,
      kind: 'destination',
      href: hasDestination ? (explicitDestination || '#contact') : '',
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
  configureMenus = () => {},
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

  const menus = [
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
      description: 'The story, community initiatives, Bio-Lab, and mapped FSD strategic concepts.',
      divisionId: 'global',
      groups: makeHouseGroups(divisions),
    },
    {
      id: 'private-access',
      label: 'PRIVATE ACCESS',
      title: 'PRIVATE ACCESS',
      description: 'Members area coming soon.',
      divisionId: '',
      groups: makePrivateGroups(),
    },
  ];

  const bioLabMenu = menus.find(menu => menu.id === 'bio-lab');
  if (bioLabMenu) {
    bioLabMenu.groups.push({
      id: 'innovation-hub',
      title: 'INNOVATION HUB',
      description: 'Browse Bio-Lab products and proposed material-science and connected-apparel concepts.',
      sourceDivisionId: 'bio-lab',
      sourceGroupIndex: bioLabMenu.groups.length,
      href: '#innovation-hub',
      items: [{
        id: 'innovation-hub-index',
        title: 'Browse Innovation Hub',
        kind: 'destination',
        href: '#innovation-hub',
        description: 'Explore FSD Bio-Lab products.',
      }, {
        id: 'adaptive-technical-fabrics',
        title: 'Adaptive Technical Fabrics',
        kind: 'destination',
        href: '#adaptive-technical-fabrics',
        description: 'Material science, moisture management, and garment durability.',
      }, {
        id: 'smart-apparel-nfc-concept',
        title: 'Smart Apparel & NFC Authentication',
        kind: 'destination',
        href: '#smart-apparel-nfc',
        sourceDivisionId: 'bio-lab',
        sourceGroupIndex: bioLabMenu.groups.length,
        description: 'Garment authentication, useful product information, and digital content.',
      }],
    });
    bioLabMenu.groups[bioLabMenu.groups.length - 1].items.push(
      ...conceptsForPlacement('BIO-LAB™', 'INNOVATION HUB').map(conceptItem),
    );
    const bioLabConcepts = [
      ...conceptsForPlacement('BIO-LAB™', 'Materials & Engineering'),
      ...conceptsForPlacement('BIO-LAB™', 'Personalisation Research'),
      ...conceptsForPlacement('BIO-LAB™', 'Field Research'),
      ...conceptsForPlacement('BIO-LAB™', 'Connected Performance'),
    ];
    bioLabMenu.groups.push({
      id: 'bio-lab-strategic-concepts',
      title: 'MATERIALS, RESEARCH & CONNECTED PERFORMANCE',
      description: 'Mapped Bio-Lab concepts and cross-linked community research.',
      sourceDivisionId: 'bio-lab',
      sourceGroupIndex: bioLabMenu.groups.length,
      href: '#innovation-hub',
      items: bioLabConcepts.map(conceptItem),
    });
  }

  configureMenus(menus);
  return menus;
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
    const clothingLineTargets = new Set([
      '#clothing-lines',
      ...CATALOGUE_COLLECTIONS
        .filter(collection => collection.kind === 'clothing-line')
        .flatMap(collection => [collection.href, `#line-${collection.id}`]),
    ]);
    if (group?.id === 'catalogue-collections') {
      return !item || CATALOGUE_COLLECTIONS.some(collection => collection.href === item.href);
    }
    if (group?.id === 'clothing-lines' && !item) {
      return clothingLineTargets.has(group.href)
        && Boolean(ownerDocument.querySelector('[data-fsd-clothing-lines-slot]'));
    }
    if (item?.kind === 'clothing-lines' || item?.kind === 'clothing-line') {
      const target = item?.href || group?.href;
      return clothingLineTargets.has(target)
        && Boolean(ownerDocument.querySelector('[data-fsd-clothing-lines-slot]'));
    }
    if (group?.id === 'shop-all-products' || item?.kind === 'shop-all') {
      return hasShopDestination;
    }
    const divisionId = item?.sourceDivisionId || group?.sourceDivisionId;
    const groupIndex = item?.sourceGroupIndex ?? group?.sourceGroupIndex;
    const sourceDivision = divisions.find(entry => entry.id === divisionId);
    const sourceGroup = sourceDivision?.groups?.[groupIndex];
    const subcategoryIndex = item?.sourceSubcategoryIndex ?? -1;
    const hasShowcaseDestination = Boolean(
      hasShopDestination
      && ownerDocument.querySelector('#fsd-showcase-dialog')
      && sourceGroup
      && Number.isInteger(groupIndex)
      && groupIndex >= 0
      && (subcategoryIndex < 0 || sourceGroup.subcategories?.[subcategoryIndex]),
    );
    if (hasShowcaseDestination) return true;
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
    if (explicitTarget === '/fight-promotions.html'
      || explicitTarget === '/live-events.html'
      || explicitTarget === '/broadcast-ppv.html'
      || explicitTarget === '/athlete-development.html'
      || explicitTarget === '/academy-grassroots.html'
      || explicitTarget === '/fsd-pods.html'
      || explicitTarget === '/autonomous-popups.html'
      || explicitTarget === '/mobile-testing-labs.html'
      || explicitTarget === '/local-micro-manufacturing.html'
      || explicitTarget === '/genetic-microbiome.html'
      || explicitTarget === '/community-co-creation.html'
      || explicitTarget === '/performance-partnerships.html'
      || explicitTarget === '/circular-trade-in.html'
      || explicitTarget === '/community-first-aid.html'
      || explicitTarget === '/security-vision.html'
      || explicitTarget === '/enquiries.html'
      || explicitTarget === '/investor.html'
      || explicitTarget === FSD_HOUSE_PAGE_PATH
      || explicitTarget.startsWith(`${FSD_HOUSE_PAGE_PATH}#`)) return true;
    if (menu?.id === 'private-access' && explicitTarget === '#contact') return true;
    if (explicitTarget.replace(/\/+$/, '') === FSD_STORY_PATH) {
      return Boolean(
        ownerDocument.querySelector(FSD_STORY_HASH)
        && ownerDocument.querySelector('#fsd-house-archive'),
      );
    }
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

const MENU_GROUP_IMAGES = Object.freeze({
  'mens-luxury-performance': ['/fsd-assets/menu-mens-luxury-performance.webp', 'Athlete in an all-black FSD training tee resting on a bench in a low-lit strength gym.'],
  'womens-modest-combat': ['/fsd-assets/8ffe2fd45a06.webp', 'FSD women’s modest combat training in boxing gloves.'],
  'womens-collections': ['/fsd-assets/breeze-set-onyx-black-full-length.webp', 'FSD Breeze Onyx Black set, full-length product photo.'],
  'mens-collections': ['/fsd-assets/a50d3dd41dd5.webp', 'FSD black and gold performance tee.'],
  'limited-collections': ['/fsd-assets/3e7e5e1e2217.webp', 'Black and gold detail from an FSD limited capsule.'],
  'new-featured-concepts': ['/fsd-assets/694b62506e9f.webp', 'FSD men’s combat training concept.'],
  'clothing-lines': ['/fsd-assets/4037f5843793.webp', 'The FSD clothing range laid out by colourway.'],
  'catalogue-collections': ['/fsd-assets/menu-strength-equipment.webp', 'Chalked hand lifting an FSD black and gold dumbbell from the rack.'],
  'shop-circularity': ['/fsd-assets/07abc61fc7ed.webp', 'Close detail of FSD technical fabric.'],
  'shop-technical-innovation': ['/fsd-assets/1eeba2ae57b0.webp', 'FSD adaptive technical fabric with shield mark.'],
  'universe-apparel': ['/fsd-assets/4037f5843793.webp', 'The FSD clothing range laid out by colourway.'],
  'universe-bio-lab': ['/fsd-assets/3daa9883cec9.webp', 'FSD Nexus smart ring concept in golden shadows.'],
  'universe-hardware': ['/fsd-assets/menu-strength-equipment.webp', 'FSD black and gold dumbbells on the rack.'],
  'universe-global': ['/images/flagships/manchester-exterior.webp', 'Concept visualisation of the proposed FSD Manchester flagship at dusk.'],
  'universe-community-development': ['/fsd-assets/694b62506e9f.webp', 'FSD community training concept.'],
  'universe-strategic-concepts': ['/fsd-assets/c2b7a4ef8b29.webp', 'The FSD shield and wordmark.'],
  'bio-lab-concepts': ['/fsd-assets/3daa9883cec9.webp', 'FSD Nexus smart ring concept in golden shadows.'],
  'innovation-hub': ['/fsd-assets/1eeba2ae57b0.webp', 'FSD adaptive technical fabric with shield mark.'],
  'bio-lab-strategic-concepts': ['/fsd-assets/07abc61fc7ed.webp', 'Close detail of FSD technical fabric.'],
  'strength-equipment': ['/fsd-assets/menu-strength-equipment.webp', 'Chalked hand lifting an FSD black and gold dumbbell from the rack.'],
  'combat-equipment': ['/fsd-assets/ac7d82c01281.webp', 'FSD black and gold boxing gloves.'],
  'recovery-technology': ['/images/flagships/manchester-recovery-suite.webp', 'Concept visualisation of an FSD recovery and hydrotherapy suite.'],
  'performance-accessories': ['/fsd-assets/12f56716e1e4.webp', 'FSD performance gym bag.'],
  'our-story': ['/fsd-assets/c2b7a4ef8b29.webp', 'The FSD shield and wordmark.'],
  flagships: ['/images/flagships/manchester-exterior.webp', 'Concept visualisation of the proposed FSD Manchester flagship at dusk.'],
  'fight-promotions': ['/images/flagships/manchester-boxing-hall.webp', 'Concept visualisation of an FSD boxing hall.'],
  'global-vision-operations': ['/images/flagships/ireland-training-floor.webp', 'Concept visualisation of an FSD flagship training floor.'],
  'investor-relations': ['/images/flagships/manchester-lounge.webp', 'Concept visualisation of the FSD Manchester members’ lounge.'],
  'community-culture': ['/fsd-assets/8ffe2fd45a06.webp', 'FSD women’s combat training session.'],
  'tactical-shield-membership': ['/images/flagships/manchester-lounge.webp', 'Concept visualisation of the FSD members’ lounge.'],
  'vip-registration': ['/images/flagships/manchester-training-floor.webp', 'Concept visualisation of the FSD Manchester training floor.'],
  'collection-announcements': ['/fsd-assets/3e7e5e1e2217.webp', 'Black and gold detail from an FSD capsule.'],
  'private-enquiries': ['/images/flagships/manchester-lounge.webp', 'Concept visualisation of the FSD members’ lounge.'],
});

const MENU_POPULAR_LIMIT = 4;
const MENU_KEEP_UPPER = new Set(['FSD', 'MMA', 'PPV', 'VIP', 'NFC', 'UK', 'BIO-LAB™', 'II', 'III']);
const MENU_KEEP_LOWER = new Set(['and', 'of', 'the', 'for', 'in', 'to', '&']);

// Category names are stored in capitals for the header; the editorial menu
// sets them in a serif, so present them in title case for readability.
export function editorialTitle(value) {
  return String(value ?? '').split(/(\s+)/).map((word, index) => {
    if (!word.trim()) return word;
    if (MENU_KEEP_UPPER.has(word)) return word;
    const lower = word.toLocaleLowerCase('en-GB');
    if (index > 0 && MENU_KEEP_LOWER.has(lower)) return lower;
    return lower.replace(/(^|[-’'(])(\p{L})/gu, (match, lead, letter) => lead + letter.toLocaleUpperCase('en-GB'))
      .replace(/’S\b/g, '’s');
  }).join('');
}

export function imageForNavigationGroup(group) {
  const mapped = MENU_GROUP_IMAGES[group?.id];
  if (mapped) return { src: mapped[0], alt: mapped[1], presentation: 'editorial' };
  for (const item of group?.items || []) {
    const image = featureImageForItem(item);
    if (image) return image;
  }
  return null;
}

function editorialActionLabel(menu, group, item, available) {
  if (!available) return 'COMING SOON';
  if (menu.id === 'house' && item?.href === FSD_STORY_PATH) return 'READ THE STORY';
  if (menu.id === 'house' && group?.id === 'investor-relations') return 'OPEN INVESTOR RELATIONS';
  if (menu.id === 'house') return 'OPEN PAGE';
  if (menu.id === 'private-access') return 'VIEW ACCESS INFORMATION';
  if (item?.kind === 'draft-product') return item.previewActionLabel || 'EXPLORE PRODUCT';
  if (item?.kind === 'shop-all') return 'SHOP ALL PRODUCTS';
  if (item?.kind === 'clothing-lines') return 'BROWSE ALL CLOTHING LINES';
  if (item?.kind === 'clothing-line') return 'VIEW THIS LINE';
  if (item?.record) return 'VIEW DETAILS';
  return 'EXPLORE COLLECTION';
}

function editorialMedia(menu, group, item, { tag = 'div', available = false } = {}) {
  const image = featureImageForItem(item) || imageForNavigationGroup(group);
  const title = item?.record?.name || item?.title || group?.title || 'FSD';
  const productTreatment = image?.presentation === 'product' ? ' fsd-feature-media--product' : '';
  const inner = image
    ? `<img src="${escapeHTML(image.src)}" alt="${escapeHTML(image.alt)}" data-fsd-image-fallback="true"
        data-fsd-image-title="${escapeHTML(title)}" data-fsd-image-kind="collection" loading="eager" decoding="async">`
    : '';
  const mediaClass = image ? `fsd-feature-media fsd-feature-media--1 fsd-ed-media${productTreatment}` : 'fsd-feature-media fsd-feature-media--unmapped fsd-ed-media';
  const caption = `<span class="fsd-ed-media__caption"><b>${escapeHTML(group?.title || menu.label)}</b>${item && item.title !== group?.title ? `<i>${escapeHTML(item.title)}</i>` : ''}</span>`;
  if (!image) return imagePlaceholderMarkup({ title, kind: 'collection', className: mediaClass });
  if (tag === 'button' && available) {
    return `<button type="button" class="fsd-ed-media-action" data-nav-destination aria-label="Open ${escapeHTML(title)}">
      <span class="${mediaClass}" data-feature-image="${escapeHTML(image.src)}">${inner}${caption}</span></button>`;
  }
  return `<div class="${mediaClass}" data-feature-image="${escapeHTML(image.src)}">${inner}${caption}</div>`;
}

function editorialItemRows(menu, group, activeItemIndex, canNavigate, { expanded = false, thumbnails = false } = {}) {
  const showAll = expanded || activeItemIndex >= MENU_POPULAR_LIMIT;
  const items = showAll ? group.items : group.items.slice(0, MENU_POPULAR_LIMIT);
  return items.map((item, index) => {
    const available = canNavigate({ menu, group, item });
    const thumb = thumbnails ? featureImageForItem(item) || imageForNavigationGroup(group) : null;
    return `<li><button type="button" class="fsd-nav-item fsd-ed-item${index === activeItemIndex ? ' is-active' : ''}"
      data-nav-item="${index}" data-nav-available="${available}" aria-pressed="${index === activeItemIndex}">
      ${thumb ? `<span class="fsd-ed-thumb"><img src="${escapeHTML(thumb.src)}" alt="" loading="lazy" decoding="async"></span>` : ''}
      <span class="fsd-ed-item__title">${escapeHTML(item.title)}</span>
      <span class="fsd-ed-item__arrow" aria-hidden="true">${available ? '→' : '·'}</span>
    </button></li>`;
  }).join('');
}

function editorialViewAll(group, expanded) {
  if (group.items.length <= MENU_POPULAR_LIMIT) return '';
  return `<button type="button" class="fsd-ed-viewall" data-nav-viewall aria-expanded="${expanded}">
    ${expanded ? 'SHOW MOST POPULAR' : `VIEW ALL ${group.items.length}`} <span aria-hidden="true">${expanded ? '↑' : '→'}</span></button>`;
}

function renderPanel(menu, activeGroupIndex, activeItemIndex, mobileStep, products, canNavigate, currentPrimaryId = '', { expanded = false } = {}) {
  const group = menu.groups[activeGroupIndex] || menu.groups[0];
  const item = group?.items?.[activeItemIndex] || group?.items?.[0];
  const isMobileStep = mobileStep !== 'desktop';
  const available = group ? canNavigate({ menu, group, item }) : false;
  const listLabel = group && group.items.length > MENU_POPULAR_LIMIT ? 'MOST POPULAR' : 'IN THIS CATEGORY';
  const mobilePrimaries = `${primaryNavigation.map(entry => `<div class="fsd-mobile-primary-row">
      <button type="button"
        class="fsd-mobile-primary${entry.id === menu.id ? ' is-active' : ''}"
        data-nav-primary="${entry.id}" aria-expanded="${entry.id === menu.id}">
        ${escapeHTML(entry.label)}<span aria-hidden="true">⌄</span>
      </button>
      <a class="fsd-mobile-primary-overview" href="${escapeHTML(divisionLandingPaths[entry.id])}"
        aria-label="Open ${escapeHTML(entry.label)} division overview"
        ${entry.id === currentPrimaryId ? 'aria-current="page"' : ''}>↗</a>
  </div>`).join('')}`;

  const groupRows = menu.groups.map((entry, index) => {
    const isActive = index === activeGroupIndex;
    const groupAvailable = canNavigate({ menu, group: entry, item: null });
    const thumb = imageForNavigationGroup(entry);
    const sub = isActive && !isMobileStep ? `<div class="fsd-ed-sub">
        <p class="fsd-ed-sub__label">${listLabel}</p>
        <ul class="fsd-ed-sub__list" role="group" aria-label="${escapeHTML(entry.title)}">${editorialItemRows(menu, entry, activeItemIndex, canNavigate, { expanded })}</ul>
        ${editorialViewAll(entry, expanded)}
      </div>` : '';
    return `<li class="fsd-ed-group${isActive ? ' is-active' : ''}">
      <button type="button" class="fsd-nav-group fsd-ed-group__button${isActive ? ' is-active' : ''}"
        data-nav-group="${index}" data-nav-available="${groupAvailable}" aria-pressed="${isActive}"
        aria-label="${escapeHTML(entry.title)}, ${entry.items.length} ${entry.items.length === 1 ? 'range' : 'ranges'}">
        ${thumb ? `<span class="fsd-ed-thumb fsd-ed-thumb--group"><img src="${escapeHTML(thumb.src)}" alt="" loading="lazy" decoding="async"></span>` : '<span class="fsd-ed-thumb fsd-ed-thumb--group fsd-ed-thumb--empty"></span>'}
        <span class="fsd-ed-group__index">${String(index + 1).padStart(2, '0')}</span>
        <span class="fsd-ed-group__title">${escapeHTML(editorialTitle(entry.title))}</span>
        <span class="fsd-ed-group__count">${entry.items.length}</span>
      </button>
      ${sub}
    </li>`;
  }).join('');

  const feature = group ? `<article class="fsd-ed-feature" data-feature-group="${escapeHTML(group.id)}">
      ${editorialMedia(menu, group, item, { tag: 'button', available })}
      <div class="fsd-ed-feature__copy">
        <p class="fsd-ed-kicker">${escapeHTML(menu.label)} <span>/</span> ${escapeHTML(group.title)}</p>
        <h3 id="modal-title">${escapeHTML(item?.record?.name || item?.title || group.title)}</h3>
        ${(() => {
          const description = item?.description || group.description || '';
          const heading = item?.record?.name || item?.title || group.title;
          return description && description !== heading ? `<p class="fsd-ed-feature__desc">${escapeHTML(description)}</p>` : '';
        })()}
        <button type="button" class="fsd-ed-cta" id="modal-action-btn" data-nav-destination
          ${available ? '' : 'disabled aria-disabled="true"'}>${editorialActionLabel(menu, group, item, available)} <span aria-hidden="true">→</span></button>
      </div>
    </article>` : '';

  const mobileDetail = group && mobileStep === 'detail' ? `<section class="fsd-ed-detail" aria-label="${escapeHTML(group.title)}">
      ${editorialMedia(menu, group, null, { tag: 'button', available: canNavigate({ menu, group, item: null }) || available })}
      <h3 class="fsd-ed-detail__title">${escapeHTML(editorialTitle(group.title))}</h3>
      <p class="fsd-ed-sub__label">${listLabel}</p>
      <ul class="fsd-ed-sub__list fsd-ed-sub__list--thumbs" role="group" aria-label="${escapeHTML(group.title)}">${editorialItemRows(menu, group, activeItemIndex, canNavigate, { expanded, thumbnails: true })}</ul>
      ${editorialViewAll(group, expanded)}
    </section>` : '';

  return `<div class="fsd-mega-inner fsd-ed" data-ed-step="${escapeHTML(mobileStep)}">
    <h2 class="fsd-ed-sr" id="menu-section-title">${escapeHTML(menu.title)}</h2>
    ${isMobileStep ? `<div class="fsd-ed-sheet-handle" aria-hidden="true"></div>
    <nav class="fsd-mobile-primary-list fsd-ed-chips" aria-label="FSD sections">${mobilePrimaries}</nav>
    ${mobileStep === 'detail' ? `<div class="fsd-mobile-stepbar fsd-ed-backbar"><button type="button" data-nav-back>← ${escapeHTML(menu.label)}</button><span>${escapeHTML(group?.title || '')}</span></div>` : ''}` : ''}
    ${mobileDetail || `<div class="fsd-ed-grid">
      <div class="fsd-ed-index">
        <p class="fsd-ed-kicker">${escapeHTML(menu.label)} <span>/</span> ${menu.groups.length} ${menu.groups.length === 1 ? 'CATEGORY' : 'CATEGORIES'}</p>
        <ul class="fsd-ed-groups" id="primary-group-list" role="group" aria-label="${escapeHTML(menu.label)} categories">${groupRows}</ul>
        ${menu.id === 'collections' ? '<button type="button" class="fsd-ed-catalogue" data-nav-catalogue>Browse the full catalogue <span aria-hidden="true">→</span></button>' : ''}
        <a class="fsd-ed-all" href="${escapeHTML(divisionLandingPaths[menu.id] || '/')}">VIEW ALL OF ${escapeHTML(menu.label)} <span aria-hidden="true">→</span></a>
      </div>
      ${isMobileStep ? '' : feature}
    </div>`}
    <p class="fsd-ed-hint">${isMobileStep ? 'Tap outside the menu to close' : 'Click outside or press Esc to close'}</p>
  </div>`;
}

export function renderNavigationHeader(brandMarkup) {
  const primaryItems = primaryNavigation.map(item => {
    const destination = divisionLandingPaths[item.id];
    if (!destination) throw new Error(`Missing destination for the ${item.label} navigation item.`);
    return `<div class="fsd-primary-item">
      <a class="fsd-primary-link" data-nav-destination="${item.id}" href="${escapeHTML(destination)}">${escapeHTML(item.label)}</a>
      <button type="button" class="fsd-primary-trigger fsd-primary-menu-toggle"
        data-nav-primary="${item.id}" aria-controls="fsd-mega-menu" aria-expanded="false"
        aria-label="Open ${escapeHTML(item.label)} menu"><span aria-hidden="true">⌄</span></button>
    </div>`;
  }).join('');
  return `<div class="announcement fsd-announcement">FSD / THE HOUSE OF PERFORMANCE <span>·</span> INVESTOR RELATIONS</div>
    <div class="fsd-navigation-shell" data-navigation-shell>
      <header class="header fsd-header fsd-glass-surface">
        <a class="brand fsd-brand" href="#home" aria-label="FSD Home">
          ${brandMarkup}
        </a>
        <nav class="fsd-primary-nav" aria-label="Main navigation">${primaryItems}</nav>
        <span class="fsd-header-note">UNITED KINGDOM <i aria-hidden="true">·</i> FSD</span>
        <button type="button" class="fsd-search-trigger" data-search-open
          aria-label="Search products" aria-haspopup="dialog" aria-controls="fsd-search-dialog"
          aria-expanded="false">
          ${outlineIcon('search', 'fsd-icon fsd-search-icon')}
          <span>SEARCH</span>
        </button>
        <button type="button" class="fsd-bag-toggle" data-bag-open aria-controls="fsd-bag-dialog"
          aria-expanded="false" aria-label="Open bag, 0 items">
          <svg class="fsd-boxing-bag-icon" viewBox="4 0 16 24" aria-hidden="true" fill="none">
            <path class="fsd-boxing-bag-icon__chain" d="M12 1.7v2.4m-2.1 0h4.2"/>
            <path class="fsd-boxing-bag-icon__body" d="M9.15 5.05h5.7l1.5 2.15v9.2a2.85 2.85 0 0 1-2.85 2.85h-3a2.85 2.85 0 0 1-2.85-2.85V7.2l1.5-2.15Z"/>
            <path class="fsd-boxing-bag-icon__seam" d="M7.65 9.1h8.7m-8.7 5.3h8.7"/>
            <path class="fsd-boxing-bag-icon__highlight" d="M9.35 7.7v8.8"/>
          </svg>
          <span>BAG</span><span class="fsd-bag-count" data-bag-count>0</span>
        </button>
        <button type="button" class="fsd-mobile-toggle" data-nav-mobile-toggle
          aria-controls="fsd-mega-menu" aria-expanded="false" aria-label="Open navigation">
          <span>MENU</span><i aria-hidden="true"></i><i aria-hidden="true"></i>
        </button>
      </header>
      <nav class="fsd-mobile-public-links" aria-label="Quick navigation">
        <button type="button" class="fsd-primary-trigger fsd-house-menu-trigger"
          data-nav-primary="house" aria-controls="fsd-mega-menu" aria-expanded="false">THE HOUSE</button>
      </nav>
      <section class="fsd-mega-menu mega-menu fsd-glass-surface" id="fsd-mega-menu" data-unified-menu="true" data-nav-panel hidden aria-label="FSD navigation">
        <div data-nav-content></div>
      </section>
    </div>
    <div class="fsd-navigation-spacer" aria-hidden="true"></div>`;
}

export function mountNavigation({
  root = document.querySelector('[data-navigation-shell]'),
  divisions = collectionDivisions,
  products = catalogueProducts,
  includeDraftPreviews = false,
  draftMenuItems = [],
  configureMenus = () => {},
  draftPreviewTargets = new Map(),
  onNavigate = () => {},
} = {}) {
  if (!root) throw new TypeError('mountNavigation requires the FSD navigation shell.');
  const windowRef = root.ownerDocument?.defaultView || window;
  installImageErrorFallbacks(root.ownerDocument || document);
  const panel = root.querySelector('[data-nav-panel]');
  const content = root.querySelector('[data-nav-content]');
  const mobileToggle = root.querySelector('[data-nav-mobile-toggle]');
  const model = createNavigationModel({ divisions, products, includeDraftPreviews, draftMenuItems, configureMenus });
  const triggers = [...root.querySelectorAll('.fsd-primary-trigger')];
  if (!panel || !content || !mobileToggle) throw new TypeError('The FSD navigation markup is incomplete.');
  // A page-level scrim sits behind the open menu. It lives outside the
  // navigation shell, so a click on it counts as an outside click and closes
  // the menu without activating anything on the page underneath.
  const ownerDocument = root.ownerDocument || document;
  let scrim = ownerDocument.querySelector('[data-nav-scrim]');
  if (!scrim) {
    scrim = ownerDocument.createElement('div');
    scrim.className = 'fsd-nav-scrim';
    scrim.setAttribute('data-nav-scrim', '');
    scrim.setAttribute('aria-hidden', 'true');
    ownerDocument.body.append(scrim);
  }
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
  let expandedList = false;
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
    for (const link of root.querySelectorAll('[data-nav-destination]')) {
      if (link.dataset.navDestination === currentPrimaryId) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    for (const link of root.querySelectorAll('.fsd-mobile-primary-overview')) {
      const destinationId = primaryNavigation.find(entry =>
        link.getAttribute('href') === divisionLandingPaths[entry.id])?.id;
      if (destinationId === currentPrimaryId) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
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
    ['#house-menu', 'house'],
    ['#fsd-house-archive', 'house'],
    ['#contact', 'private-access'],
    ['#technical-collections-archive', 'collections'],
    ...CATALOGUE_COLLECTIONS.map(collection => [
      collection.href.slice(collection.href.indexOf('#')), 'collections',
    ]),
  ]);
  const setCurrentPrimary = id => {
    currentPrimaryId = model.some(menu => menu.id === id) ? id : '';
    syncExpanded();
  };
  const currentNavigationId = () => {
    if (window.location.hash) return hashNavigation.get(window.location.hash) || '';
    const pathname = window.location.pathname.replace(/\/+$/, '');
    const divisionPath = Object.entries(divisionLandingPaths)
      .find(([, destination]) => destination === pathname);
    if (divisionPath) return divisionPath[0];
    if (pathname.startsWith('/collections/')) return 'collections';
    return pathname === FSD_STORY_PATH
      || pathname === FSD_HOUSE_PAGE_PATH
      || pathname === '/investor.html'
      ? 'house'
      : pathname === '/private.html' ? 'private-access' : '';
  };
  const updateCurrentFromHash = () => setCurrentPrimary(currentNavigationId());
  currentPrimaryId = currentNavigationId();

  const render = () => {
    clearTimeout(featureTransitionTimer);
    const oldMedia = content.querySelector('.fsd-feature-media');
    const oldImage = oldMedia?.querySelector('img:not(.fsd-feature-image--outgoing)');
    const oldSource = oldImage?.getAttribute('src') || '';
    const outgoingImage = oldImage?.cloneNode(false) || null;
    const menu = currentMenu();
    panel.dataset.primary = menu.id;
    panel.dataset.step = mobileStep;
    content.innerHTML = renderPanel(menu, activeGroupIndex, activeItemIndex, mobileStep, products, canNavigate, currentPrimaryId, { expanded: expandedList });
    const media = content.querySelector('.fsd-feature-media');
    const incomingImage = media?.querySelector('img');
    const incomingSource = incomingImage?.getAttribute('src') || '';
    if (!media || oldSource === incomingSource || (!oldSource && !incomingSource)) {
      syncExpanded();
      return;
    }
    if (prefersReducedMotion()) {
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
    expandedList = false;
    mobileStep = step === 'mobile' ? 'primary' : 'desktop';
    hoverOpened = hover;
    isOpen = true;
    panel.hidden = false;
    root.classList.add('is-open');
    scrim.classList.add('is-visible');
    document.body.classList.toggle('fsd-mobile-nav-open', isMobile());
    render();
  };

  const closeMenu = ({ restoreFocus = false, immediate = false } = {}) => {
    if (!isOpen && panel.hidden) return;
    isOpen = false;
    hoverOpened = false;
    clearTimeout(pointerTimer);
    root.classList.remove('is-open');
    scrim.classList.remove('is-visible');
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
    expandedList = false;
    mobileStep = mobile ? 'groups' : 'desktop';
    isOpen = true;
    panel.hidden = false;
    root.classList.add('is-open');
    scrim.classList.add('is-visible');
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
    if (groupChanged) expandedList = false;
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
      if (!pointerInside && isOpen && !isMobile()) {
        closeMenu({ restoreFocus: panel.contains(document.activeElement) });
      }
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
      if (primaryButton.closest('.fsd-mobile-public-links')) {
        choosePrimary(id, true);
        return;
      }
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
    if (event.target === panel || event.target.closest('.fsd-ed-hint')) {
      closeMenu({ restoreFocus: true });
      return;
    }
    if (event.target.closest('[data-nav-close]')) {
      closeMenu({ restoreFocus: true });
      return;
    }
    if (event.target.closest('[data-nav-back]')) {
      mobileStep = 'groups';
      expandedList = false;
      render();
      panel.querySelector(`[data-nav-group="${activeGroupIndex}"]`)?.focus({ preventScroll: true });
      return;
    }
    if (event.target.closest('[data-nav-viewall]')) {
      expandedList = !expandedList;
      renderPreservingFocus('[data-nav-viewall]');
      return;
    }
    if (event.target.closest('[data-nav-catalogue]')) {
      const menu = currentMenu();
      const selection = {
        menu,
        group: { id: 'shop-all-products', title: 'Browse the full catalogue' },
        item: { id: 'browse-catalogue', kind: 'shop-all', href: '#products' },
      };
      navigateSelection(selection);
      return;
    }

    const groupButton = event.target.closest('[data-nav-group]');
    if (groupButton && panel.contains(groupButton)) {
      const index = Number(groupButton.dataset.navGroup);
      if (currentMenu().id === 'house') {
        chooseGroup(index, { mobile: isMobile() });
        return;
      }
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
      if (menu.id === 'house') {
        chooseItem(itemIndex);
        return;
      }
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
    // On touch layouts the tap itself chooses the row; previewing on focus
    // would re-render the row before its click lands.
    if (!isOpen || suppressFocusPreview || isMobile()) return;
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
      // Native modal dialogs own Escape while they are open. A full product
      // detail view is non-modal, so it must not trap the header menu.
      const openDialogs = root.ownerDocument.querySelectorAll?.('dialog[open]') || [];
      const hasOpenModalDialog = [...openDialogs].some(dialog =>
        typeof dialog.matches === 'function'
          ? dialog.matches(':modal')
          : dialog.dataset.presentation !== 'detail');
      if (hasOpenModalDialog) return;
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
    if (isOpen && !event.composedPath().includes(root)) {
      closeMenu({ restoreFocus: panel.contains(document.activeElement) });
    }
  };

  const onRootPointerEnter = () => {
    pointerInside = true;
    clearTimeout(pointerTimer);
  };
  const onRootPointerLeave = event => {
    if (event.pointerType !== 'mouse' || isMobile()) return;
    pointerInside = false;
    // The editorial overlay stays open until the visitor clicks outside it or
    // presses Escape, so a small pointer drift never snaps it shut.
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
  // Hide the banner while scrolling down; bring it back as soon as the visitor scrolls up.
  let lastScrollY = windowRef.scrollY;
  const setHeaderHidden = hidden => {
    root.classList.toggle('is-hidden-on-scroll', hidden);
    root.ownerDocument.documentElement.classList.toggle('fsd-header-hidden', hidden);
  };
  const updateHeaderScrollState = () => {
    const y = Math.max(0, windowRef.scrollY);
    root.classList.toggle('is-scrolled', y > 50);
    const delta = y - lastScrollY;
    if (Math.abs(delta) < 6) return;
    const keepVisible = isOpen || y < 120 || root.contains(root.ownerDocument.activeElement);
    setHeaderHidden(!keepVisible && delta > 0);
    lastScrollY = y;
  };
  root.addEventListener('focusin', () => setHeaderHidden(false));
  updateHeaderScrollState();
  windowRef.addEventListener('scroll', updateHeaderScrollState, { passive: true });
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

  if (window.location.hash === '#house-menu') {
    if (isMobile()) choosePrimary('house', true);
    else openMenu('house');
  }

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
    windowRef.removeEventListener('scroll', updateHeaderScrollState);
    sectionObserver?.disconnect();
    scrim.remove();
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
