import { prefersReducedMotion } from './motion.js';

/** Fades each `.reveal` element in the first time it scrolls into view. */
export function initReveal() {
  const items = [...document.querySelectorAll('.reveal')];
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        entry.target.classList.add('is-visible');
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  items.forEach((el) => observer.observe(el));
}
