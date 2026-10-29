const HOVER_DELAY = 100;

/**
 * The scent family panels: exactly one is open. Hover (after a short intent delay), click, or the arrow keys
 * open a panel; the row's grid tracks are set here so the browser animates the change.
 * TODO: an optional ambient-audio pill (off by default, never autoplay) could live here later.
 */
function initAccordion(row) {
  const panels = [...row.querySelectorAll('[data-sf-panel]')];
  if (panels.length < 2) return;
  const tabs = panels.map((p) => p.querySelector('[data-sf-tab]'));
  row.style.setProperty('--n', String(panels.length));

  const open = (index) => {
    row.style.setProperty(
      '--tracks',
      panels.map((_, n) => (n === index ? 'var(--open)' : 'var(--strip)')).join(' ')
    );
    panels.forEach((panel, n) => {
      const on = n === index;
      panel.classList.toggle('is-active', on);
      tabs[n].setAttribute('aria-expanded', String(on));
      panel.querySelector('.sf__inner').toggleAttribute('inert', !on);
    });
  };

  const wanted = new URLSearchParams(location.search).get('family');
  const start = Math.max(0, panels.findIndex((p) => p.dataset.key === wanted));
  row.style.transition = 'none';
  open(start);
  row.getBoundingClientRect();
  row.style.removeProperty('transition');

  let timer = 0;
  panels.forEach((panel, n) => {
    tabs[n].addEventListener('click', () => open(n));
    panel.addEventListener('mouseenter', () => {
      if (!matchMedia('(hover: hover)').matches || panel.classList.contains('is-active')) return;
      clearTimeout(timer);
      timer = setTimeout(() => open(n), HOVER_DELAY);
    });
    panel.addEventListener('mouseleave', () => clearTimeout(timer));
  });

  row.addEventListener('keydown', (event) => {
    const at = tabs.indexOf(document.activeElement);
    if (at < 0) return;
    const next = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    let to;
    if (next) to = (at + next + panels.length) % panels.length;
    else if (event.key === 'Home') to = 0;
    else if (event.key === 'End') to = panels.length - 1;
    else return;
    event.preventDefault();
    open(to);
    tabs[to].focus();
  });
}

/** The round "back to top" button appears once the page has scrolled a screenful. */
function initToTop() {
  const button = document.querySelector('[data-totop]');
  if (!button) return;
  const sync = () => button.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8);
  window.addEventListener('scroll', sync, { passive: true });
  sync();
  button.addEventListener('click', () => {
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
  });
}

export function initFamilies() {
  document.querySelectorAll('[data-sf]').forEach(initAccordion);
  initToTop();
}
