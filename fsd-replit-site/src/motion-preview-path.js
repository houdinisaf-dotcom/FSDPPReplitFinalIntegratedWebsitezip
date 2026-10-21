export const motionPreviewPath = '/__catalogue-preview/fsd-motion/';
export const motionMediaPrefix = `${motionPreviewPath}media/`;
export const motionProductsPrefix = `${motionPreviewPath}products/`;

export const motionProductPath = slug => `${motionProductsPrefix}${encodeURIComponent(slug)}/`;
