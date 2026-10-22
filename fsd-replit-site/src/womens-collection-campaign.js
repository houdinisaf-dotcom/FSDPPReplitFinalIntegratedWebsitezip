import masterProducts from './master-products.json' with { type: 'json' };
import imageManifest from '../content/fsd-womens-collection-private/image-manifest.json' with { type: 'json' };

export const womensCollectionPreviewPath = '/__catalogue-preview/fsd-womens-collection/';
export const womensCollectionMediaPrefix = `${womensCollectionPreviewPath}media/`;

const mediaById = new Map(imageManifest.assets.map(asset => [asset.id, asset]));
const masterById = new Map(masterProducts.map(product => [product.id, product]));

const ids = (...numbers) => numbers.map(number => `womens-${String(number).padStart(2, '0')}`);

const productDefinitions = [
  {
    slug: 'flex',
    brand: 'FSD FLEX',
    title: 'High-Waisted Sculpt Leggings',
    category: 'WOMEN’S PERFORMANCE',
    masterProductId: 40,
    description: 'Private image review for the FSD FLEX leggings. Product claims and all details beyond the supplied product name are pending verification.',
    identityNote: 'The source photos show a coordinated top and leggings. The supplied brief names the leggings; the co-worn top has not been mapped to a product. Garment marks remain unverified against the approved website logo.',
    benefitsNote: 'No benefits are confirmed. Claims inside the supplied feature board are excluded from this page.',
    variants: [
      {
        id: 'black-gold',
        label: 'Black / Gold',
        swatch: '#191a1b',
        sourceLabel: 'Existing catalogue colour reference',
        approval: 'master-reference',
        note: 'This is the existing master-record colour only; it does not confirm the source photos or approve a sale.',
        imageIds: ids(42, 43, 44, 45, 46, 47, 48, 49, 50),
      },
      {
        id: 'brown-reference',
        label: 'Brown-tone image reference',
        swatch: '#756052',
        sourceLabel: 'Unconfirmed visual reference',
        approval: 'unconfirmed',
        note: 'Two supplied photos show a brown-toned coordinated look. Colourway and product association are not confirmed.',
        imageIds: ids(52, 53),
      },
    ],
    specifications: [
      ['Materials', 'Pending verification'],
      ['Fit and measurements', 'Pending verification'],
      ['Care instructions', 'Pending verification'],
      ['SKU and inventory', 'Pending verification'],
    ],
  },
  {
    slug: 'zip-neck',
    brand: 'FSD',
    title: 'Premium Zip-Neck Performance Top',
    category: 'WOMEN’S PERFORMANCE',
    masterProductId: null,
    description: 'Private image review for the distinct FSD Premium Zip-Neck Performance Top named in the supplied brief. The product line, garment marks and specifications remain unverified.',
    identityNote: 'Kept separate from the existing AEROFORGE record. The photos include other outfit pieces, which have not been mapped to this top. No master catalogue record has been changed or assigned.',
    benefitsNote: 'No benefits are confirmed. No performance or fabric claims are presented.',
    variants: [
      {
        id: 'black-reference',
        label: 'Black appearance',
        swatch: '#171819',
        sourceLabel: 'Visual colour reference',
        approval: 'unconfirmed',
        note: 'Colour appearance only; not an approved variant name or availability.',
        imageIds: ids(13, 15, 16, 18, 23),
      },
      {
        id: 'burgundy-reference',
        label: 'Burgundy appearance',
        swatch: '#632532',
        sourceLabel: 'Visual colour reference',
        approval: 'unconfirmed',
        note: 'Colour appearance only; not an approved variant name or availability.',
        imageIds: ids(14, 22),
      },
      {
        id: 'olive-reference',
        label: 'Olive appearance',
        swatch: '#454b3c',
        sourceLabel: 'Visual colour reference',
        approval: 'unconfirmed',
        note: 'Colour appearance only; not an approved variant name or availability.',
        imageIds: ids(17, 24),
      },
      {
        id: 'taupe-reference',
        label: 'Taupe appearance',
        swatch: '#958376',
        sourceLabel: 'Visual colour reference',
        approval: 'unconfirmed',
        note: 'Colour appearance only; not an approved variant name or availability.',
        imageIds: ids(19),
      },
      {
        id: 'slate-reference',
        label: 'Slate-grey appearance',
        swatch: '#666b70',
        sourceLabel: 'Visual colour reference',
        approval: 'unconfirmed',
        note: 'Colour appearance only; not an approved variant name or availability.',
        imageIds: ids(20),
      },
      {
        id: 'navy-reference',
        label: 'Navy appearance',
        swatch: '#202b40',
        sourceLabel: 'Visual colour reference',
        approval: 'unconfirmed',
        note: 'Colour appearance only; not an approved variant name or availability.',
        imageIds: ids(21),
      },
    ],
    specifications: [
      ['Materials', 'Pending verification'],
      ['Fit and measurements', 'Pending verification'],
      ['Care instructions', 'Pending verification'],
      ['SKU and inventory', 'Pending product identification'],
    ],
  },
  {
    slug: 'breeze',
    brand: 'FSD BREEZE',
    title: 'Lightweight Modest Overshirt',
    category: 'MODEST ACTIVEWEAR',
    masterProductId: 49,
    description: 'Private image review for the existing FSD BREEZE overshirt record. The gallery uses individual photographs only; product claims and details remain pending verification.',
    identityNote: 'The supplied images include garment marks and composite boards that do not match the approved website lockup clearly. Other outfit pieces are not mapped to this overshirt. Images are unaltered; branding remains pending review.',
    benefitsNote: 'No benefits are confirmed. Claims embedded in source boards are excluded from product copy.',
    variants: [
      {
        id: 'onyx-black',
        label: 'Onyx Black — artwork label',
        swatch: '#171717',
        sourceLabel: 'Artwork label; availability not confirmed',
        approval: 'unconfirmed',
        note: 'Five individual black-look photos are supplied. The colour name comes from source artwork and is not an approved variant.',
        imageIds: ids(36, 37, 38, 39, 40),
      },
      {
        id: 'deep-olive',
        label: 'Deep Olive — artwork label',
        swatch: '#414336',
        sourceLabel: 'Artwork label; image pending',
        approval: 'unconfirmed',
        note: 'Only shown in composite boards. No standalone gallery photo supplied.',
        imageIds: [],
      },
      {
        id: 'warm-taupe',
        label: 'Warm Taupe — artwork label',
        swatch: '#988474',
        sourceLabel: 'Artwork label; image pending',
        approval: 'unconfirmed',
        note: 'Only shown in composite boards. No standalone gallery photo supplied.',
        imageIds: [],
      },
      {
        id: 'slate-grey',
        label: 'Slate Grey — artwork label',
        swatch: '#737678',
        sourceLabel: 'Artwork label; image pending',
        approval: 'unconfirmed',
        note: 'Only shown in composite boards. No standalone gallery photo supplied.',
        imageIds: [],
      },
      {
        id: 'midnight-navy',
        label: 'Midnight Navy — artwork label',
        swatch: '#263047',
        sourceLabel: 'Artwork label; image pending',
        approval: 'unconfirmed',
        note: 'Only shown in composite boards. No standalone gallery photo supplied.',
        imageIds: [],
      },
      {
        id: 'deep-burgundy',
        label: 'Deep Burgundy — artwork label',
        swatch: '#652a36',
        sourceLabel: 'Artwork label; standalone photo available',
        approval: 'unconfirmed',
        note: 'One individual burgundy-look photo is supplied. The colour name comes from source artwork and is not an approved variant.',
        imageIds: ids(29),
      },
    ],
    specifications: [
      ['Materials', 'Pending verification'],
      ['Fit and measurements', 'Pending verification'],
      ['Care instructions', 'Pending verification'],
      ['SKU and inventory', 'Pending verification'],
    ],
  },
];

