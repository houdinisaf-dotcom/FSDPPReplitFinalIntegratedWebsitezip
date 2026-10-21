import previewRecord from '../content/hooded-running-shell-preview.json' with { type: 'json' };
import masterProducts from './master-products.json' with { type: 'json' };

export const hoodedShellPreviewRecord = previewRecord;
export const hoodedShellCampaign = previewRecord.campaign;

const previewPrefix = '/__catalogue-preview/hooded-running-shell';

export function createHoodedShellCampaignPreview(record = previewRecord, products = masterProducts) {
  const source = products.find(product =>
    product.id === record.sourceProductId
    && product['Product name'] === record.sourceProductName);

  if (!source
    || record.key !== 'hooded-running-shell-campaign-preview'
    || record.previewProductId !== null
    || record.editorialStatus !== 'Private campaign proof'
    || record.purchaseEnabled !== false
    || record.colourSelection !== 'deferred'
    || record.confirmedPrice !== null
    || record.confirmedSpecifications !== null
    || record.placement?.division !== 'apparel'
    || record.placement?.groupId !== 'mens-luxury-performance'
    || !/^[a-f0-9]{64}$/.test(record.campaign?.sha256)
    || !record.campaign?.file.startsWith('attached_assets/')
    || record.campaign.file.includes('..')) {
    throw new Error('The hooded shell must remain a private, non-purchasable campaign proof with colour selection deferred.');
  }

  return {
    ...record,
    campaignHero: {
      ...record.campaign,
      src: `${previewPrefix}/media/${record.campaign.id}`,
    },
  };
}
