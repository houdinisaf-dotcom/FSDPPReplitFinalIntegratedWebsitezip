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
        ...(binding ? { featureImageSrc: binding.src, featureImageAlt: binding.alt } : {}),
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
      description: 'Location details are being prepared. No operating site or service is represented.',
    };
  });
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
          status: 'Operating or rollout underway',
          description: 'Operating initiative developing modular, transportable training, retail, and community-learning infrastructure. No pod or location is currently operational.',
        },
        {
          id: 'predictive-popups',
          title: 'Autonomous Pop-Ups & Predictive Stock',
          hash: 'global/predictive-popups',
          href: '/autonomous-popups.html',
          kind: 'initiative',
          status: 'Operating or rollout underway',
          description: 'Staffed flexible retail and demand-informed stock planning. No venue or stock service is live; “autonomous” refers to planning, not unstaffed or cashier-less retail.',
        },
        {
          id: 'mobile-testing-labs',
          title: 'Mobile Testing Labs',
          hash: 'global/mobile-testing-labs',
          href: '/mobile-testing-labs.html',
          kind: 'initiative',
          status: 'Operating or rollout underway',
          description: 'Active initiative for mobile trials and consent-based feedback. No unit, venue, test, or data collection is live; biometric sensor tracking is not in confirmed scope.',
        },
        {
          id: 'local-micro-manufacturing',
          title: 'Local Micro-Manufacturing',
          hash: 'global/local-micro-manufacturing',
          href: '/local-micro-manufacturing.html',
          kind: 'initiative',
          status: 'Operating or rollout underway',
          description: 'Active initiative assessing small-batch production. No partner, hub, site, or custom-order service is live; environmental benefits are not verified.',
        },
        {
          id: 'genetic-microbiome',
          title: 'Genetic & Microbiome Personalisation',
          hash: 'global/genetic-microbiome',
          href: '/genetic-microbiome.html',
          kind: 'initiative',
          status: 'Operating or rollout underway',
          description: 'Long-horizon research with strict scientific and privacy gates. No testing, sample collection, data analysis, or personalised health guidance is available; no clinical partner is confirmed.',
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
      'Investor Relations; no public investor dossier is currently available.',
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
          status: 'Operating or rollout underway',
          description: 'Operating initiative for structured feedback and co-creation. No workshops, trials, forums, portal, or submissions are open.',
        },
        {
          id: 'performance-partnerships',
          title: 'Performance-Linked Partnerships',
          hash: 'community/performance-partnerships',
          href: '/performance-partnerships.html',
          kind: 'initiative',
          status: 'Operating or rollout underway',
          description: 'Operating partnership initiative. No specific partner or live testing programme is identified here.',
        },
        {
          id: 'circular-trade-in',
          title: 'Circular Trade-In Programme',
          hash: 'community/circular-trade-in',
          href: '/circular-trade-in.html',
          kind: 'initiative',
          status: 'Operating or rollout underway',
          description: 'Operating circularity initiative assessing inspection, repair, reuse, resale, and recycling pathways. No trade-ins, eligibility, or credit terms are available.',
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
      ]),
  ];
}