const referenceNotes = {
  1: ['Additional reference', 'Modest outfit photograph; product identity and relationship to the named products are not confirmed.'],
  2: ['Additional reference', 'Modest outfit photograph; product identity and relationship to the named products are not confirmed.'],
  3: ['Additional reference', 'Modest outfit photograph; product identity and relationship to the named products are not confirmed.'],
  4: ['BREEZE-labelled board', 'Composite board with an alternate logo and unverified product claims. Excluded from product gallery and copy.'],
  5: ['Colour reference board', 'Composite colour board; product mapping and standalone colourway images are not confirmed.'],
  6: ['Colour reference board', 'Composite colour board; product mapping and standalone colourway images are not confirmed.'],
  7: ['Exact duplicate', 'Pixel-identical to an existing Modest Flow visual. Kept separate; not reclassified or added to a new product.'],
  8: ['Exact duplicate', 'Pixel-identical to an existing Modest Flow visual. Kept separate; not reclassified or added to a new product.'],
  9: ['Exact duplicate', 'Pixel-identical to an existing Modest Flow visual. Kept separate; not reclassified or added to a new product.'],
  10: ['Exact duplicate', 'Pixel-identical to an existing Modest Flow visual. Kept separate; not reclassified or added to a new product.'],
  11: ['Exact duplicate', 'Pixel-identical to an existing Modest Flow visual. Kept separate; not reclassified or added to a new product.'],
  12: ['Exact duplicate', 'Pixel-identical to an existing Modest Flow visual. Kept separate; not reclassified or added to a new product.'],
  25: ['Campaign board', 'General campaign artwork; no distinct product identity confirmed.'],
  26: ['Unassigned photograph', 'Black outfit photograph; possible relation to the zip-neck group, but product identity is not confirmed.'],
  27: ['BREEZE-labelled board', 'Composite feature and colour board; alternate logo and unverified claims. Excluded from product gallery and copy.'],
  28: ['BREEZE-labelled board', 'Composite colour and view board. Logo and claims are not verified; excluded from product gallery.'],
  30: ['BREEZE composite', 'Multi-view burgundy board. Useful as an audit reference only; not used as a gallery photo.'],
  31: ['BREEZE composite', 'Multi-view navy board. No standalone navy photograph supplied.'],
  32: ['BREEZE composite', 'Multi-view grey board. No standalone grey photograph supplied.'],
  33: ['BREEZE composite', 'Multi-view taupe board. No standalone taupe photograph supplied.'],
  34: ['BREEZE composite', 'Multi-view olive board. No standalone olive photograph supplied.'],
  35: ['BREEZE composite', 'Multi-view black board. The standalone photos are used instead.'],
  41: ['BREEZE composite', 'Colour lineup and detail board. It is not used as a product image; no standalone detail photographs are supplied.'],
  51: ['FLEX feature board', 'Contains unverified feature claims and a mark not confirmed against the approved website logo. Excluded from product copy and gallery.'],
};

