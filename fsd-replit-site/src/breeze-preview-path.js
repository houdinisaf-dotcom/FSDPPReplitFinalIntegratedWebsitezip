export const breezeMediaPrefix = '/__catalogue-preview/fsd-breeze/media/';

export function breezeMediaUrl(assetId) {
  if (!/^breeze-[a-z0-9-]+-(front|side|back|detail)$/.test(String(assetId))) {
    throw new TypeError(`Unknown FSD Breeze image identifier: ${assetId}`);
  }
  return `${breezeMediaPrefix}${encodeURIComponent(assetId)}`;
}
