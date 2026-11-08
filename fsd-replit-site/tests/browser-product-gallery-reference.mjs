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
    const masthead = dialog.querySelector('.product-detail-media__masthead').getBoundingClientRect();
    const main = dialog.querySelector('.product-detail-image-stage').getBoundingClientRect();
    const secondary = dialog.querySelector('.product-detail-gallery__secondary-stage').getBoundingClientRect();
    const media = dialog.querySelector('.product-detail-media').getBoundingClientRect();
    const purchase = dialog.querySelector('.product-detail-purchase').getBoundingClientRect();
    const gallery = dialog.querySelector('.product-detail-gallery__feature-grid').getBoundingClientRect();
    const title = dialog.querySelector('#product-title').getBoundingClientRect();
    const mainImage = dialog.querySelector('[data-catalogue-main-image]');
    const secondaryImage = dialog.querySelector('[data-catalogue-secondary-image]');
    return {
      modal: dialog.matches(':modal'),
      headerBottom: shell.getBoundingClientRect().bottom,
      mastheadBottom: masthead.bottom,
      titleTop: title.top,
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
  assert.ok(desktop.mainTop >= desktop.mastheadBottom, 'gallery begins below its media masthead');
  assert.ok(desktop.mainTop - desktop.mastheadBottom <= 4, 'gallery begins immediately below its media masthead');
  assert.ok(desktop.titleTop - desktop.headerBottom < 190, 'product title sits close to the top of the purchase panel');
  assert.ok(desktop.mainHeight >= 0.55 * (1000 - desktop.mastheadBottom), 'desktop product images remain substantial beside the information rail');
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
    const gallery = dialog.querySelector('.product-detail-gallery').getBoundingClientRect();
    const thumbnailRail = dialog.querySelector('[data-catalogue-thumbnail-rail]').getBoundingClientRect();
    const sticky = dialog.querySelector('[data-sticky-add-bar]').getBoundingClientRect();
    return {
      mainWidth: main.width,
      mainHeight: main.height,
      mainBottom: main.bottom,
      secondaryHeight: secondary.height,
      secondaryTop: secondary.top,
      secondaryBottom: secondary.bottom,
      secondaryDisplay: getComputedStyle(dialog.querySelector('.product-detail-gallery__secondary')).display,
      galleryBottom: gallery.bottom,
      thumbnailRailBottom: thumbnailRail.bottom,
      stickyTop: sticky.top,
      stickyHidden: dialog.querySelector('[data-sticky-add-bar]').hidden,
      purchaseTop: purchase.top,
      viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      thumbnailCount: dialog.querySelectorAll('[data-catalogue-gallery-view]').length,
    };
  })()`);
  assert.ok(mobile.mainHeight >= 0.9 * mobile.mainWidth, 'mobile front image remains a large square gallery frame');
  assert.equal(mobile.secondaryDisplay, 'none', 'mobile shows one main image, not a duplicate secondary panel');
  assert.equal(mobile.secondaryHeight, 0, 'the hidden secondary panel occupies no mobile layout space');
  assert.ok(mobile.purchaseTop >= mobile.galleryBottom - 1, 'mobile purchase details follow the gallery and thumbnail rail');
  assert.ok(mobile.stickyHidden || mobile.thumbnailRailBottom <= mobile.stickyTop, 'mobile sticky action does not cover gallery thumbnails');
  assert.ok(mobile.thumbnailCount >= 3, 'front, back and other mapped views remain selectable below the main image');
  assert.equal(mobile.documentWidth, mobile.viewportWidth, 'mobile product page has no horizontal overflow');

  const mobileBackSelection = await evaluate(`(() => {
    const buttons = [...document.querySelectorAll('#product-dialog [data-catalogue-gallery-view]')];
    const back = buttons.find(button => /back|rear/i.test(
      [button.getAttribute('aria-label'), button.dataset.catalogueViewLabel].filter(Boolean).join(' '),
    ));
    if (!back) return null;
    back.click();
    return {
      label: back.getAttribute('aria-label'),
      pressed: back.getAttribute('aria-pressed'),
      selected: back.classList.contains('is-selected'),
      thumbnailSource: back.querySelector('img')?.src,
      mainSource: document.querySelector('#product-dialog [data-catalogue-main-image]')?.src,
      secondaryDisplay: getComputedStyle(document.querySelector('#product-dialog .product-detail-gallery__secondary')).display,
    };
  })()`);
  assert.ok(mobileBackSelection, 'a mapped back or rear thumbnail is present on mobile');
  await wait(
    `document.querySelector('#product-dialog [data-catalogue-main-image]')?.src === ${JSON.stringify(mobileBackSelection.thumbnailSource)}`,
    'mobile gallery selection is applied to the main image',
  );
  assert.equal(mobileBackSelection.mainSource, mobileBackSelection.thumbnailSource, 'thumbnail selection immediately changes the main image source');
  assert.equal(mobileBackSelection.pressed, 'true', 'the selected back view has an accessible pressed state');
  assert.equal(mobileBackSelection.selected, true, 'the selected back view has a visible selected state');
  assert.equal(mobileBackSelection.secondaryDisplay, 'none', 'selecting a back view does not restore the duplicate panel');

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

  await evaluate(`(() => {
    localStorage.removeItem('fsd-product-wishlist-v1');
    document.querySelector('#product-dialog [data-product-wishlist]')?.click();
  })()`);
  await wait(`document.querySelector('#product-dialog [data-product-wishlist]')?.getAttribute('aria-pressed') === 'true' &&
    JSON.parse(localStorage.getItem('fsd-product-wishlist-v1') || '[]').includes(2)`, 'wishlist saved');
  assert.equal(
    await evaluate(`document.querySelector('#product-dialog [data-wishlist-label]')?.textContent`),
    'Saved to wishlist',
  );
  await evaluate(`document.querySelector('#product-dialog [data-product-wishlist]')?.click()`);
  await wait(`document.querySelector('#product-dialog [data-product-wishlist]')?.getAttribute('aria-pressed') === 'false' &&
    !JSON.parse(localStorage.getItem('fsd-product-wishlist-v1') || '[]').includes(2)`, 'wishlist removed');

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
  assert.ok(ombre.frontHeight >= 0.55 * (1000 - desktop.mastheadBottom), 'missing photos retain substantial desktop placeholder panels');
  assert.equal(ombre.frontHeight, ombre.backHeight, 'front and back placeholders have matching proportions');
  assert.equal(ombre.placeholderBackground, 'rgb(239, 237, 230)', 'PDP placeholders keep the warm-neutral editorial gallery surface');
  assert.equal(ombre.notifyButtonDisabled, true, 'notification remains disabled without a provider');
  assert.equal(ombre.notifyButtonBackground, 'rgb(17, 19, 24)', 'notification action follows the black CTA design');
  assert.match(ombre.placeholderText, /FRONT VIEW/);
  assert.match(ombre.placeholderText, /BACK VIEW/);
  assert.match(ombre.placeholderText, /IMAGE PENDING/);

  await openProduct(10);
  const cheetah = await evaluate(`(() => ({
    title: document.querySelector('#product-dialog #product-title')?.textContent,
    slots: document.querySelectorAll('#product-dialog .product-detail-image-stage, #product-dialog .product-detail-gallery__secondary-stage').length,
    imageCount: document.querySelector('#product-dialog .product-detail-media')?.querySelectorAll('img').length,
  }))()`);
  assert.equal(cheetah.title, 'FSD Cheetah Windrunner');
  assert.equal(cheetah.slots, 2);
  assert.equal(cheetah.imageCount, 0);

  console.log('Product gallery reference checks passed at desktop and mobile widths; front/back mapping, placeholders, header interaction, wishlist persistence, and Quick View were verified.');
} finally {
  await close();
}
