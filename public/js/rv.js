import { prefersReducedMotion } from './motion.js';

const STAGGER = 70; // ms between children (the same number is in rv.css)
const DURATION = 600;

/** The [data-rv-item] elements that belong to this block (not to a block nested inside it). */
const itemsOf = (block) =>
  [...block.querySelectorAll('[data-rv-item]')].filter(
    (item) => item.closest('[data-rv]') === block
  );

/**
 * Reveals a block as it scrolls into view, once: its [data-rv-item] children fade up in turn
 * (opacity and a 24px rise, set in rv.css). When the last one has settled the attribute is dropped,
 * so the element's own hover transitions are not held back by the reveal's.
 */
export function initReveals() {
  const blocks = [...document.querySelectorAll('[data-rv]')];
  if (!blocks.length) return;
  const reveal = (block) => {
    block.classList.add('is-in');
    const items = itemsOf(block);
    setTimeout(
      () => items.forEach((item) => item.removeAttribute('data-rv-item')),
      DURATION + items.length * STAGGER + 80
    );
  };
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    blocks.forEach((block) =>
      itemsOf(block).forEach((item) => item.removeAttribute('data-rv-item'))
    );
    return;
  }
  blocks.forEach((block) =>
    itemsOf(block).forEach((item, n) => item.style.setProperty('--rv-i', n))
  );

  const seen = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        seen.unobserve(entry.target);
        reveal(entry.target);
      }),
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );
  blocks.forEach((block) => seen.observe(block));
}
