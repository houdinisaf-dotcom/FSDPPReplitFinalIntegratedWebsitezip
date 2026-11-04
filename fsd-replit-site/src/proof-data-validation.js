export function validateProofData(raw) {
  const data = structuredClone(raw);
  const local = value => {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f]/.test(value)) {
      throw new Error('Invalid local proof asset URL');
    }
    if (new URL(value, 'https://local.invalid').origin !== 'https://local.invalid') throw new Error('Invalid proof origin');
    return value;
  };
  const integer = value => {
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < 0) throw new Error('Invalid proof image count or dimensions');
    return number;
  };
  for (const key of Object.keys(data.links || {})) data.links[key] = local(data.links[key]);
  if ('excludedOrUnassignedCount' in data) data.excludedOrUnassignedCount = integer(data.excludedOrUnassignedCount);
  for (const image of [...(data.references || []), ...(data.product?.variants || []).flatMap(variant => variant.images || [])]) {
    image.src = local(image.src);
    image.index = integer(image.index);
    for (const key of ['width', 'height']) if (key in image) image[key] = integer(image[key]);
  }
  return data;
}
