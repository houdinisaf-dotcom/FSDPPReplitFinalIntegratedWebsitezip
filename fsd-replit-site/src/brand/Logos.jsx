import { useState } from 'react';
import approvedFsdHeaderLogo from '../../brand-review/shield-refined-matte/assets/website-shield-lockup-defence.png';
import { brandTokens } from './tokens.js';
import { OFFICIAL_LOGO_FILES } from './logo-assets.js';
import { SafeImage } from '../components/SafeImage.jsx';

export { OFFICIAL_LOGO_FILES };

export function LogoMark({ mark, className = '', color = 'currentColor', title }) {
  const file = OFFICIAL_LOGO_FILES[mark];
  const [failedFile, setFailedFile] = useState(null);

  if (!file || failedFile === file) return null;
  return (
    <img
      src={file}
      alt={title ?? ''}
      aria-hidden={title ? undefined : true}
      className={className}
      onError={() => setFailedFile(file)}
    />
  );
}

const logoPlacements = new Set(['header', 'footer']);

export function logoSlotMarkup(placement) {
  if (!logoPlacements.has(placement)) {
    throw new TypeError(`Unsupported FSD logo placement: ${placement}`);
  }
  return `<span data-fsd-logo-slot="${placement}"></span>`;
}

export function FsdLogo({
  alt = brandTokens.logoAlt,
  className = 'fsd-brand-logo',
  loading = 'lazy',
  decoding = 'async',
  ...imageProps
}) {
  return (
    <SafeImage
      {...imageProps}
      src={approvedFsdHeaderLogo}
      alt={alt}
      className={className}
      fallbackLabel="FSD"
      loading={loading}
      decoding={decoding}
    />
  );
}
