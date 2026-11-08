import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { browserSession } from './browser-session.mjs';

const browser = await browserSession();
const { send, evaluate, wait, key } = browser;
const domain = process.env.REPLIT_DEV_DOMAIN;
assert.ok(domain, 'REPLIT_DEV_DOMAIN must identify the running FSD preview.');
const experiences = [
  { id: 'heroes', href: '/shop', action: 'EXPLORE THE COLLECTIONS' },
  { id: 'stronger', href: '/hardware', action: 'EXPLORE HARDWARE' },
  { id: 'disciplined', href: '/bio-lab', action: 'EXPLORE BIO-LAB™' },
  { id: 'together', href: '/the-house.html', action: 'DISCOVER COMMUNITY & CULTURE' },
];
const captureDir = resolve(process.cwd(), '../generated-artifacts/fsd-site-evidence');

async function capture(name) {
  if (process.env.FSD_HERO_CAPTURE !== '1') return;
  await mkdir(captureDir, { recursive: true });
  const screenshot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88, fromSurface: true });
  await writeFile(resolve(captureDir, name), Buffer.from(screenshot.data, 'base64'));
  console.log(`Saved running-site screenshot: ${resolve(captureDir, name)}`);
}

try {
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await send('Page.navigate', { url: `https://${domain}/?hero-switch-check=1` });
  await wait(`document.querySelector('[data-runtime-ready="true"]') && document.querySelectorAll('.fsd-home-switcher button').length === 4`, 'homepage and hero switcher ready');
  await wait(`document.querySelector('.fsd-home-hero__asset')?.complete && document.querySelector('.fsd-home-hero__asset')?.naturalWidth > 0`, 'approved homepage campaign image decoded');

  assert.equal(await evaluate(`document.querySelector('#fsd-home-title').textContent.trim().replace(/\\s+/g, ' ')`), 'MADE TO MOVE,MADE TO BELONG.');
  assert.equal(await evaluate(`document.querySelector('.fsd-home-intro').textContent.trim().replace(/\\s+/g, ' ')`), 'Fitness & Self-Defence.A house for those who train with purpose.');
  assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('.fsd-home-campaign-scene')).map(scene => scene.dataset.campaignScene)`), experiences.map(item => item.id));
  await capture('fsd-home-hero-01-be-heroes-desktop.jpg');

  for (const [index, experience] of experiences.entries()) {
    const selector = `.fsd-home-switcher [data-hero-theme="${experience.id}"]`;
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    await wait(`(() => {
      const target = document.querySelector(${JSON.stringify(`#home-campaign-${experience.id}`)});
      const top = target.getBoundingClientRect().top;
      return top > 0 && top < innerHeight * .4;
    })()`, `${experience.id} campaign scene reached`);
    await wait(`document.querySelector('.fsd-home-hero')?.dataset.heroTheme === ${JSON.stringify(experience.id)}`, `${experience.id} scene navigation state`);
    assert.equal(await evaluate(`document.querySelectorAll('.fsd-home-switcher button[aria-pressed="true"]').length`), 1);
    const sceneSelector = `#home-campaign-${experience.id}`;
    const action = await evaluate(`(() => {
      const link = document.querySelector(${JSON.stringify(`${sceneSelector} .fsd-home-campaign-scene__action`)});
      return { href: link?.getAttribute('href'), text: link?.textContent.trim().replace(/\\s+/g, ' ') };
    })()`);
    assert.equal(action.href, experience.href);
    assert.equal(action.text, `${experience.action}↗`);
    if (index > 0) await capture(`fsd-home-hero-0${index + 1}-${experience.id}-desktop.jpg`);
  }

  await evaluate(`document.querySelector('.fsd-home-switcher [data-hero-theme="heroes"]').focus()`);
  await key('ArrowRight');
  await wait(`document.querySelector('.fsd-home-hero')?.dataset.heroTheme === 'stronger'`, 'hero switcher arrow-key navigation');
  assert.equal(await evaluate(`document.activeElement?.dataset.heroTheme`), 'stronger');

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: `https://${domain}/?hero-switch-mobile-check=1` });
  await wait(`document.querySelector('[data-runtime-ready="true"]') && document.querySelectorAll('.fsd-home-switcher button').length === 4`, 'mobile homepage ready');
  const mobileLayout = await evaluate(`(() => {
    const hero = document.querySelector('.fsd-home-hero');
    const controls = document.querySelector('.fsd-home-switcher').getBoundingClientRect();
    const cta = document.querySelector('[data-hero-primary-action]').getBoundingClientRect();
    return {
      width: document.documentElement.scrollWidth,
      viewport: innerWidth,
      controlsVisible: controls.width > 0 && controls.height > 0,
      controlsInside: controls.left >= 0 && controls.right <= innerWidth,
      ctaInside: cta.left >= 0 && cta.right <= innerWidth,
      overlap: cta.bottom > controls.top && cta.top < controls.bottom,
      heroTheme: hero.dataset.heroTheme,
      minControlHeight: Math.min(...[...document.querySelectorAll('.fsd-home-switcher button')].map(button => button.getBoundingClientRect().height)),
    };
  })()`);
  assert.ok(mobileLayout.width <= mobileLayout.viewport + 1, `Mobile homepage has no horizontal overflow: ${JSON.stringify(mobileLayout)}`);
  assert.ok(mobileLayout.controlsVisible && mobileLayout.controlsInside && mobileLayout.ctaInside, `Mobile theme controls and CTA remain visible: ${JSON.stringify(mobileLayout)}`);
  assert.equal(mobileLayout.overlap, false, `Mobile CTA and switcher do not overlap: ${JSON.stringify(mobileLayout)}`);
  assert.ok(mobileLayout.minControlHeight >= 44, 'Mobile hero switcher controls meet the touch-target minimum.');
  assert.equal(await evaluate(`document.querySelector('#fsd-home-title').textContent.trim().replace(/\\s+/g, ' ')`), 'MADE TO MOVE,MADE TO BELONG.');
  await capture('fsd-home-hero-mobile-390.jpg');

  assert.deepEqual(browser.errors, [], 'homepage hero interactions do not throw browser exceptions');
  console.log('Homepage hero browser checks passed: four themes, approved headline and image, CTA destinations, arrow-key selection, mobile touch targets and overflow.');
} finally {
  await browser.close();
}