function makePrivateGroups() {
  const details = [
    ['tactical-shield-membership', 'TACTICAL SHIELD MEMBERSHIP',
      'Membership information only. Terms and benefits are not confirmed; registration is not open and no sign-up data is collected.', false],
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
      description: 'The story, community initiatives, Bio-Lab, and active FSD Global programmes.',
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

  const bioLabMenu = menus.find(menu => menu.id === 'bio-lab');
  if (bioLabMenu) {
    bioLabMenu.groups.push({
      id: 'innovation-hub',
      title: 'INNOVATION HUB',
      description: 'Browse Bio-Lab products and active material-science and connected-apparel initiatives.',
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

function featureMetadataText(value, fallback = 'To be confirmed') {
  if (Array.isArray(value)) {
    const joined = value.filter(Boolean).map(String).join(' / ');
    return joined || fallback;
  }
  if (value !== null && value !== undefined && String(value).trim()) {
    return String(value).trim();
  }
  return fallback;
}

function renderFeature(menu, group, item, canNavigate) {
  const isStoryFeature = menu.id === 'house' && item?.href === FSD_STORY_PATH;
  const image = featureImageForItem(item);
  const exactItemImage = Boolean(image);
  const featureTitle = isStoryFeature
    ? 'THE FSD STORY & ARCHIVE'
    : item?.record?.name || item?.title || group?.title || 'FSD';
  const description = item?.description ||
    item?.record?.coverage ||
    item?.record?.priceBasis ||
    group?.description ||
    '';
  const available = canNavigate({ menu, group, item });
  const colourways = featureMetadataText(
    item?.record?.colourways ?? item?.record?.colorways ?? item?.colourways ??
      item?.source?.colourways ?? item?.source?.colorways ??
      item?.sourceGroup?.colourways ?? group?.colourways,
    '—',
  );
  const audience = featureMetadataText(
    item?.record?.audience ?? item?.audience ??
      item?.source?.audiences ?? item?.sourceGroup?.audiences ?? group?.audiences,
    '—',
  );
  const metadataRows = isStoryFeature
    ? [
      ['Chapters', item?.chapterCount || '04 FOUNDATIONAL CHAPTERS'],
      ['House Codes', item?.houseCodeCount || '05 WORKING PRINCIPLES'],
    ]
    : menu.id === 'house'
      ? [['Collection group', group?.title || '—'], ...(item?.status ? [['Status', item.status]] : [])]
    : [
       ['Colourways', colourways],
      ['Audience', audience],
    ];

  const media = isStoryFeature
    ? `<div class="fsd-feature-media fsd-feature-media--story">
        <span>FSD / THE HOUSE</span>
        <strong>Capability is not a costume.<br/><em>It is a practice.</em></strong>
        <small>Four foundational chapters · Five House Codes</small>
      </div>`
    : image
    ? `<div class="fsd-feature-media fsd-feature-media--1" data-feature-image="${escapeHTML(image.src)}">
        <img src="${escapeHTML(image.src)}" alt="${escapeHTML(image.alt)}"
          data-fsd-image-fallback="true" data-fsd-image-title="${escapeHTML(featureTitle)}" data-fsd-image-kind="collection"
          loading="eager" fetchpriority="auto" decoding="async">
      </div>`
    : imagePlaceholderMarkup({ title: featureTitle, kind: 'collection', className: 'fsd-feature-media fsd-feature-media--unmapped' });
  const mediaAction = available
    ? `<button type="button" class="fsd-feature-media-action" data-nav-destination
        aria-label="Open ${escapeHTML(featureTitle)}">
        ${media}
      </button>`
    : media;

  const actionLabel = !available ? 'DESTINATION UNAVAILABLE'
    : isStoryFeature ? 'READ THE STORY & ARCHIVE'
    : menu.id === 'house' && group?.id === 'investor-relations' ? 'OPEN INVESTOR RELATIONS'
      : menu.id === 'house' && group?.id === 'our-story' ? 'READ THE SECTION'
        : menu.id === 'house' && group?.id === 'fight-promotions' && item?.href === '/fight-promotions.html' ? 'VIEW CONCEPT PAGE'
          : menu.id === 'house' && group?.id === 'fight-promotions' && item?.href === '/live-events.html' ? 'VIEW INITIATIVE'
          : menu.id === 'house' && group?.id === 'fight-promotions' && item?.href === '/broadcast-ppv.html' ? 'VIEW INITIATIVE'
          : menu.id === 'house' && group?.id === 'fight-promotions' && item?.href === '/athlete-development.html' ? 'VIEW INITIATIVE'
          : menu.id === 'house' && group?.id === 'fight-promotions' && item?.href === '/academy-grassroots.html' ? 'VIEW INITIATIVE'
        : menu.id === 'house' && ['community-culture', 'global-vision-operations'].includes(group?.id) ? 'VIEW INITIATIVE'
      : item?.kind === 'draft-product' ? (item.previewActionLabel || 'EXPLORE PRODUCT')
      : item?.kind === 'shop-all' ? 'SHOP ALL PRODUCTS'
      : item?.kind === 'clothing-lines' ? 'BROWSE ALL CLOTHING LINES'
        : item?.kind === 'clothing-line' ? 'VIEW THIS LINE'
      : item?.record ? 'VIEW DETAILS'
      : menu.id === 'private-access' ? 'VIEW ACCESS INFORMATION'
        : item?.kind === 'concept' ? 'EXPLORE COLLECTION'
            : item?.kind === 'subcategory' ? 'VIEW COLLECTION'
            : item?.kind === 'category' ? 'VIEW CATEGORY'
              : menu.id === 'house' ? 'EXPLORE THE HOUSE'
                : 'EXPLORE COLLECTION';

  return `<article class="fsd-feature-card feature-card">
    ${mediaAction}
    <div class="fsd-feature-copy">
      <p class="fsd-feature-kicker" id="modal-kicker">${item?.kind === 'draft-product' ? escapeHTML(item.previewKicker || 'FSD / COLLECTION') : exactItemImage ? 'FSD / SELECTED RECORD' : 'FSD / COLLECTION FEATURE'}</p>
      <h3 id="modal-title">${escapeHTML(featureTitle)}</h3>
      <p id="modal-desc">${escapeHTML(description)}</p>
      <dl class="fsd-feature-metadata" aria-label="Selected item details">
        ${metadataRows.map(([label, value], index) => `<div><dt>${escapeHTML(label)}</dt><dd${index === 0 ? ' data-status' : ''}>${escapeHTML(value)}</dd></div>`).join('')}
      </dl>
      <button type="button" class="fsd-feature-cta feature-btn" id="modal-action-btn" data-nav-destination
        ${available ? '' : 'disabled aria-disabled="true" title="No verified destination is available for this selection."'}>
        ${actionLabel}<span aria-hidden="true">${available ? outlineIcon('arrowUpRight', 'fsd-icon') : '—'}</span>
      </button>
    </div>
  </article>`;
}

function renderGroupButtons(menu, activeGroupIndex, canNavigate) {
  return menu.groups.map((group, index) => {
    const available = canNavigate({ menu, group, item: null });
    const status = menu.id === 'house'
      ? 'Select this collection group to view its subcategories.'
      : 'Open this collection group.';
    return `<li><button type="button"
      class="fsd-nav-option fsd-nav-group${index === activeGroupIndex ? ' is-active' : ''}"
      data-nav-group="${index}" data-nav-available="${available}" aria-label="${escapeHTML(group.title)}. ${status}"
      title="${status}" aria-pressed="${index === activeGroupIndex}">
    <span class="fsd-nav-index">${String(index + 1).padStart(2, '0')}</span>
    <span>${escapeHTML(group.title)}</span>
      <span class="fsd-nav-arrow" aria-hidden="true">${available ? outlineIcon('arrowUpRight', 'fsd-icon fsd-nav-arrow-icon') : '—'}</span>
  </button></li>`;
  }).join('');
}

function renderItemButtons(menu, group, activeItemIndex, canNavigate) {
  return group.items.map((item, index) => {
    const available = canNavigate({ menu, group, item });
    const status = menu.id === 'house' ? 'Preview this section.' : 'Open this collection item.';
    return `<li><button type="button"
      class="fsd-nav-option fsd-nav-item${index === activeItemIndex ? ' is-active' : ''}"
      data-nav-item="${index}" data-nav-available="${available}"
      aria-label="${escapeHTML(item.title)}. ${status}" title="${status}"
      aria-pressed="${index === activeItemIndex}">
    <span class="fsd-nav-index">${String(index + 1).padStart(2, '0')}</span>
    <span>${escapeHTML(item.title)}</span>
      <span class="fsd-nav-arrow" aria-hidden="true">${available ? outlineIcon('arrowUpRight', 'fsd-icon fsd-nav-arrow-icon') : '—'}</span>
  </button></li>`;
  }).join('');
}

function renderPanel(menu, activeGroupIndex, activeItemIndex, mobileStep, products, canNavigate, currentPrimaryId = '') {
  const group = menu.groups[activeGroupIndex] || menu.groups[0];
  const item = group?.items?.[activeItemIndex] || group?.items?.[0];
  const mobilePrimaries = `${primaryNavigation.map(entry => `<button type="button"
      class="fsd-mobile-primary${entry.id === menu.id ? ' is-active' : ''}"
      data-nav-primary="${entry.id}" aria-expanded="${entry.id === menu.id}"
      ${entry.id === currentPrimaryId ? 'aria-current="page"' : ''}>
      ${escapeHTML(entry.label)}<span aria-hidden="true">${outlineIcon('arrowUpRight', 'fsd-icon')}</span>
  </button>`).join('')}`;

  return `<div class="fsd-mega-inner">
    <div class="fsd-mega-heading menu-header-bar">
      <div>
        <p class="fsd-mega-eyebrow">${escapeHTML(menu.label)} <span>/</span> DIVISIONS</p>
        <h2 id="menu-section-title">${escapeHTML(menu.title)}</h2>
      </div>
      <button type="button" class="fsd-mega-close close-menu" id="close-menu-btn" data-nav-close aria-label="Close navigation">
        CLOSE ${outlineIcon('close', 'fsd-icon fsd-mega-close-icon')}
      </button>
    </div>
    <div class="fsd-mobile-stepbar">
      <button type="button" data-nav-back>${outlineIcon('arrowLeft', 'fsd-icon')} ${mobileStep === 'detail' ? 'BACK TO GROUPS' : 'ALL CATEGORIES'}</button>
      <span>${escapeHTML(menu.label)}</span>
    </div>
    <nav class="fsd-mobile-primary-list" aria-label="FSD sections">${mobilePrimaries}</nav>
    <div class="fsd-nav-columns menu-grid">
      <section class="fsd-nav-column fsd-nav-column--groups menu-column" aria-labelledby="fsd-group-heading" data-nav-column="groups">
        <h3 class="menu-column-title" id="fsd-group-heading">COLLECTION GROUPS</h3>
        <ul class="fsd-nav-list menu-item-list" id="primary-group-list" role="group" aria-label="Collection groups">
          ${renderGroupButtons(menu, activeGroupIndex, canNavigate)}
        </ul>
      </section>
      <section class="fsd-nav-column fsd-nav-column--items menu-column" aria-labelledby="fsd-item-heading" data-nav-column="items">
        <h3 class="menu-column-title" id="fsd-item-heading">SUBCATEGORIES</h3>
        <ul class="fsd-nav-list menu-item-list" id="sub-category-list" role="group" aria-label="Subcategories">
          ${group ? renderItemButtons(menu, group, activeItemIndex, canNavigate) : '<li><p class="fsd-nav-empty">Select a collection group.</p></li>'}
        </ul>
      </section>
      <section class="fsd-nav-column fsd-nav-column--feature menu-column" aria-label="Featured collection">
        ${group ? renderFeature(menu, group, item, canNavigate) : ''}
      </section>
    </div>
    ${menu.id === 'collections' ? `<div class="fsd-nav-catalogue">
      <span>Looking for something specific?</span>
      <button type="button" data-nav-catalogue>Browse the full catalogue ${outlineIcon('arrowUpRight')}</button>
    </div>` : ''}
  </div>`;
}

export function renderNavigationHeader(brandMarkup) {
  const primaryItems = primaryNavigation.map(item => {
    const trigger = `<button type="button"
      class="fsd-primary-trigger" data-nav-primary="${item.id}" aria-controls="fsd-mega-menu"
      aria-expanded="false">${escapeHTML(item.label)}</button>`;
    return trigger;
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
    ['#house-menu', 'house'],
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
      // Native modal dialogs own Escape while they are open. Do not dismiss an
      // underlying menu as well; the dialog's cancel handler closes its layer.
      if (root.ownerDocument.querySelector('dialog[open]')) return;
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
  const updateHeaderScrollState = () => {
    root.classList.toggle('is-scrolled', windowRef.scrollY > 50);
  };
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
