export const modestFlowMediaPrefix = '/__catalogue-preview/modest-flow/media/';

export function modestFlowMediaPath(assetId) {
  return `${modestFlowMediaPrefix}${encodeURIComponent(String(assetId))}`;
}
