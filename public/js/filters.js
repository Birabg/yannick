import { prefersReducedMotion } from './motion.js';

const SORTERS = {
  featured: (a, b) => a.dataset.order - b.dataset.order,
  low: (a, b) => a.dataset.price - b.dataset.price,
  high: (a, b) => b.dataset.price - a.dataset.price,
};
const EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

export function initFilters() {
  const grid = document.getElementById('grid');
  if (!grid) return;
  const cards = [...grid.querySelectorAll('[data-card]')];
  const chips = [...document.querySelectorAll('[data-filter]')];
  const search = document.getElementById('search');
  const sort = document.getElementById('sort');
  const count = document.querySelector('[data-count-label]');
  const empty = document.querySelector('[data-empty]');
  const state = { filter: 'all', query: '', sort: 'featured' };

  const isVisible = (card) => !card.hidden;

  function apply() {
    const query = state.query.trim().toLowerCase();
    cards.forEach((card) => {
      const inFilter =
        state.filter === 'all' || card.dataset.collections.split(' ').includes(state.filter);
      card.hidden = !(inFilter && (!query || card.dataset.search.includes(query)));
    });
    [...cards].sort(SORTERS[state.sort]).forEach((card) => grid.append(card));
  }

  /** FLIP: measure, change the DOM, then animate each card from its old spot (transform/opacity only). */
  function render() {
    const animate = !prefersReducedMotion();
    const before = new Map();
    if (animate)
      cards.filter(isVisible).forEach((card) => before.set(card, card.getBoundingClientRect()));

    apply();

    const visible = cards.filter(isVisible);
    if (animate) {
      visible.forEach((card) => {
        const from = before.get(card);
        if (!from) {
          card.animate(
            [
              { opacity: 0, transform: 'translateY(12px)' },
              { opacity: 1, transform: 'none' },
            ],
            { duration: 600, easing: EASE }
          );
          return;
        }
        const to = card.getBoundingClientRect();
        const dx = from.left - to.left;
        const dy = from.top - to.top;
        if (!dx && !dy) return;
        card.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
          duration: 600,
          easing: EASE,
        });
      });
    }

    const n = visible.length;
    count.textContent = `${n} ${n === 1 ? 'perfume' : 'perfumes'}`;
    empty.hidden = n > 0;
    grid.hidden = n === 0;
  }

  const press = (active) =>
    chips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip === active)));

  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      state.filter = chip.dataset.filter;
      press(chip);
      render();
    })
  );
  search.addEventListener('input', () => {
    state.query = search.value;
    render();
  });
  sort.addEventListener('change', () => {
    state.sort = sort.value;
    render();
  });
  document.querySelectorAll('[data-reset]').forEach((button) =>
    button.addEventListener('click', () => {
      state.filter = 'all';
      state.query = '';
      search.value = '';
      press(chips.find((chip) => chip.dataset.filter === 'all'));
      render();
    })
  );
}
