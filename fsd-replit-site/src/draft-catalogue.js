import draftRecord from '../content/weighted-skipping-rope-draft.json' with { type: 'json' };
import imageManifest from '../content/weighted-skipping-rope-images.json' with { type: 'json' };

export const weightedRopeRecord = draftRecord;
export const weightedRopeManifest = imageManifest;

const previewPrefix = '/__catalogue-preview/weighted-skipping-rope';

export function createWeightedRopeDraft(record = draftRecord, manifest = imageManifest) {
  if (record.key !== 'weighted-skipping-rope'
    || record.id !== null
    || record.editorialStatus !== 'Draft'
    || record.purchaseEnabled !== false
    || record.contentApproval !== null
    || record.publishAuthorisation !== null) {
    throw new Error('Weighted skipping rope must remain an unassigned, unpublished draft.');
  }

  if (manifest.productKey !== record.key
    || record.variants.length !== 8
    || manifest.variants.length !== 8
    || manifest.imageCount !== 9
    || manifest.campaign.id !== 'weighted-rope-campaign'
    || manifest.boardLayout.keepAsOneImage !== true
    || manifest.boardLayout.cropped !== false
    || manifest.boardLayout.split !== false) {
    throw new Error('Expected one fixed campaign image and eight intact edition boards.');
  }

  const manifestVariants = new Map(manifest.variants.map(variant => [variant.id, variant]));
  const campaign = {
    ...manifest.campaign,
    src: `${previewPrefix}/media/${manifest.campaign.id}`,
  };
  const variants = record.variants.map(variant => {
    const source = manifestVariants.get(variant.id);
    if (!source
      || source.colour !== variant.colour
      || source.swatch !== variant.swatch
      || !source.assetId
      || !source.file.startsWith('attached_assets/')
      || !/^[a-f0-9]{64}$/.test(source.sha256)) {
      throw new Error(`Missing or mismatched approved source image for ${variant.colour}.`);
    }
    return {
      ...variant,
      assetId: source.assetId,
      imageSrc: `${previewPrefix}/media/${source.assetId}`,
      imageAlt: source.alt,
    };
  });

  const assetIds = [campaign.id, ...variants.map(variant => variant.assetId)];
  if (assetIds.length !== 9
    || new Set(assetIds).size !== 9
    || record.assetIds.length !== 9
    || record.assetIds.some((id, index) => id !== assetIds[index])) {
    throw new Error('The draft must map exactly its nine supplied source images.');
  }

  return {
    product: { ...record, variants },
    campaignHero: campaign,
  };
}
