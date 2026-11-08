// Public copy for The House pages that were previously held as internal drafts:
// Founder Story, Investor Relations and the five Flagship pages.
//
// Source: handoff/references/documents/FSD_Company_Overview_Opportunity_Document
// (Draft 1.1, October 2026) and the FSD Growth Plan v4.0 it cites.
//
// Publication rules applied here (keep them when editing):
// - Everything is described as a plan, concept or proposal. FSD is pre-commercial.
// - No funding amounts, valuation, returns, fees, royalties or territories are
//   published. Under UK FSMA s21 an invitation or inducement to invest must be
//   made by, or approved by, an FCA-authorised person unless an exemption applies.
//   Detailed figures are shared privately after an enquiry.
// - No address, lease, operator, opening date or facility is claimed for any
//   flagship. Architecture descriptions are design intent only.
// - No founder biography details are invented.

export const INVESTOR_ENQUIRY_HREF = '/enquiries.html?category=investor-corporate-relations';
export const FLAGSHIP_ENQUIRY_HREF = '/enquiries.html?category=flagship-property-opportunities';
export const PARTNERSHIP_ENQUIRY_HREF = '/enquiries.html?category=strategic-partnerships';

export const STATUS_NOTICE = 'FSD is a pre-commercial brand under development. Products, facilities, divisions and locations described here are plans and design concepts unless stated otherwise. No property, lease, operator, opening date or franchise network exists today.';

export const INVESTMENT_NOTICE = 'This page is for general information only. It is not an offer or invitation to invest, a financial promotion, a franchise offer or investment advice. Any discussion of investment takes place privately, with eligible parties, and is subject to professional advice and the applicable rules.';

const ACADEMY_ZONES = [
  ['Strength & conditioning', 'Racks, lifting platforms, barbells and conditioning equipment.'],
  ['Boxing training', 'Training ring, heavy bags, pad work and coaching stations.'],
  ['MMA & grappling', 'Mat or cage area for MMA, grappling, wrestling and coached sparring.'],
  ['Self-defence & martial arts', 'Technique, self-defence and martial arts classes.'],
  ['Women’s modest training suite', 'A privacy-conscious space with screening and female-led sessions where required.'],
  ['Recovery & wellness', 'Stretching, mobility, treatment and recovery space.'],
  ['Retail & pro shop', 'FSD apparel, regional collections, accessories and approved equipment.'],
  ['Nutrition bar & community', 'Refreshments, a social space and community programmes.'],
];

export const HORIZONS = [
  ['Horizon 1', 'The launch', 'A focused premium apparel launch led by FSD AEROFORGE — the Training Tee and Hybrid Short — sold direct to consumers through FSD’s own channels.'],
  ['Horizon 2', 'Extension', 'Wider product ranges, regional collections, the digital platform and app, business-to-business supply, partnerships and selected events.'],
  ['Horizon 3', 'The ecosystem', 'Flagship training academies, FSD Boxing & MMA Promotions, international markets and controlled partner or franchise models.'],
];

export const DIVISIONS = [
  ['A', 'Performance apparel & combat sports', 'Technical sportswear, gymwear, combat and self-defence clothing.'],
  ['B', 'Women’s performance & modest activewear', 'Technical women’s wear, sports hijabs, longline and full-coverage training wear.'],
  ['C', 'Equipment, accessories & recovery', 'Bags, gloves, mitts, mouthguards, home training and recovery products.'],
  ['D', 'Fitness & combat-sports academies', 'Flagship gyms, specialist zones, coached training and community.'],
  ['E', 'FSD Boxing & MMA Promotions', 'Fighter development, events, press, broadcast and sponsorship.'],
  ['F', 'Media, digital & community', 'Website, app, the FSD Media Network, education and content.'],
  ['G', 'Nutrition, wellness & future technology', 'Nutrition concepts, recovery, hydration and wearables.'],
];

