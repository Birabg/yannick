const KEY = 'ys-theme';
const META_COLOR = { dark: '#0e0c0a', light: '#faf6ee' };

function apply(button, theme) {
  document.documentElement.setAttribute('data-theme', theme);
  button.setAttribute(
    'aria-label',
    theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
  );
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLOR[theme]);
}

export function initTheme() {
  const button = document.querySelector('[data-theme-toggle]');
  if (!button) return;
  apply(button, document.documentElement.getAttribute('data-theme'));
  button.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(button, next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* storage unavailable: the choice just won't persist */
    }
  });
}
