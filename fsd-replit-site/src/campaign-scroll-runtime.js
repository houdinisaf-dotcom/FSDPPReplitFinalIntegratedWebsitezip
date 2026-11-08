let scrollRuntimePromise;

export function loadCampaignScrollRuntime() {
  scrollRuntimePromise ??= Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
  ]).then(([gsapModule, triggerModule]) => {
    const gsap = gsapModule.gsap || gsapModule.default;
    const ScrollTrigger = triggerModule.ScrollTrigger || triggerModule.default;
    gsap.registerPlugin(ScrollTrigger);
    return { gsap, ScrollTrigger };
  });
  return scrollRuntimePromise;
}

/**
 * Let the GSAP ticker be the single animation-frame driver for Lenis and
 * ScrollTrigger. Lenis remains lazy-loaded by smooth-scroll.js as before.
 */
export function driveLenisWithGsap(lenis) {
  let disposed = false;
  let cleanup = () => {};
  let fallbackFrame = 0;
  let runtime = null;

  const onScroll = () => runtime?.ScrollTrigger.update();
  const fallbackTick = time => {
    if (disposed) return;
    lenis.raf(time);
    fallbackFrame = requestAnimationFrame(fallbackTick);
  };

  void loadCampaignScrollRuntime().then(loaded => {
    if (disposed) return;
    runtime = loaded;
    const tick = time => lenis.raf(time * 1000);
    loaded.gsap.ticker.add(tick);
    lenis.on('scroll', onScroll);
    cleanup = () => {
      loaded.gsap.ticker.remove(tick);
      lenis.off('scroll', onScroll);
    };
  }).catch(error => {
    globalThis.console?.error?.('GSAP scroll coordination unavailable; using one native animation-frame loop.', error);
    if (!disposed) fallbackFrame = requestAnimationFrame(fallbackTick);
  });

  return () => {
    disposed = true;
    cleanup();
    if (fallbackFrame) cancelAnimationFrame(fallbackFrame);
  };
}
