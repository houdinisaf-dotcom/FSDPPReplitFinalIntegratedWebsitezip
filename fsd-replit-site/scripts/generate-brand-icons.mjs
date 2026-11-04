import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const out = new URL('../public/brand/', import.meta.url);
const shield = new URL('../brand-review/shield-refined-matte/assets/shield-refined.png', import.meta.url).pathname;
const lockup = new URL('../brand-review/shield-refined-matte/assets/website-shield-lockup-defence.png', import.meta.url).pathname;
const campaign = new URL('../public/fsd-assets/8ffe2fd45a06.webp', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
function convert(args) {
  const result = spawnSync('magick', args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || 'Image conversion failed');
}
for (const size of [16, 32, 48, 64, 180, 192, 512]) {
  convert([shield, '-resize', `${size - 4}x${size - 4}`, '-gravity', 'center', '-background', 'none',
    '-extent', `${size}x${size}`, new URL(`favicon-${size}.png`, out).pathname]);
}
convert([new URL('favicon-180.png', out).pathname, '-background', '#0a0a0a', '-alpha', 'remove',
  new URL('apple-touch-icon.png', out).pathname]);
const png = readFileSync(new URL('favicon-64.png', out)).toString('base64');
writeFileSync(new URL('../public/favicon.svg', import.meta.url),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><image width="64" height="64" href="data:image/png;base64,${png}"/></svg>\n`);
// Existing approved photography and approved website lockup; no redrawing or generative edits.
convert([campaign, '-resize', '1200x630^', '-gravity', 'center', '-extent', '1200x630',
  '(', '-size', '450x630', 'xc:#0a0a0a', ')', '-gravity', 'west', '-composite',
  '(', lockup, '-resize', '340x', ')', '-gravity', 'west', '-geometry', '+55+0', '-composite',
  '-quality', '87', new URL('fsd-social-preview.jpg', out).pathname]);
writeFileSync(new URL('../public/site.webmanifest', import.meta.url), JSON.stringify({
  name: 'FSD — Fitness & Self Defence', short_name: 'FSD', start_url: '/', display: 'browser',
  theme_color: '#0a0a0a', background_color: '#0a0a0a',
  icons: [192, 512].map(size => ({ src: `/brand/favicon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any' })),
}, null, 2) + '\n');
console.log('Generated icons from approved shield raster and 1200×630 social preview from existing campaign + approved lockup. 512px is an upscale, not vector artwork.');
