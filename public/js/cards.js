/** Hero card behaviour: tilt toward the cursor, a keyboard-friendly carousel, and the header search shortcut. */
export function initCards() {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Cards tilt a few degrees toward the cursor (desktop only; transform only).
  if (fine && !reduced) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', `${(x * 7).toFixed(2)}deg`);
        card.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--rx', '0deg');
      });
    });
  }

  // Arrow keys move the carousel one card; tabbing to a card scrolls it into view natively.
  const cards = document.querySelector('[data-cards]');
  if (cards) {
    cards.addEventListener('keydown', (e) => {
      if (e.target !== cards || !['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
      const step = cards.querySelector('.hc')?.getBoundingClientRect().width || 240;
      cards.scrollBy({
        left: (e.key === 'ArrowRight' ? 1 : -1) * (step + 12),
        behavior: reduced ? 'auto' : 'smooth',
      });
      e.preventDefault();
    });
  }

  // The header search icon jumps to the collection and focuses the search field.
  document.querySelector('[data-search-link]')?.addEventListener('click', () => {
    setTimeout(() => document.getElementById('search')?.focus({ preventScroll: true }), 450);
  });
}

/** "By mood": pick a moment and three matching bottles appear. */
export function initMood() {
  const buttons = [...document.querySelectorAll('[data-mood-btn]')];
  const panels = [...document.querySelectorAll('[data-mood-panel]')];
  if (!buttons.length) return;

  function select(btn, focus) {
    buttons.forEach((b) => {
      const on = b === btn;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p) => {
      const on = p.dataset.moodPanel === btn.dataset.moodBtn;
      p.hidden = !on;
      if (on) {
        p.classList.remove('is-in');
        void p.offsetWidth; // restart the reveal
        p.classList.add('is-in');
      }
    });
    if (focus) btn.focus();
  }

  buttons.forEach((b, n) => {
    b.tabIndex = n === 0 ? 0 : -1;
    b.addEventListener('click', () => select(b));
    b.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      select(buttons[(n + step + buttons.length) % buttons.length], true);
    });
  });
}