export const HOUSE_PUBLIC_CONTENT = Object.freeze({
  'founder-story': {
    eyebrow: 'FSD / The House / Our Story',
    title: 'Founder Story',
    summary: 'Why FSD exists, what it stands for, and where it is going.',
    description: 'The FSD story: a British-origin performance, combat-sports and modest activewear brand built to help people train, move and live with strength, discipline and confidence.',
    sections: [
      {
        kind: 'lead',
        number: '01 / The beginning',
        heading: 'A house for those who train with purpose.',
        body: [
          'FSD — Fitness & Self Defence — exists to help people train, move and live with strength, discipline and confidence. It is built for the lifter, the fighter, the self-defence student and the woman who wants performance kit designed around coverage and comfort.',
          'FSD is a British-origin premium performance, combat-sports, activewear and fitness-lifestyle brand under development. Its aim is to take what already exists in these markets and raise it to a new standard, through functional design, premium presentation, inclusive modest activewear and a connected ecosystem of products, facilities, events and community.',
        ],
      },
      {
        kind: 'chapters',
        label: 'What FSD stands for',
        items: [
          ['01', 'Discipline', 'Strength, confidence, resilience and self-development — the values of training, carried into everything FSD makes.'],
          ['02', 'Function first', 'Technical function combined with premium presentation. Every product should earn its place through fit, materials, construction and training-specific purpose.'],
          ['03', 'Built for everyone', 'Dedicated modest activewear for women as a genuine specialist programme, not an add-on.'],
          ['04', 'One identity', 'Original design and one consistent identity: the angular shield, the FSD wordmark and the words Fitness & Self Defence.'],
          ['05', 'Connected', 'Apparel, equipment, facilities, events and community that reinforce one another.'],
          ['06', 'Evidence-led', 'Controlled growth, earned step by step, rather than premature expansion.'],
        ],
      },
      {
        kind: 'horizons',
        number: '02 / The direction',
        heading: 'One brand, built in three horizons.',
        intro: 'The long-term vision is ambitious; the current stage is early. FSD will grow in stages, so that each step is led by evidence.',
      },
      {
        kind: 'cta',
        heading: 'Be part of what comes next.',
        body: 'Whether you train, coach, create, supply or invest, we would like to hear from you.',
        actions: [
          ['Investor Relations', '/investor.html'],
          ['Explore the flagships', '/flagships/manchester.html'],
          ['Start an enquiry', PARTNERSHIP_ENQUIRY_HREF],
        ],
      },
    ],
  },

  'investor-relations': {
    eyebrow: 'FSD / The House / Investor Relations',
    title: 'Investor Relations',
    summary: 'A British performance brand, built in stages and led by evidence.',
    description: 'FSD Investor Relations: the FSD business concept, its seven divisions and three growth horizons, and how investors and strategic partners can contact the team.',
    sections: [
      {
        kind: 'lead',
        number: '01 / The opportunity',
        heading: 'More than a clothing company.',
        body: [
          'FSD is a premium, performance-led sportswear and equipment brand informed by functional fitness, combat sports and self-defence culture. It is designed as a scalable model that can be adapted to any market where sport and fitness culture is strong.',
          'Apparel builds the core customer relationship. Accessories and equipment support complementary purchases. Academies and events create community and product discovery. Promotions create a commercial and media platform. Digital content keeps customers engaged between purchases.',
        ],
      },
      {
        kind: 'facts',
        label: 'Where FSD is today',
        items: [
          ['Stage', 'Pre-commercial'],
          ['First products', 'AEROFORGE Training Tee & Hybrid Short'],
          ['First channel', 'Direct to consumer'],
          ['Structure', '7 divisions · 3 horizons'],
        ],
      },
      { kind: 'horizons', number: '02 / The plan', heading: 'Three horizons, each unlocked by evidence.', intro: 'Capital and expansion are staged. Each stage moves forward only when its evidence is in hand.' },
      { kind: 'divisions', number: '03 / The structure', heading: 'Seven connected divisions.' },
      {
        kind: 'chapters',
        label: 'How growth is governed',
        items: [
          ['01', 'Decision gates', 'Every product passes seven gates — concept, technical pack, prototype, performance test, pre-production, production and post-launch review — before it moves on.'],
          ['02', 'Staged capital', 'Funding is planned in stages and released only against documented milestones, so stock and commitments follow demand.'],
          ['03', 'Measured demand', 'Pilot batches, customer interviews, pre-orders and wear tests build the evidence base before any scale decision.'],
          ['04', 'Proper advice', 'Legal, tax, product-compliance and data-protection advisers are part of the plan in every market FSD enters.'],
        ],
      },
      {
        kind: 'cta',
        heading: 'Speak to investor relations.',
        body: 'Investors, strategic partners and advisers who would like to learn more can contact the team. Detailed information, including the business plan, is shared privately with eligible parties after an initial conversation and, where appropriate, a confidentiality agreement.',
        actions: [
          ['Contact investor relations', INVESTOR_ENQUIRY_HREF],
          ['Read the FSD story', '/story'],
        ],
      },
    ],
    notice: INVESTMENT_NOTICE,
  },
});

