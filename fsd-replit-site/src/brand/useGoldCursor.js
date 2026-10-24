import { useEffect } from 'react';
import { ENABLE_GOLD_CURSOR, GOLD, OBSIDIAN } from './tokens.js';

const dumbbell = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <g fill="${GOLD}" stroke="${OBSIDIAN}" stroke-width="1">
    <rect x="2" y="12" width="3" height="8" rx="1"/>
    <rect x="5" y="8" width="5" height="16" rx="1"/>
    <rect x="10" y="14.5" width="12" height="3"/>
    <rect x="22" y="8" width="5" height="16" rx="1"/>
    <rect x="27" y="12" width="3" height="8" rx="1"/>
  </g>
</svg>`;

export function useGoldCursor() {
  useEffect(() => {
    if (!ENABLE_GOLD_CURSOR || document.getElementById('fsd-cursor')) return undefined;
    const url = `url("data:image/svg+xml,${encodeURIComponent(dumbbell.trim())}") 16 16, pointer`;
    const style = document.createElement('style');
    style.id = 'fsd-cursor';
    // Mouse/trackpad only. Text fields keep the normal text cursor.
    style.textContent = `
      @media (pointer: fine) {
        a[href], button:not(:disabled), [role="button"], [role="tab"],
        summary, label[for], select { cursor: ${url}; }
      }`;
    document.head.appendChild(style);

  }, []);
}
