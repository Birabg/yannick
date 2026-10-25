import { prefersReducedMotion } from './motion.js';

const LOADING = `
  <div class="sheet__loading" role="status" aria-label="Loading perfume details">
    <div class="skeleton skeleton--tall"></div>
    <div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>
  </div>`;
const FAILED = `
  <div class="sheet__loading"><p><strong>We couldn't load this perfume.</strong> Check your connection and try again.</p></div>`;

const DISMISS_DISTANCE = 110; // px dragged down before the sheet closes
const DISMISS_VELOCITY = 0.6; // px/ms
const isProductPath = (path) => path.startsWith('/perfume/');
const isPhone = () => window.matchMedia('(max-width: 759px)').matches;

/** Product details: bottom sheet on phones (swipe down to close), side drawer on larger screens. */
export function initSheet() {
  const sheet = document.getElementById('sheet');
  const body = document.getElementById('sheet-body');
  if (!sheet || !body || typeof sheet.showModal !== 'function') return;
  const scroller = body.parentElement;

  // True when we pushed a history entry for the open sheet, so closing pops it.
  let pushed = false;

  async function load(path) {
    body.innerHTML = LOADING;
    document.documentElement.classList.add('sheet-open');
    if (!sheet.open) sheet.showModal();
    scroller.scrollTop = 0;
    try {
      const response = await fetch(`${path}?partial=1`);
      if (!response.ok) throw new Error(String(response.status));
      body.innerHTML = await response.text();
    } catch {
      body.innerHTML = FAILED;
    }
  }

  function dismiss() {
    if (!sheet.open || sheet.classList.contains('is-closing')) return;
    if (prefersReducedMotion()) {
      sheet.close();
      return;
    }
    sheet.classList.add('is-closing');
    sheet.addEventListener(
      'animationend',
      () => {
        sheet.classList.remove('is-closing');
        sheet.close();
      },
      { once: true }
    );
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-open-product]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    const path = new URL(link.href).pathname;
    history.pushState({ sheet: true }, '', path);
    pushed = true;
    load(path);
  });

  sheet.addEventListener('close', () => {
    document.documentElement.classList.remove('sheet-open');
    sheet.style.removeProperty('--drag');
    if (pushed) {
      pushed = false;
      history.back();
    }
  });
  sheet.addEventListener('cancel', (event) => {
    event.preventDefault(); // Esc: close with the exit animation instead
    dismiss();
  });
  sheet.addEventListener('click', (event) => {
    if (event.target === sheet) dismiss(); // the backdrop is part of the <dialog>
  });
  sheet.querySelector('[data-sheet-close]').addEventListener('click', dismiss);

  // Browser back/forward closes the sheet or reopens the one in the URL.
  window.addEventListener('popstate', () => {
    if (isProductPath(location.pathname)) {
      pushed = true;
      load(location.pathname);
    } else if (sheet.open) {
      pushed = false;
      sheet.close();
    }
  });

  // Swipe down to dismiss (phones). Drag from the top bar, or from the content when scrolled to the top.
  let startY = 0;
  let startTime = 0;
  let dy = 0;
  let tracking = false;
  let dragging = false;

  sheet.addEventListener(
    'touchstart',
    (event) => {
      if (!isPhone() || event.touches.length !== 1) return;
      const onBar = event.target.closest('.sheet__bar');
      if (!onBar && scroller.scrollTop > 0) return;
      tracking = true;
      dragging = false;
      startY = event.touches[0].clientY;
      startTime = event.timeStamp;
      dy = 0;
    },
    { passive: true }
  );
  sheet.addEventListener(
    'touchmove',
    (event) => {
      if (!tracking) return;
      dy = event.touches[0].clientY - startY;
      if (
        dy <= 0 ||
        (!dragging && scroller.scrollTop > 0 && !event.target.closest('.sheet__bar'))
      ) {
        if (!dragging) tracking = false;
        return;
      }
      dragging = true;
      event.preventDefault();
      sheet.classList.add('is-dragging');
      sheet.style.setProperty('--drag', `${dy}px`);
    },
    { passive: false }
  );
  const endDrag = (event) => {
    if (!tracking) return;
    tracking = false;
    if (!dragging) return;
    dragging = false;
    sheet.classList.remove('is-dragging');
    const velocity = dy / Math.max(1, event.timeStamp - startTime);
    if (dy > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY) {
      sheet.style.setProperty('--drag', '100vh');
      const finish = () => {
        sheet.close();
        sheet.style.removeProperty('--drag');
      };
      if (prefersReducedMotion()) finish();
      else sheet.addEventListener('transitionend', finish, { once: true });
    } else {
      sheet.style.setProperty('--drag', '0px');
    }
  };
  sheet.addEventListener('touchend', endDrag);
  sheet.addEventListener('touchcancel', endDrag);
}
