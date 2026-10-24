const COMPOSITE_NAME_HINT = /\b(?:collage|grid|multi|contact[\s_-]*sheet|campaign[\s_-]*board|colourways)\b/i;
const COPY_NAME_HINT = /\b(?:copy|dup(?:licate)?)\b/i;
const SHA256_PATTERN = /^[a-f\d]{64}$/i;

function positiveDimension(value) {
  const number = Number(value);
  return value !== null && value !== undefined && value !== '' && Number.isFinite(number) && number > 0
    ? number
    : null;
}

function readUInt24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

export function readImageDimensions(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);

  if (
    buffer.length >= 24
    && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    let offset = 12;
    while (offset + 8 <= buffer.length) {
      const type = buffer.toString('ascii', offset, offset + 4);
      const size = buffer.readUInt32LE(offset + 4);
      const payload = offset + 8;
      if (payload + size > buffer.length) return null;

      if (type === 'VP8X' && size >= 10) {
        return {
          width: readUInt24LE(buffer, payload + 4) + 1,
          height: readUInt24LE(buffer, payload + 7) + 1,
        };
      }
      if (type === 'VP8L' && size >= 5 && buffer[payload] === 0x2f) {
        const b1 = buffer[payload + 1];
        const b2 = buffer[payload + 2];
        const b3 = buffer[payload + 3];
        const b4 = buffer[payload + 4];
        return {
          width: 1 + ((b2 & 0x3f) << 8) + b1,
          height: 1 + ((b4 & 0x0f) << 10) + (b3 << 2) + (b2 >> 6),
        };
      }
      if (
        type === 'VP8 '
        && size >= 10
        && buffer[payload + 3] === 0x9d
        && buffer[payload + 4] === 0x01
        && buffer[payload + 5] === 0x2a
      ) {
        return {
          width: buffer.readUInt16LE(payload + 6) & 0x3fff,
          height: buffer.readUInt16LE(payload + 8) & 0x3fff,
        };
      }
      offset = payload + size + (size % 2);
    }
  }

  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    const startOfFrameMarkers = new Set([
      0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
    ]);
    let offset = 2;
    while (offset + 3 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      while (buffer[offset] === 0xff) offset += 1;
      const marker = buffer[offset];
      offset += 1;
      if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > buffer.length) return null;
      const segmentLength = buffer.readUInt16BE(offset);
      if (segmentLength < 2 || offset + segmentLength > buffer.length) return null;
      if (startOfFrameMarkers.has(marker) && segmentLength >= 7) {
        return {
          height: buffer.readUInt16BE(offset + 3),
          width: buffer.readUInt16BE(offset + 5),
        };
      }
      offset += segmentLength;
    }
  }

  return null;
}

export function reviewProductImages(rawAssetList) {
  if (!Array.isArray(rawAssetList)) {
    throw new TypeError('Asset review expects an array of asset records.');
  }

  const records = rawAssetList.map((input, index) => {
    const source = input && typeof input === 'object' ? input : {};
    const filename = typeof source.filename === 'string' ? source.filename : '';
    const name = typeof source.name === 'string' ? source.name : '';
    const searchableName = `${filename} ${name}`;
    const tags = Array.isArray(source.tags) ? source.tags.map(String) : [];
    const width = positiveDimension(source.width);
    const height = positiveDimension(source.height);
    const digest = typeof source.sha256 === 'string' && SHA256_PATTERN.test(source.sha256)
      ? source.sha256.toLowerCase()
      : null;
    const reviewFlags = [];
    const heroHints = [];

    if (!input || typeof input !== 'object') reviewFlags.push('invalid-asset-record');
    if (COMPOSITE_NAME_HINT.test(searchableName)) reviewFlags.push('possible-composite-name');
    if (filename && COPY_NAME_HINT.test(filename)) reviewFlags.push('possible-copy-name');
    if (width === null || height === null) reviewFlags.push('dimensions-unavailable');
    else if (width < 1000 || height < 1000) reviewFlags.push('below-1000px-review-threshold');

    if (tags.some(tag => /^hero$/i.test(tag.trim()))) heroHints.push('explicit-hero-tag');
    if (/\bfront\b/i.test(searchableName)) heroHints.push('front-name-hint');
    if (/\bbokeh\b/i.test(searchableName)) heroHints.push('bokeh-name-hint');

    return {
      ...source,
      filename,
      name,
      width,
      height,
      sha256: digest,
      tags,
      reviewFlags,
      heroHints,
      exactDuplicateGroup: null,
      sourceIndex: index,
    };
  });

  const hashes = new Map();
  for (const asset of records) {
    if (!asset.sha256) continue;
    const group = hashes.get(asset.sha256) || [];
    group.push(asset);
    hashes.set(asset.sha256, group);
  }

  const duplicateGroups = [];
  for (const [sha256, group] of hashes) {
    if (group.length < 2) continue;
    const filenames = group.map(asset => asset.filename || `asset-${asset.sourceIndex + 1}`);
    duplicateGroups.push({ sha256, count: group.length, filenames });
    for (const asset of group) {
      asset.exactDuplicateGroup = sha256;
      asset.reviewFlags.push('exact-byte-duplicate-group');
    }
  }

  const heroCandidates = records
    .filter(asset => asset.heroHints.length > 0)
    .map(({ sourceIndex, ...asset }) => asset);

  return {
    reviewOnly: true,
    selectedHero: null,
    assets: records.map(({ sourceIndex, ...asset }) => asset),
    duplicateGroups,
    heroCandidates,
  };
}
