const FOCUSABLE = 'a[href], button:not([disabled])';

export function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const header = document.querySelector('.site-header');
  if (!toggle || !nav) return;

  // Over the hero the header is transparent; after 40px of scrolling it becomes a solid bar.
  const solidify = () => header.classList.toggle('is-solid', window.scrollY > 40);
  // Reading scrollY forces a layout, so the first check waits until after the first paint.
  requestAnimationFrame(solidify);
  window.addEventListener('scroll', solidify, { passive: true });
  const root = document.documentElement;
  const isOpen = () => root.classList.contains('nav-open');

  function setOpen(open) {
    root.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) nav.querySelector('a')?.focus();
  }

  toggle.addEventListener('click', () => setOpen(!isOpen()));
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (!isOpen()) return;
    if (event.key === 'Escape') {
      setOpen(false);
      toggle.focus();
      return;
    }
    if (event.key !== 'Tab') return;
    // Keep focus inside the header and menu while the menu covers the page.
    const items = [
      ...header.querySelectorAll(FOCUSABLE),
      ...nav.querySelectorAll(FOCUSABLE),
    ].filter((el) => el.offsetParent !== null);
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // Growing past the mobile layout closes the menu.
  window.matchMedia('(min-width: 1180px)').addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}
