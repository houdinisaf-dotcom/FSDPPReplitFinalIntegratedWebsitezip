/** Private review adapter. Imported by the dev-only entry, never the storefront. */
export function createWeightedRopeDraft(record, manifest) {
  if (record.key !== 'weighted-skipping-rope' || manifest.productKey !== record.key
    || record.id !== null || record.editorialStatus !== 'Draft' || record.purchaseEnabled !== false
    || record.publishAuthorisation !== null || record.contentApproval !== null) {
    throw new Error('Rope review must remain an unassigned, unpublished draft.');
  }
  const images = manifest.images;
  if (record.variants.length !== 8 || images.length !== 32) throw new Error('Expected eight approved colour editions with four views each.');
  const variants = record.variants.map(variant => {
    const gallery = images.filter(image => image.variantId === variant.id && image.approved && image.approval);
    if (gallery.length !== 4) throw new Error(`Four approved panel crops required for ${variant.colour}.`);
    return { ...variant, availability:'unconfirmed', images:gallery, imageState:'available' };
  });
  if (!manifest.campaignHero?.approved || images.some(image => image.id === manifest.campaignHero.id)) throw new Error('The campaign hero must remain independent of variant galleries.');
  const product = {
    // Internal UI key only, never a catalogue ID or SKU. Source ID stays null.
    id:`draft:${record.key}`, sourceId:null, name:record.name,
    category:record.category || 'Placement awaiting approval',
    collection:record.collection || 'Collection awaiting approval',
    alsoShowIn:[], audience:record.audience || '', confirmedPrice:record.confirmedPrice,
    suggestedPrice:record.suggestedPrice, colourways:variants.map(variant => variant.colour).join('; '),
    specifications:record.specifications || '', specificationStatus:'', coverage:'', notes:'',
    alias:'', aliasStatus:'', source:'User-approved supplied images; product draft only',
    imageStatus:'Eight approved colour boards separated into four lossless views each',
    images,
    catalogue:{
      schemaVersion:1, editorialStatus:'Draft', currency:record.currency,
      description:record.description, price:{confirmed:record.confirmedPrice,suggested:record.suggestedPrice},
      sizes:record.sizes, variants, placement:record.placement, sourceBoards:manifest.sourceBoards,
      imageRoles:{
        hero:[manifest.campaignHero], lifestyle:[manifest.campaignHero],
        variant:images, detail:images.filter(image => image.role === 'detail'),
        front:[],back:[],side:[],lineup:manifest.sourceBoards,
      },
      seo:{title:'FSD Weighted Skipping Rope — draft review',description:'Unpublished product review.',slug:'fsd-weighted-skipping-rope'},
      legacyListed:false, contentApproval:null, publishAuthorisation:null,purchaseEnabled:false,
    },
  };
  return { product, campaignHero:manifest.campaignHero };
}

export async function loadWeightedRopeDraft() {
  if (!import.meta.env?.DEV) throw new Error('Draft review is available in the development workspace only.');
  const response = await fetch('/__catalogue-preview/data/weighted-skipping-rope.json', {cache:'no-store'});
  if (!response.ok) throw new Error(await response.text() || 'Could not load the draft review.');
  return response.json();
}
