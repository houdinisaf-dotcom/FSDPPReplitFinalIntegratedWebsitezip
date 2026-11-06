import assert from 'node:assert/strict';
import { browserSession, pause } from './browser-session.mjs';

const browser = await browserSession();
const { send, evaluate, wait, key, close } = browser;
const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;

async function setViewport(width, height) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    mobile: width <= 600,
    deviceScaleFactor: 1,
  });
}

async function openProduct(id) {
  await send('Page.navigate', { url: `${base}/?product=${id}` });
  await wait(
    `document.querySelector('#product-dialog')?.open &&
      document.querySelector('#product-dialog [data-product-title], #product-dialog #product-title')?.textContent`,
    `product ${id} detail page`,
  );
}

try {
  await setViewport(1440, 1000);
  await openProduct(18);
  await wait(
    `document.querySelector('#product-dialog [data-catalogue-main-image]')?.naturalWidth > 0 &&
      document.querySelector('#product-dialog [data-catalogue-secondary-image]')?.naturalWidth > 0`,
    'approved front and back photographs decode',
  );

  const desktop = await evaluate(`(() => {
    const dialog = document.querySelector('#product-dialog');
    const shell = document.querySelector('.fsd-navigation-shell');
    const main = dialog.querySelector('.product-detail-image-stage').getBoundingClientRect();
    const secondary = dialog.querySelector('.product-detail-gallery__secondary-stage').getBoundingClientRect();
    const media = dialog.querySelector('.product-detail-media').getBoundingClientRect();
    const purchase = dialog.querySelector('.product-detail-purchase').getBoundingClientRect();
    const gallery = dialog.querySelector('.product-detail-gallery__feature-grid').getBoundingClientRect();
    const mainImage = dialog.querySelector('[data-catalogue-main-image]');
    const secondaryImage = dialog.querySelector('[data-catalogue-secondary-image]');
    return {
      modal: dialog.matches(':modal'),
      headerBottom: shell.getBoundingClientRect().bottom,
      mainTop: main.top,
      mainHeight: main.height,
      secondaryTop: secondary.top,
      secondaryHeight: secondary.height,
      mainLeft: main.left,
      secondaryLeft: secondary.left,
      galleryHeight: gallery.height,
      mediaWidth: media.width,
      purchaseWidth: purchase.width,
      mainSource: new URL(mainImage.src).pathname,
      secondarySource: new URL(secondaryImage.src).pathname,
      imageWidths: [mainImage.naturalWidth, secondaryImage.naturalWidth],
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    };
  })()`);

  assert.equal(desktop.modal, false, 'a product detail route is non-modal beneath the shared header');
  assert.ok(desktop.mainTop >= desktop.headerBottom, 'gallery begins below the shared header');
  assert.ok(desktop.mainTop - desktop.headerBottom <= 4, 'gallery begins immediately below the header');
  assert.ok(desktop.mainHeight >= 0.85 * (1000 - desktop.headerBottom), 'desktop product images fill nearly the full visible page height');
  assert.equal(desktop.mainHeight, desktop.secondaryHeight, 'desktop front and back stages share a full-height row');
  assert.ok(desktop.galleryHeight >= desktop.mainHeight, 'gallery stage fills the available desktop height');
  assert.equal(desktop.secondaryTop, desktop.mainTop, 'front and back images share the same row');
  assert.ok(desktop.secondaryLeft > desktop.mainLeft, 'back image is the second gallery column');
  assert.ok(desktop.mediaWidth / desktop.purchaseWidth > 1.8, 'gallery occupies roughly two thirds of desktop width');
  assert.match(desktop.mainSource, /aeroforge-white-green-front-product\.webp$/);
  assert.match(desktop.secondarySource, /aeroforge-white-green-rear-product\.webp$/);
  assert.ok(desktop.imageWidths.every(width => width > 0), 'both approved images load');
  assert.equal(desktop.horizontalOverflow, false);

  const menuButton = await evaluate(`(() => {
    const element = document.querySelector('.fsd-primary-trigger');
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  const clickMenuButton = async () => {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: menuButton.x, y: menuButton.y });
    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed', x: menuButton.x, y: menuButton.y, button: 'left', clickCount: 1,
    });
    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased', x: menuButton.x, y: menuButton.y, button: 'left', clickCount: 1,
    });
  };
  await clickMenuButton();
  await wait(`document.querySelector('.fsd-navigation-shell')?.classList.contains('is-open')`, 'header navigation remains usable');
  await clickMenuButton();
  await wait(`!document.querySelector('.fsd-navigation-shell')?.classList.contains('is-open')`, 'header menu closes from its trigger');
  assert.equal(await evaluate(`document.querySelector('#product-dialog')?.open`), true);

  await setViewport(402, 874);
  const mobile = await evaluate(`(() => {
    const dialog = document.querySelector('#product-dialog');
    const main = dialog.querySelector('.product-detail-image-stage').getBoundingClientRect();
    const secondary = dialog.querySelector('.product-detail-gallery__secondary-stage').getBoundingClientRect();
    const purchase = dialog.querySelector('.product-detail-purchase').getBoundingClientRect();
    return {
      mainWidth: main.width,
      mainHeight: main.height,
      mainBottom: main.bottom,
      secondaryHeight: secondary.height,
      secondaryTop: secondary.top,
      secondaryBottom: secondary.bottom,
      purchaseTop: purchase.top,
      viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      secondaryVisible: getComputedStyle(dialog.querySelector('.product-detail-gallery__secondary')).display !== 'none',
    };
  })()`);
  assert.ok(mobile.secondaryTop >= mobile.mainBottom - 1, 'mobile stacks the two product photographs');
  assert.ok(mobile.secondaryTop - mobile.mainBottom <= 4, 'mobile image pair keeps a near-zero gap');
  assert.ok(mobile.mainHeight >= mobile.mainWidth, 'mobile front image remains large and portrait-proportioned');
  assert.equal(mobile.mainHeight, mobile.secondaryHeight, 'mobile front and back image slots use matching proportions');
  assert.ok(mobile.purchaseTop >= mobile.secondaryBottom - 1, 'mobile purchase details follow both photographs');
  assert.equal(mobile.secondaryVisible, true);
  assert.equal(mobile.documentWidth, mobile.viewportWidth, 'mobile product page has no horizontal overflow');

  await evaluate(`(async () => {
    const { showProduct } = await import('/src/catalogue.js');
    showProduct(18, { quickView: true });
  })()`);
  await wait(`document.querySelector('#product-dialog')?.open &&
    document.querySelector('#product-dialog').dataset.presentation === 'quick-view' &&
    document.querySelector('#product-dialog').matches(':modal')`, 'Quick View remains a modal');
  await key('Escape');
  await wait(`!document.querySelector('#product-dialog')?.open`, 'Quick View closes with Escape');

  await setViewport(1440, 1000);
  await openProduct(2);
  const second = await evaluate(`(() => ({
    title: document.querySelector('#product-dialog #product-title')?.textContent,
    main: new URL(document.querySelector('[data-catalogue-main-image]').src).pathname,
    secondary: new URL(document.querySelector('[data-catalogue-secondary-image]').src).pathname,
    panelCount: document.querySelectorAll('#product-dialog .product-detail-image-stage, #product-dialog .product-detail-gallery__secondary-stage').length,
  }))()`);
  assert.equal(second.title, 'FSD Contrast-Panel Training Tee');
  assert.match(second.main, /contrast-panel-training-tee\/luminous-aqua-deep-teal-navy-white\/front\.webp$/);
  assert.match(second.secondary, /contrast-panel-training-tee\/luminous-aqua-deep-teal-navy-white\/back\.webp$/);
  assert.equal(second.panelCount, 2);

  await openProduct(1);
  const ombre = await evaluate(`(() => {
    const dialog = document.querySelector('#product-dialog');
    const media = dialog.querySelector('.product-detail-media').getBoundingClientRect();
    const purchase = dialog.querySelector('.product-detail-purchase').getBoundingClientRect();
    const front = dialog.querySelector('.product-detail-image-stage').getBoundingClientRect();
    const back = dialog.querySelector('.product-detail-gallery__secondary-stage').getBoundingClientRect();
    return {
      title: dialog.querySelector('#product-title')?.textContent,
      slots: dialog.querySelectorAll('.product-detail-image-stage, .product-detail-gallery__secondary-stage').length,
      imageCount: dialog.querySelector('.product-detail-media').querySelectorAll('img').length,
      frontTop: front.top,
      backTop: back.top,
      frontHeight: front.height,
      backHeight: back.height,
      placeholderBackground: getComputedStyle(dialog.querySelector('[data-catalogue-variant-placeholder]')).backgroundColor,
      notifyButtonDisabled: dialog.querySelector('.product-detail-notify__button')?.disabled,
      notifyButtonBackground: getComputedStyle(dialog.querySelector('.product-detail-notify__button')).backgroundColor,
      mediaRatio: media.width / purchase.width,
      placeholderText: dialog.querySelector('.product-detail-media')?.textContent,
    };
  })()`);
  assert.equal(ombre.title, 'FSD Ombré Slash Tee');
  assert.equal(ombre.slots, 2);
  assert.equal(ombre.imageCount, 0, 'missing approved photos do not create broken or concept-board images');
  assert.equal(ombre.frontTop, ombre.backTop);
  assert.ok(ombre.mediaRatio > 1.8, 'placeholder pair uses the same desktop two-thirds layout');
  assert.ok(ombre.frontHeight >= 0.85 * (1000 - desktop.headerBottom), 'missing photos retain full-height desktop placeholders');
  assert.equal(ombre.frontHeight, ombre.backHeight, 'front and back placeholders have matching proportions');
  assert.equal(ombre.placeholderBackground, 'rgb(242, 240, 235)', 'PDP placeholders keep the white editorial gallery surface');
  assert.equal(ombre.notifyButtonDisabled, true, 'notification remains disabled without a provider');
  assert.equal(ombre.notifyButtonBackground, 'rgb(17, 19, 24)', 'notification action follows the black CTA design');
  assert.match(ombre.placeholderText, /Front view/);
  assert.match(ombre.placeholderText, /Back view/);
  assert.match(ombre.placeholderText, /\[ASSET PENDING\]/);

  await openProduct(10);
  const cheetah = await evaluate(`(() => ({
    title: document.querySelector('#product-dialog #product-title')?.textContent,
    slots: document.querySelectorAll('#product-dialog .product-detail-image-stage, #product-dialog .product-detail-gallery__secondary-stage').length,
    imageCount: document.querySelector('#product-dialog .product-detail-media')?.querySelectorAll('img').length,
  }))()`);
  assert.equal(cheetah.title, 'FSD Cheetah Windrunner');
  assert.equal(cheetah.slots, 2);
  assert.equal(cheetah.imageCount, 0);

  console.log('Product gallery reference checks passed at desktop and mobile widths; front/back mapping, placeholders, header interaction, and Quick View were verified.');
} finally {
  await close();
}
