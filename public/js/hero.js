import { prefersReducedMotion } from './motion.js';

const INTRO_MS = 1500; // the CSS entrance (about 1.4s) is over by then, so the idle float may begin
const RING_SLOW = 0.25; // the story badge ring turns at a quarter of its speed while hovered
const RING_EASE = 0.12; // share of the way to the target speed covered each frame

/**
 * The hero's behaviour. The look and the entrance are all CSS (hero.css, so the headline and the first bottles
 * never wait for a script); this file only flips states on the section:
 * is-floating (idle float) and is-paused (off-screen or hidden tab).
 */
export function initHero() {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;

  if (!prefersReducedMotion()) {
    const float = () => setTimeout(() => hero.classList.add('is-floating'), INTRO_MS);
    // while the intro splash is up the entrance is held (splash.css), so the float waits for the splash to leave
    if (document.documentElement.classList.contains('splash-hold'))
      document.addEventListener('ys:splash-exit', float, { once: true });
    else float();
  }

  repaintPhotosAsCardsLand(hero);
  pauseWhenAway(hero);
  slowRingOnHover(hero);
  keepScrollerFocusable(hero);
}

/**
 * A photo first painted under a card that is still at opacity 0 is not counted as painted until something repaints it,
 * which on a quiet page can be seconds later. Touching it once as its card lands makes the browser (and the
 * Largest Contentful Paint measure) see the bottle when the visitor does.
 */
function repaintPhotosAsCardsLand(hero) {
  hero.querySelectorAll('.hc').forEach((card) => {
    card.addEventListener(
      'animationend',
      () => {
        const img = card.querySelector('.hc__img');
        if (!img) return;
        img.style.opacity = '0.999';
        requestAnimationFrame(() => img.style.removeProperty('opacity'));
      },
      { once: true }
    );
  });
}

/** Looping animations stop while the hero is off-screen or the tab is hidden. */
function pauseWhenAway(hero) {
  let visible = true;
  const apply = () => hero.classList.toggle('is-paused', !visible || document.hidden);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      apply();
    }).observe(hero);
  }
  document.addEventListener('visibilitychange', apply);
}

/** The badge ring eases down to a slow turn on hover or focus and back up again (playbackRate, no jump). */
function slowRingOnHover(hero) {
  const badge = hero.querySelector('[data-badge]');
  const ring = badge?.querySelector('.badge__ring');
  if (!ring || prefersReducedMotion() || !ring.getAnimations) return;
  let rate = 1;
  let target = 1;
  let running = false;
  const step = () => {
    rate += (target - rate) * RING_EASE;
    if (Math.abs(target - rate) < 0.01) rate = target;
    ring.getAnimations().forEach((a) => a.updatePlaybackRate(rate));
    running = rate !== target;
    if (running) requestAnimationFrame(step);
  };
  const set = (value) => {
    target = value;
    if (!running) {
      running = true;
      requestAnimationFrame(step);
    }
  };
  badge.addEventListener('pointerenter', () => set(RING_SLOW));
  badge.addEventListener('pointerleave', () => set(1));
  badge.addEventListener('focus', () => set(RING_SLOW));
  badge.addEventListener('blur', () => set(1));
}

/** The card row is a keyboard-scrollable region only when it really overflows (phones and tablets). */
function keepScrollerFocusable(hero) {
  const cards = hero.querySelector('[data-cards]');
  if (!cards || !('ResizeObserver' in window)) return;
  new ResizeObserver(() => {
    if (cards.scrollWidth > cards.clientWidth + 1) cards.setAttribute('tabindex', '0');
    else cards.removeAttribute('tabindex');
  }).observe(cards);
}
