import { prefersReducedMotion } from './motion.js';

// A perfume without a price goes last whichever way the list is sorted.
const priceOf = (card) => Number(card.dataset.price) || 0;
const byPrice = (direction) => (a, b) => {
  const [x, y] = [priceOf(a), priceOf(b)];
  if (!x || !y) return !x && !y ? a.dataset.order - b.dataset.order : !x ? 1 : -1;
  return (x - y) * direction || a.dataset.order - b.dataset.order;
};
const SORTERS = {
  featured: (a, b) => a.dataset.order - b.dataset.order,
  low: byPrice(1),
  high: byPrice(-1),
};
const EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

export function initFilters() {
  const grid = document.getElementById('grid');
  if (!grid) return;
  const cards = [...grid.querySelectorAll('[data-card]')];
  const chips = [...document.querySelectorAll('[data-filter]')];
  const tabs = document.querySelector('[data-tabs]');
  const known = (document.querySelector('[data-filter-keys]')?.dataset.filterKeys ?? '').split(' ');
  const search = document.getElementById('search');
  const sort = document.getElementById('sort');
  const count = document.querySelector('[data-count-label]');
  const empty = document.querySelector('[data-empty]');
  const emptyTitle = document.querySelector('[data-empty-title]');
  const emptyText = document.querySelector('[data-empty-text]');
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
    if (n === 0) {
      // A section with nothing in it asks you to message the shop; a search that found nothing says so.
      const searching = state.query.trim() !== '';
      emptyTitle.textContent = searching
        ? emptyTitle.dataset.textSearch
        : emptyTitle.dataset.textFilter;
      emptyText.hidden = !searching;
    }
  }

  /** Marks the active tab, keeps it the only tab stop and scrolls it into view in the mobile row. */
  function press(active, { reveal = true } = {}) {
    chips.forEach((chip) => {
      const on = chip === active;
      chip.setAttribute('aria-pressed', String(on));
      chip.tabIndex = on ? 0 : -1;
    });
    if (reveal && tabs && tabs.scrollWidth > tabs.clientWidth) {
      const left = active.offsetLeft - (tabs.clientWidth - active.offsetWidth) / 2;
      tabs.scrollTo({ left, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  }

  const chipFor = (filter) => chips.find((chip) => chip.dataset.filter === filter);

  /** The filter named in the address (?filter=men); anything unknown means All. */
  const fromUrl = () => {
    const wanted = new URLSearchParams(location.search).get('filter');
    return wanted && known.includes(wanted) ? wanted : 'all';
  };

  function choose(filter, { push = true } = {}) {
    state.filter = filter;
    const chip = chipFor(filter);
    if (chip) press(chip);
    else chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
    if (push) {
      const url = new URL(location.href);
      if (filter === 'all') url.searchParams.delete('filter');
      else url.searchParams.set('filter', filter);
      if (url.href !== location.href) history.pushState({ filter }, '', url);
    }
    render();
  }

  chips.forEach((chip) => chip.addEventListener('click', () => choose(chip.dataset.filter)));

  // Arrow keys move between the tabs; Home and End jump to the ends. Enter or Space picks one.
  tabs?.addEventListener('keydown', (event) => {
    const keys = { ArrowRight: 1, ArrowLeft: -1, Home: 'first', End: 'last' };
    if (!(event.key in keys)) return;
    const at = chips.indexOf(document.activeElement);
    if (at < 0) return;
    event.preventDefault();
    const step = keys[event.key];
    const next =
      step === 'first'
        ? 0
        : step === 'last'
          ? chips.length - 1
          : (at + step + chips.length) % chips.length;
    chips.forEach((chip, n) => (chip.tabIndex = n === next ? 0 : -1));
    chips[next].focus();
    tabs.scrollTo({
      left: chips[next].offsetLeft - (tabs.clientWidth - chips[next].offsetWidth) / 2,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  });

  window.addEventListener('popstate', () => choose(fromUrl(), { push: false }));

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
      state.query = '';
      search.value = '';
      choose('all');
    })
  );

  // Arrive on a shared filtered link: apply it without adding a history entry.
  const initial = fromUrl();
  if (initial !== 'all') {
    state.filter = initial;
    const chip = chipFor(initial);
    if (chip) press(chip, { reveal: false });
    else chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
    apply();
    render();
    if (chip) requestAnimationFrame(() => press(chip));
  }
}
