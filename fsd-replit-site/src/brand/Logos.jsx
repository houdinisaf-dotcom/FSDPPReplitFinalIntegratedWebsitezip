import { useState } from 'react';
import approvedFsdHeaderLogo from '../../brand-review/shield-refined-matte/assets/website-shield-lockup-defence.png';
import { brandTokens } from './tokens.js';
import { SafeImage } from '../components/SafeImage.jsx';

// Replace each null with an approved public/brand SVG path when available.
// The supplied inline SVGs remain fallbacks if a file is absent or fails.
export const OFFICIAL_LOGO_FILES = {
  serene: null,
  ascent: null,
  aligned: null,
  signature: null,
};

function svgA11y(title) {
  return title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true };
}

function SereneMonogram({ className, color, title }) {
  const blade = 'M14 80 C26 52 50 28 90 18 C64 34 46 52 32 76 Z';
  return (
    <svg viewBox="0 0 100 100" className={className} fill={color} {...svgA11y(title)}>
      <path d={blade} />
      <path d={blade} transform="translate(10 -6) scale(.9)" opacity=".85" />
      <path d={blade} transform="translate(20 -10) scale(.78)" opacity=".7" />
    </svg>
  );
}

function AscentTriangle({ className, color, title }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill={color} {...svgA11y(title)}>
      <path d="M50 14 L94 84 L78 84 L50 38 L22 84 L6 84 Z" />
      <path d="M34 84 L50 58 L62 76 C54 73 45 76 40 84 Z" />
    </svg>
  );
}

function AlignedWordmark({ className, color, title }) {
  return (
    <svg
      viewBox="0 0 240 80"
      className={className}
      fill="none"
      stroke={color}
      strokeWidth="5"
      strokeLinecap="square"
      {...svgA11y(title)}
    >
      <path d="M12 20 H70 M12 20 V60 M12 40 H56" />
      <path d="M152 20 H102 A10 10 0 0 0 102 40 H142 A10 10 0 0 1 142 60 H90" />
      <path d="M172 20 H206 A20 20 0 0 1 206 60 H172" />
    </svg>
  );
}

function SignatureMark({ className, color, title }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill={color} {...svgA11y(title)}>
      <path d="M30 14 H94 L82 32 H20 Z" />
      <path d="M24 42 H72 L61 58 H14 Z" />
      <path d="M14 58 H34 L20 88 H2 Z" />
    </svg>
  );
}

const marks = {
  serene: SereneMonogram,
  ascent: AscentTriangle,
  aligned: AlignedWordmark,
  signature: SignatureMark,
};

export function LogoMark({ mark, className = '', color = 'currentColor', title }) {
  const file = OFFICIAL_LOGO_FILES[mark];
  const [failedFile, setFailedFile] = useState(null);

  if (file && failedFile !== file) {
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

  const Mark = marks[mark];
  return Mark ? <Mark className={className} color={color} title={title} /> : null;
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
