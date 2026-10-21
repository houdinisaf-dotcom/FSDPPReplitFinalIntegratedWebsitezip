import { animateWithTokens, cancelMotion } from '../motion.js';

// Dashboard views are replaced frequently. Own these observers locally rather
// than retaining observations of detached cards in the storefront reveal set.
export function revealDemoElements(root) {
  const elements = [...root.querySelectorAll('.bl-metric, .bl-chart-card, .bl-device-record, .bl-insight, .bl-progress-ring')];
  let observer;
  const reveal = element => animateWithTokens(element, [
    { opacity: 0.84, transform: 'translateY(6px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ], 'bio-lab');
  try {
    if (typeof IntersectionObserver !== 'function') elements.forEach(reveal);
    else {
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          reveal(entry.target);
        }
      }, { threshold: 0.08 });
      elements.forEach(element => observer.observe(element));
    }
  } catch {
    observer?.disconnect();
    elements.forEach(reveal);
  }
  return () => {
    observer?.disconnect();
    cancelMotion('bio-lab');
  };
}
