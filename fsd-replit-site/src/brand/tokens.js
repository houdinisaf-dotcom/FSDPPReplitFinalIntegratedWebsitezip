export const GOLD = '#D4AF37';
export const CAMPAIGN_VOLT = '#DFFF45';
export const CAMPAIGN_VOLT_LIGHT = '#EAFF8C';
export const OBSIDIAN = '#0a0a0a';

// Base is the fabric colour; glow is the lighter accent used on dark surfaces.
export const COLOURWAYS = {
  core: { label: 'Core', name: 'Onyx Black', base: '#0A0A0A', glow: '#D4AF37' },
  earth: { label: 'Earth', name: 'Deep Olive', base: '#4B5A3A', glow: '#7C8F5E' },
  modest: { label: 'Modest', name: 'Taupe', base: '#A08670', glow: '#C2A68C' },
  tech: { label: 'Tech', name: 'Slate Grey', base: '#6F767D', glow: '#9AA3AB' },
  performance: { label: 'Performance', name: 'Midnight Navy', base: '#1C2541', glow: '#5B74B0' },
  combat: { label: 'Combat', name: 'Deep Burgundy', base: '#5E1A22', glow: '#A8434F' },
};

// Active marks only. Concept 3 (Circle Emblem) is deliberately excluded.
export const MARK_NAMES = {
  serene: 'Serene Monogram',
  ascent: 'Ascent Triangle',
  aligned: 'Aligned Wordmark',
  signature: 'Signature Mark',
};

export const WOMENS_PRIMARY_MARK = 'serene';

// Serene Monogram remains the primary womenswear emblem.
// Companion is the secondary line mark that changes by collection line.
export const WOMENS_LINES = [
  { id: 'all', name: "All Women's", colourway: 'core', companion: null, tagline: 'Strength in every form.' },
  { id: 'aeroforge', name: 'Aeroforge', colourway: 'performance', companion: 'ascent', tagline: 'Technical training layers for high-output sessions.' },
  { id: 'combat', name: 'Combat', colourway: 'combat', companion: 'signature', tagline: 'Built for the mats, pads and sparring.' },
  { id: 'flex', name: 'Flex', colourway: 'tech', companion: 'aligned', tagline: 'Range of movement, from warm-up to cool-down.' },
  { id: 'breeze', name: 'Breeze', colourway: 'earth', companion: null, tagline: 'Lightweight pieces for warmer sessions.' },
  { id: 'modest-flow', name: 'Modest Flow', colourway: 'modest', companion: null, tagline: 'Full-coverage performance, designed to move.' },
];

export const ENABLE_GOLD_CURSOR = true;

export const brandTokens = Object.freeze({
  colors: Object.freeze({
    gold: GOLD,
    champagne: GOLD,
    campaignVolt: CAMPAIGN_VOLT,
    campaignVoltLight: CAMPAIGN_VOLT_LIGHT,
    warmGold: '#C8AA72',
    ink: OBSIDIAN,
    porcelain: '#F1EEE6',
  }),
  logoAlt: 'FSD Fitness & Self-Defence',
});

export const goldCursorDataUri = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23D4AF37'%3E%3Cpath d='M6 7h2v10H6V7zm10 0h2v10h-2V7zM2 9h3v6H2V9zm17 0h3v6h-3V9zM9 11h6v2H9v-2z'/%3E%3C/svg%3E";

export const goldCursorValue = `url("${goldCursorDataUri}") 12 12, auto`;
