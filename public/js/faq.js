/**
 * The questions accordion: one answer open at a time, Up / Down / Home / End move between the rows.
 * The height animation is CSS (grid-template-rows 0fr -> 1fr); this only flips aria-expanded and the
 * `is-open` class. With more than 8 questions a search box filters them.
 */
export function initFaq() {
  const root = document.querySelector('[data-faq]');
  if (!root) return;
  const items = [...root.querySelectorAll('[data-faq-item]')];
  const buttons = items.map((item) => item.querySelector('.faq__btn'));

  function setOpen(item, open) {
    item.classList.toggle('is-open', open);
    item.querySelector('.faq__btn').setAttribute('aria-expanded', String(open));
  }

  buttons.forEach((button, n) => {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      items.forEach((item) => setOpen(item, false));
      setOpen(items[n], open);
    });
    button.addEventListener('keydown', (event) => {
      const visible = buttons.filter((b) => !b.closest('[data-faq-item]').hidden);
      const at = visible.indexOf(button);
      const next = {
        ArrowDown: visible[(at + 1) % visible.length],
        ArrowUp: visible[(at - 1 + visible.length) % visible.length],
        Home: visible[0],
        End: visible[visible.length - 1],
      }[event.key];
      if (!next) return;
      event.preventDefault();
      next.focus();
    });
  });

  const search = root.querySelector('[data-faq-search]');
  if (search) {
    const none = root.querySelector('[data-faq-none]');
    search.addEventListener('input', () => {
      const query = search.value.trim().toLowerCase();
      let shown = 0;
      items.forEach((item) => {
        const match = !query || item.dataset.text.includes(query);
        item.hidden = !match;
        if (match) shown += 1;
      });
      none.hidden = shown > 0;
    });
  }
}
