import { prefersReducedMotion } from './motion.js';
import { refreshLanguage } from './i18n.js';
import { toast } from './toast.js';

/**
 * The perfume quick view. This small file stays on every page; the panel itself (quickview.js) is fetched the first time
 * a bottle is hovered, focused or clicked, or when the address already names one (?perfume=slug).
 * Cards stay real links: only a plain left click opens the panel, so middle-click, Ctrl/Cmd-click and "open in new tab" still go to the full page.
 */
export function initSheet() {
  const sheet = document.getElementById('sheet');
  if (!sheet || typeof sheet.showModal !== 'function') return;

  let loading;
  const panel = () =>
    (loading ??= import('./quickview.js').then((mod) => {
      mod.init({ prefersReducedMotion, refreshLanguage, toast });
      return mod;
    }));

  const warm = (event) => {
    const link = event.target.closest?.('a[data-open-product]');
    if (link) panel().then((mod) => mod.prefetch(new URL(link.href).pathname.split('/').pop()));
  };
  document.addEventListener('pointerover', warm, { passive: true });
  document.addEventListener('focusin', warm);

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-open-product]');
    if (
      !link ||
      link.closest('#sheet') ||
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      return;
    event.preventDefault();
    panel().then((mod) => mod.openFrom(link));
  });

  if (new URLSearchParams(location.search).has('perfume')) panel().then((mod) => mod.openFromUrl());
}
