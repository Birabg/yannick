import { prefersReducedMotion } from './motion.js';

/**
 * Wipes each `.reveal` element in the first time it scrolls into view. Anything at or above the
 * bottom of the screen is revealed, so jumping down the page (anchor links, fast scrolling,
 * restoring a scroll position) never leaves a blank gap. This checks scroll position directly
 * rather than relying on IntersectionObserver callbacks, which can be skipped on a long jump.
 */
export function initReveal() {
  let pending = [...document.querySelectorAll('.reveal')];
  if (prefersReducedMotion()) {
    pending.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  let queued = false;
  const sweep = () => {
    queued = false;
    const line = window.innerHeight * 0.92;
    pending = pending.filter((el) => {
      if (el.getBoundingClientRect().top >= line) return true;
      el.classList.add('is-visible');
      return false;
    });
    if (!pending.length) {
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
    }
  };
  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sweep);
  };

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  window.addEventListener('hashchange', request);
  window.addEventListener('load', request);
  sweep();
}