function resolveImage(id, context) {
  const asset = mediaById.get(id);
  if (!asset) throw new Error(`Unknown FSD women’s image reference: ${id}`);
  return {
    id: asset.id,
    index: asset.index,
    src: `${womensCollectionMediaPrefix}${asset.id}`,
    width: asset.width,
    height: asset.height,
    alt: `Supplied image ${asset.index}: ${context}. Source branding is unchanged and not verified.`,
  };
}

function priceFor(product) {
  if (!product.masterProductId) {
    return {
      display: 'Price at launch',
      type: 'unset',
      note: 'No price has been confirmed for this distinct product.',
      approvedForSale: false,
    };
  }
  const record = masterById.get(product.masterProductId);
  if (!record || !record['Price (£) confirmed']) {
    return {
      display: 'Price at launch',
      type: 'unset',
      note: 'No confirmed price is available in the linked master record.',
      approvedForSale: false,
    };
  }
  return {
    display: `£${record['Price (£) confirmed']}`,
    type: 'master-reference',
    masterProductId: record.id,
    note: 'Existing master-catalogue value for reference only; it is not approval to sell.',
    approvedForSale: false,
  };
}

export function createWomensCollectionPreview(slug) {
  const definition = productDefinitions.find(product => product.slug === slug);
  if (!definition) return null;
  const master = definition.masterProductId ? masterById.get(definition.masterProductId) : null;
  const product = {
    slug: definition.slug,
    brand: definition.brand,
    title: definition.title,
    category: definition.category,
    description: definition.description,
    identityNote: definition.identityNote,
    benefitsNote: definition.benefitsNote,
    masterProductId: definition.masterProductId,
    price: priceFor(definition),
    catalogueColourReference: master?.Colourways || null,
    brandReviewStatus: 'Pending comparison with approved website logo',
    benefitsStatus: 'Pending verification',
    specifications: definition.specifications.map(([label, value]) => ({ label, value })),
    variants: definition.variants.map(variant => ({
      ...variant,
      images: variant.imageIds.map(id => resolveImage(id, `${definition.brand} ${variant.label} image reference`)),
      imageIds: undefined,
    })),
  };
  return {
    pageType: 'product-proof',
    status: 'private-review',
    checkoutEnabled: false,
    paymentsEnabled: false,
    publicListingEnabled: false,
    publicationAuthorized: false,
    logo: '/brand-review/shield-refined-matte/assets/website-shield-lockup-defence.png',
    product,
    links: {
      references: `${womensCollectionPreviewPath}references/`,
      flex: `${womensCollectionPreviewPath}flex/`,
      zipNeck: `${womensCollectionPreviewPath}zip-neck/`,
      breeze: `${womensCollectionPreviewPath}breeze/`,
    },
  };
}

