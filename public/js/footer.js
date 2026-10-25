import { prefersReducedMotion } from './motion.js';

/**
 * Footer motion, transform only: the photo drifts from scale 1 to 1.04 as the footer scrolls into view,
 * and the wordmark rises about 24px as it enters. Both are skipped for reduced motion.
 * If the photo fails to load, the gradient behind it (see footer.css) shows instead.
 */
export function initFooter() {
  const footer = document.querySelector('[data-footer]');
  if (!footer) return;

  const photo = footer.querySelector('.foot__photo');
  const img = footer.querySelector('[data-footer-img]');
  if (img) {
    const failed = () => photo.classList.add('is-failed');
    img.addEventListener('error', failed);
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) failed();
  }

  if (prefersReducedMotion()) return;

  let queued = false;
  const update = () => {
    queued = false;
    const rect = footer.getBoundingClientRect();
    const vh = window.innerHeight;
    // 0 when the footer's top reaches the bottom of the screen, 1 when its bottom reaches the bottom
    const progress = Math.min(1, Math.max(0, (vh - rect.top) / Math.max(1, rect.height)));
    footer.style.setProperty('--foot-scale', (1 + 0.04 * progress).toFixed(4));
    const word = footer.querySelector('[data-footer-word]');
    const wordTop = word.getBoundingClientRect().top;
    const rise = Math.min(1, Math.max(0, (vh - wordTop) / (vh * 0.35)));
    footer.style.setProperty('--foot-rise', rise.toFixed(3));
  };
  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
}