const FLAGSHIPS = {
  manchester: {
    eyebrow: 'FSD / The House / Flagships',
    title: 'Manchester',
    place: 'Manchester, United Kingdom',
    role: 'UK reference flagship',
    summary: 'The reference flagship concept: the model every FSD academy is designed from.',
    architecture: 'Contemporary British commercial architecture with restrained Art Deco sophistication and selective sculptural forms. Charcoal and matte black, finished with antique-gold FSD branding.',
    palette: ['Charcoal', 'Matte black', 'Antique gold'],
    body: 'Manchester is the home-market reference for the FSD flagship academy: the full format, combining performance and strength training, boxing and MMA, self-defence, modest training options for women, recovery, retail and community programmes under one roof.',
  },
  dublin: {
    eyebrow: 'FSD / The House / Flagships',
    title: 'Dublin',
    place: 'Dublin, Republic of Ireland',
    role: 'Republic of Ireland flagship concept',
    summary: 'Georgian proportion meets contemporary Docklands architecture.',
    architecture: 'Contemporary Docklands architecture with refined Georgian proportions: dark limestone and black stone, dark steel-framed glazing, tall vertical windows and a fanlight-inspired arched entrance, warmed by oiled walnut or oak, deep-green upholstery and brushed-copper fixtures.',
    palette: ['Dark limestone', 'Deep Irish green', 'Brushed copper'],
    body: 'The Dublin concept pairs the FSD academy format with the Republic of Ireland edition of the Irish heritage range — a collection designed specifically for the country it represents, expressed through tonal woven and textured detailing rather than symbols.',
  },
  belfast: {
    eyebrow: 'FSD / The House / Flagships',
    title: 'Belfast',
    place: 'Belfast, Northern Ireland',
    role: 'Northern Ireland flagship concept',
    summary: 'An industrial-heritage identity, built for training.',
    architecture: 'An industrial-heritage identity: pale cream sandstone, black steel-framed windows, exposed structural steel, dark stone and concrete floors, oiled oak joinery, deep-green upholstery and brushed-copper fixtures.',
    palette: ['Cream sandstone', 'Black steel', 'Deep green'],
    body: 'The Belfast concept pairs the FSD academy format with the Northern Ireland edition of the Irish heritage range — related to, but distinct from, the Republic of Ireland edition, and designed with the same culturally considered restraint.',
  },
  islamabad: {
    eyebrow: 'FSD / The House / Flagships',
    title: 'Islamabad',
    place: 'Islamabad, Pakistan',
    role: 'Long-term market concept',
    summary: 'Part of FSD’s long-term international vision.',
    architecture: 'Each FSD branch is given its own architectural identity, shaped by its city while keeping the FSD master identity consistent. The Islamabad identity will be developed with local architects and partners.',
    palette: ['Local identity', 'FSD master brand', 'Antique gold'],
    body: 'Pakistan is part of FSD’s long-term vision. An Islamabad flagship would bring the FSD academy format — including dedicated modest training options for women — to a market with a strong and growing sport and fitness culture.',
  },
  'future-global-locations': {
    eyebrow: 'FSD / The House / Flagships',
    title: 'Future Global Locations',
    place: 'Pakistan · Thailand · Malaysia · and beyond',
    role: 'Long-term international vision',
    summary: 'A replicable flagship framework for any market where sport and fitness culture is strong.',
    architecture: 'Architecture, colour emphasis, size and local offer may vary by location while the FSD master identity stays consistent.',
    palette: ['Local architecture', 'Consistent FSD identity', 'Shared standards'],
    body: 'Pakistan, Thailand and Malaysia form part of FSD’s long-term vision, alongside any other market where demand supports it. Each would follow the same replicable academy framework, adapted to its city and its community.',
  },
};

const FLAGSHIP_STEPS = [
  ['01', 'Local demand', 'Demand assessment and research with the local training community.'],
  ['02', 'The right partner', 'Partner research and, where appropriate, a controlled partner or franchise model.'],
  ['03', 'The right building', 'Site, planning, access, fire strategy, cost and feasibility, with qualified architects and engineers.'],
  ['04', 'Local standards', 'Cultural consideration and legal review in every market before a branch is confirmed.'],
];

export function flagshipPublicContent(id) {
  const flagship = FLAGSHIPS[id];
  if (!flagship) return null;
  const isMarketPage = id === 'islamabad' || id === 'future-global-locations';
  return {
    eyebrow: flagship.eyebrow,
    title: flagship.title,
    summary: flagship.summary,
    description: `FSD ${flagship.title}: ${flagship.summary} ${flagship.role}.`,
    sections: [
      {
        kind: 'location',
        number: `Flagship / ${flagship.title}`,
        place: flagship.place,
        role: flagship.role,
        body: flagship.body,
        architecture: flagship.architecture,
        palette: flagship.palette,
      },
      {
        kind: 'zones',
        number: 'The academy format',
        heading: 'One framework, adapted to every city.',
        intro: 'Each FSD flagship is planned around the same connected training zones, with clear separation between active training, spectators, retail and hospitality.',
        items: ACADEMY_ZONES,
      },
      {
        kind: 'chapters',
        label: isMarketPage ? 'How a new market is opened' : 'How a flagship comes to life',
        items: FLAGSHIP_STEPS,
      },
      {
        kind: 'cta',
        heading: isMarketPage ? 'Bring FSD to your city.' : `Partner with FSD ${flagship.title}.`,
        body: 'Operators, property partners, gyms and academies interested in hosting or operating an FSD flagship can register their interest. Franchising or partner operation is a possible future route and will follow proven demand, product quality and operating procedures; no fees, territories or returns are offered on this page.',
        actions: [
          ['Register partner interest', FLAGSHIP_ENQUIRY_HREF],
          ['Investor Relations', '/investor.html'],
        ],
      },
    ],
    notice: STATUS_NOTICE,
  };
}

export function housePublicContent(id) {
  return HOUSE_PUBLIC_CONTENT[id] || flagshipPublicContent(id);
}

export const FLAGSHIP_LINKS = Object.freeze([
  ['Manchester', '/flagships/manchester.html'],
  ['Dublin', '/flagships/dublin.html'],
  ['Belfast', '/flagships/belfast.html'],
  ['Islamabad', '/flagships/islamabad.html'],
  ['Future Global Locations', '/flagships/future-global-locations.html'],
]);
