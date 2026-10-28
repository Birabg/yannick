// Light / Dark / System. The inline script in partials/theme-init.ejs has already set data-theme
// before first paint; this wires the controls, saves the choice and follows the OS while on System.
const KEY = 'ys-theme';
const ORDER = ['light', 'dark', 'system'];
const LABEL = { light: 'Light', dark: 'Dark', system: 'System' };
const COLORS = { light: '#fbfaf7', dark: '#100e0c' };

const root = document.documentElement;
const media = window.matchMedia('(prefers-color-scheme: dark)');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

function readPref() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* storage can be blocked; fall through to System */
  }
  return 'system';
}

function savePref(pref) {
  try {
    if (pref === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    /* the choice then lasts for this page view only */
  }
}

const resolve = (pref) => (pref === 'system' ? (media.matches ? 'dark' : 'light') : pref);

function apply(pref, { animate = false } = {}) {
  const theme = resolve(pref);
  if (animate && !reduced.matches) {
    root.classList.add('theme-anim');
    setTimeout(() => root.classList.remove('theme-anim'), 260);
  }
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-theme-pref', pref);
  // The splash holds the bar at ink while it shows and restores the theme colour itself.
  if (!root.classList.contains('sp')) {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS[theme]);
  }

  document.querySelectorAll('[data-theme-cycle]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(theme === 'dark'));
    btn.setAttribute(
      'aria-label',
      `Colour theme: ${LABEL[pref]}${pref === 'system' ? ` (${theme})` : ''}. Press to change.`
    );
  });
  document.querySelectorAll('[data-theme-set]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.themeSet === pref));
  });
}

export function initTheme() {
  let pref = readPref();
  apply(pref);

  document.addEventListener('click', (event) => {
    const cycle = event.target.closest('[data-theme-cycle]');
    const set = event.target.closest('[data-theme-set]');
    if (!cycle && !set) return;
    pref = set ? set.dataset.themeSet : ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
    savePref(pref);
    apply(pref, { animate: true });
  });

  // While on System, follow the OS live.
  media.addEventListener('change', () => {
    if (pref === 'system') apply(pref, { animate: true });
  });
  // Another tab changed the choice.
  window.addEventListener('storage', (event) => {
    if (event.key !== KEY) return;
    pref = readPref();
    apply(pref, { animate: true });
  });
}
