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
  await setViewport(1440, 960);
  await send('Page.navigate', { url: `${base}/#catalogue-grid` });
  await wait(
    `document.querySelectorAll('#catalogue-grid > .product-card--visual').length >= 8`,
    'SHOP catalogue cards render',
  );
  const catalogueDesktop = await evaluate(`(() => {
    const grid = document.querySelector('#catalogue-grid');
    const cards = [...grid.querySelectorAll(':scope > .product-card--visual:not(.product-card--visual-open)')].slice(0, 4);
    const pendingCard = [...grid.querySelectorAll(':scope > .product-card--visual')]
      .find(card => card.querySelector('[data-product="1"]'));
    const pendingMedia = pendingCard?.querySelector('.catalogue-card__media');
    const pendingPlaceholder = pendingMedia?.querySelector('.catalogue-card__image-empty');
    const boxes = cards.map(card => ({
      card: card.getBoundingClientRect(),
      media: card.querySelector('.catalogue-card__media').getBoundingClientRect(),
      copy: card.querySelector('.catalogue-card__copy').getBoundingClientRect(),
      swatches: card.querySelector('.catalogue-card__swatches').getBoundingClientRect(),
    }));
    return {
      count: grid.querySelectorAll(':scope > .product-card--visual').length,
      columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
      cardHeights: boxes.map(item => item.card.height),
      imageRatios: boxes.map(item => item.media.width / item.media.height),
      copyHeights: boxes.map(item => item.copy.height),
      swatchHeights: boxes.map(item => item.swatches.height),
      pendingCard: {
        mediaClass: pendingMedia?.className,
        mediaBackground: pendingMedia && getComputedStyle(pendingMedia).backgroundColor,
        background: pendingPlaceholder && getComputedStyle(pendingPlaceholder).backgroundColor,
        text: pendingPlaceholder?.innerText,
        productName: pendingPlaceholder?.querySelector('.fsd-product-view-placeholder__product')?.textContent,
        accessibleLabel: pendingPlaceholder?.getAttribute('aria-label'),
      },
    };
  })()`);
  assert.ok(catalogueDesktop.count >= 8, 'SHOP shows a useful set of catalogue cards');
  assert.equal(catalogueDesktop.columns, 4, 'desktop SHOP grid uses four aligned columns');
  assert.ok(Math.max(...catalogueDesktop.cardHeights) - Math.min(...catalogueDesktop.cardHeights) <= 1, 'first-row cards have equal heights');
  assert.ok(catalogueDesktop.imageRatios.every(ratio => Math.abs(ratio - .8) < .01), 'product cards share the 4:5 media ratio');
  assert.ok(catalogueDesktop.copyHeights.every(height => Math.abs(height - catalogueDesktop.copyHeights[0]) <= 1), 'card copy regions align');
  assert.ok(catalogueDesktop.swatchHeights.every(height => height >= 48), 'cards reserve a consistent swatch row');
  assert.match(catalogueDesktop.pendingCard.mediaClass, /catalogue-card__media--pending/);
  assert.equal(catalogueDesktop.pendingCard.mediaBackground, 'rgb(242, 240, 235)', 'unmapped card media uses a light-neutral canvas');
  assert.equal(catalogueDesktop.pendingCard.background, 'rgb(242, 240, 235)');
  assert.match(catalogueDesktop.pendingCard.text, /PRODUCT IMAGE/);
  assert.match(catalogueDesktop.pendingCard.text, /PRODUCT VIEW/);
  assert.ok(catalogueDesktop.pendingCard.productName?.trim(), 'pending card displays its product name');
  assert.match(catalogueDesktop.pendingCard.text, /\[ASSET PENDING\]/);
  assert.match(catalogueDesktop.pendingCard.accessibleLabel, /\[ASSET PENDING\]/);

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
  assert.ok(desktop.mainHeight >= 0.55 * (960 - desktop.mastheadBottom), 'desktop product images remain substantial beside the information rail');
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

  await setViewport(393, 844);
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

  await setViewport(1440, 960);
  const photoOpener = await evaluate(`(() => {
    const dialog = document.querySelector('#product-dialog');
    const opener = dialog.querySelector('[data-gallery-photo-open]');
    opener.focus();
    opener.click();
    return opener;
  })()`);
  await wait(
    `document.querySelector('#product-dialog')?.matches(':modal') &&
      document.querySelector('#fsd-product-viewer')?.hidden === false &&
      document.activeElement.matches('[data-viewer-close]')`,
    'photo viewer opens as the sole modal layer',
  );
  const viewerOpen = await evaluate(`(() => {
    const dialog = document.querySelector('#product-dialog');
    const viewer = document.querySelector('#fsd-product-viewer');
    const closeButtons = [...dialog.querySelectorAll('#close-dialog, [data-viewer-close]')]
      .filter(button => !button.hidden && getComputedStyle(button).display !== 'none');
    return {
      tag: viewer.tagName,
      role: viewer.getAttribute('role'),
      nativeDialogs: document.querySelectorAll('dialog[open]').length,
      closeCount: closeButtons.length,
      productCloseHidden: dialog.querySelector('#close-dialog').hidden,
      bodyDisplay: getComputedStyle(dialog.querySelector('#dialog-body')).display,
      bodyInert: dialog.querySelector('#dialog-body').inert,
      fullViewport: viewer.getBoundingClientRect().width === innerWidth &&
        viewer.getBoundingClientRect().height === innerHeight,
      photoLoaded: viewer.querySelector('[data-viewer-photo]').naturalWidth > 0,
      labelledBy: dialog.getAttribute('aria-labelledby'),
    };
  })()`);
  assert.equal(viewerOpen.tag, 'SECTION', 'photo viewer is a region inside the product dialog, not a nested dialog');
  assert.equal(viewerOpen.role, 'region');
  assert.equal(viewerOpen.nativeDialogs, 1, 'only the existing product dialog is open');
  assert.equal(viewerOpen.closeCount, 1, 'the photo viewer has one visible close control');
  assert.equal(viewerOpen.productCloseHidden, true, 'the product close button is hidden during inspection');
  assert.equal(viewerOpen.bodyDisplay, 'none', 'the product sheet does not compete with the image viewer');
  assert.equal(viewerOpen.bodyInert, true, 'the product sheet is inert while its image viewer is active');
  assert.equal(viewerOpen.fullViewport, true, 'photo viewer fills the viewport');
  assert.equal(viewerOpen.photoLoaded, true, 'the enlarged approved photo loads');
  assert.equal(viewerOpen.labelledBy, 'fsd-photo-viewer-title', 'the modal has a visible accessible name');
  const zoomControlDisabled = await evaluate(`document.querySelector('#fsd-product-viewer [data-viewer-zoom]').disabled`);
  assert.equal(zoomControlDisabled, false, 'mapped gallery photo supports enlargement');
  await evaluate(`document.querySelector('#fsd-product-viewer [data-viewer-zoom]').click()`);
  await wait(`document.querySelector('#fsd-product-viewer [data-viewer-stage]').dataset.zoomed === 'true'`,
    'photo zoom enlarges the image');
  await evaluate(`document.querySelector('#fsd-product-viewer [data-viewer-zoom]').click()`);
  await wait(`document.querySelector('#fsd-product-viewer [data-viewer-stage]').dataset.zoomed === 'false'`,
    'photo zoom resets to natural fit');
  const viewerImage = await evaluate(`document.querySelector('#fsd-product-viewer [data-viewer-photo]').src`);
  await key('ArrowRight');
  await wait(
    `document.querySelector('#fsd-product-viewer [data-viewer-photo]').src !== ${JSON.stringify(viewerImage)}`,
    'photo viewer arrow keys change the image',
  );
  await key('Escape');
  await wait(
    `document.querySelector('#fsd-product-viewer').hidden &&
      document.querySelector('#product-dialog')?.open &&
      !document.querySelector('#product-dialog').matches(':modal')`,
    'Escape closes only the photo viewer',
  );
  const viewerEscape = await evaluate(`(() => {
    const dialog = document.querySelector('#product-dialog');
    const opener = dialog.querySelector('[data-gallery-photo-open]');
    return {
      focusReturned: document.activeElement === opener,
      expanded: opener.getAttribute('aria-expanded'),
      productCloseVisible: !dialog.querySelector('#close-dialog').hidden,
      bodyInert: dialog.querySelector('#dialog-body').inert,
      labelledBy: dialog.getAttribute('aria-labelledby'),
    };
  })()`);
  assert.equal(viewerEscape.focusReturned, true, 'Escape returns focus to the image opener');
  assert.equal(viewerEscape.expanded, 'false');
  assert.equal(viewerEscape.productCloseVisible, true);
  assert.equal(viewerEscape.bodyInert, false);
  assert.equal(viewerEscape.labelledBy, 'product-title');

  await evaluate(`document.querySelector('#product-dialog [data-gallery-fullscreen]').click()`);
  await wait(`!document.querySelector('#fsd-product-viewer').hidden`, 'full-screen inspect button opens the viewer');
  await evaluate(`document.querySelector('#fsd-product-viewer [data-viewer-close]').click()`);
  await wait(`document.querySelector('#fsd-product-viewer').hidden`, 'viewer close button closes the viewer');
  assert.equal(
    await evaluate(`document.activeElement.matches('[data-gallery-fullscreen]')`),
    true,
    'close button returns focus to the full-screen opener',
  );

  await evaluate(`(async () => {
    const { showProduct } = await import('/src/catalogue.js');
    showProduct(18, { quickView: true });
  })()`);
  await wait(`document.querySelector('#product-dialog')?.open &&
    document.querySelector('#product-dialog').dataset.presentation === 'quick-view' &&
    document.querySelector('#product-dialog').matches(':modal')`, 'Quick View remains a modal');
  await key('Escape');
  await wait(`!document.querySelector('#product-dialog')?.open`, 'Quick View closes with Escape');

  await setViewport(1440, 960);
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
      visibleMappedImageCount: [...dialog.querySelectorAll('.product-detail-media img')]
        .filter(image => !image.hidden && image.currentSrc).length,
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
  assert.equal(ombre.visibleMappedImageCount, 0, 'missing approved photos do not render a mapped garment image');
  assert.equal(ombre.frontTop, ombre.backTop);
  assert.ok(ombre.mediaRatio > 1.8, 'placeholder pair uses the same desktop two-thirds layout');
  assert.ok(ombre.frontHeight >= 0.55 * (960 - desktop.mastheadBottom), 'missing photos retain substantial desktop placeholder panels');
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
    visibleMappedImageCount: [...document.querySelectorAll('#product-dialog .product-detail-media img')]
      .filter(image => !image.hidden && image.currentSrc).length,
  }))()`);
  assert.equal(cheetah.title, 'FSD Cheetah Windrunner');
  assert.equal(cheetah.slots, 2);
  assert.equal(cheetah.visibleMappedImageCount, 0);

  await setViewport(393, 844);
  await openProduct(1);
  const ombreMobile = await evaluate(`(() => {
    const dialog = document.querySelector('#product-dialog');
    const back = [...dialog.querySelectorAll('[data-catalogue-gallery-view]')].find(button =>
      /back|rear/i.test([button.dataset.catalogueViewLabel, button.getAttribute('aria-label')].filter(Boolean).join(' ')));
    const secondary = dialog.querySelector('.product-detail-gallery__secondary');
    return {
      main: dialog.querySelector('.product-detail-image-stage').innerText,
      backLabel: back?.dataset.catalogueViewLabel || back?.getAttribute('aria-label'),
      back,
      secondaryDisplay: getComputedStyle(secondary).display,
      thumbnailCount: dialog.querySelectorAll('[data-catalogue-gallery-view]').length,
      visibleMappedImageCount: [...dialog.querySelectorAll('.product-detail-media img')]
        .filter(image => !image.hidden && image.currentSrc).length,
      notifyDisabled: dialog.querySelector('.product-detail-notify__button')?.disabled,
      addButtons: dialog.querySelectorAll('[data-bag-add]').length,
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  })()`);
  assert.match(ombreMobile.main, /FRONT VIEW/);
  assert.match(ombreMobile.main, /IMAGE PENDING/);
  assert.equal(ombreMobile.secondaryDisplay, 'none', 'mobile does not duplicate the back placeholder panel');
  assert.equal(ombreMobile.thumbnailCount, 3, 'mobile retains selectable front, back and detail placeholders');
  assert.equal(ombreMobile.visibleMappedImageCount, 0);
  assert.equal(ombreMobile.notifyDisabled, true);
  assert.equal(ombreMobile.addButtons, 0, 'checkout stays disabled');
  assert.equal(ombreMobile.overflow, false, 'mobile pending-media detail has no horizontal overflow');
  await evaluate(`(() => {
    const buttons = [...document.querySelectorAll('#product-dialog [data-catalogue-gallery-view]')];
    const back = buttons.find(button =>
      /back|rear/i.test([button.dataset.catalogueViewLabel, button.getAttribute('aria-label')].filter(Boolean).join(' ')));
    if (!back) throw new Error('Back-view pending thumbnail was not found');
    back.click();
  })()`);
  await wait(`document.querySelector('#product-dialog .product-detail-image-stage')?.innerText.includes('BACK VIEW')`,
    'mobile placeholder thumbnail immediately selects the back-view treatment');

  console.log('Product gallery reference checks passed: desktop SHOP grid, mapped and pending product media, exact desktop/mobile widths, immediate selection/swipe, viewer modality/focus/Escape/close, and disabled checkout.');
} finally {
  await close();
}