export function createWomensCollectionAudit() {
  const references = Object.entries(referenceNotes)
    .map(([number, [kind, note]]) => {
      const index = Number(number);
      const id = `womens-${String(index).padStart(2, '0')}`;
      const asset = mediaById.get(id);
      const isComposite = [4, 5, 6, 25, 27, 28, 30, 31, 32, 33, 34, 35, 41, 51].includes(index);
      const logoStatus = [4, 27, 28, 51].includes(index)
        ? 'Alternate or inconsistent logo artwork visible; not corrected'
        : [7, 8, 9, 10, 11, 12].includes(index)
          ? 'Duplicate of existing Modest Flow visual; no new logo assessment'
          : 'Garment/logo details unverified';
      return {
        ...resolveImage(id, `${kind.toLowerCase()} from the supplied women’s collection archive`),
        kind,
        note,
        sourceName: asset.sourceName,
        composite: isComposite,
        logoStatus,
      };
    })
    .sort((a, b) => a.index - b.index);
  return {
    pageType: 'asset-audit',
    status: 'private-review',
    checkoutEnabled: false,
    paymentsEnabled: false,
    publicListingEnabled: false,
    publicationAuthorized: false,
    sourceArchive: imageManifest.sourceArchive,
    sourceArchiveSha256: imageManifest.sourceArchiveSha256,
    totalSourceImages: imageManifest.originalTiffCount,
    productImageCounts: { flex: 11, zipNeck: 12, breeze: 6 },
    excludedOrUnassignedCount: references.length,
    references,
    links: {
      flex: `${womensCollectionPreviewPath}flex/`,
      zipNeck: `${womensCollectionPreviewPath}zip-neck/`,
      breeze: `${womensCollectionPreviewPath}breeze/`,
    },
  };
}

export const womensCollectionSourceManifest = imageManifest;
