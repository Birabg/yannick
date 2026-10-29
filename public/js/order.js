import { prefersReducedMotion } from './motion.js';
import { toast } from './toast.js';

/** Copies text, with a fallback for browsers or pages without the async clipboard. */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.append(field);
    field.select();
    const ok = document.execCommand?.('copy') ?? false;
    field.remove();
    return ok;
  }
}

/** "Copy number" on the phone card, with a small toast (its text is the button's data-copied label). */
function initCopy() {
  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!(await copyText(button.dataset.copy))) return;
      toast(button.querySelector('[data-copied-label]').textContent);
      button.classList.add('is-copied');
      setTimeout(() => button.classList.remove('is-copied'), 1400);
    });
  });
}

/** The bottle in the amber panel drifts a few pixels with the mouse. Not on touch, not with reduced motion. */
function initTilt() {
  const glass = document.querySelector('.order__glass');
  if (!glass || prefersReducedMotion() || !matchMedia('(hover: hover) and (pointer: fine)').matches)
    return;
  let frame = 0;
  const set = (x, y) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      glass.style.setProperty('--px', x.toFixed(3));
      glass.style.setProperty('--py', y.toFixed(3));
    });
  };
  glass.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    const box = glass.getBoundingClientRect();
    set(
      ((event.clientX - box.left) / box.width) * 2 - 1,
      ((event.clientY - box.top) / box.height) * 2 - 1
    );
  });
  glass.addEventListener('pointerleave', () => set(0, 0));
}

export function initOrder() {
  initCopy();
  initTilt();
}
