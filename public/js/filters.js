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
  const tabs = document.querySelector('[data-tabs]');
  const known = (document.querySelector('[data-filter-keys]')?.dataset.filterKeys ?? '').split(' ');
  const search = document.getElementById('search');
  const sort = document.getElementById('sort');
  const countN = document.querySelector('[data-count-n]');
  const countOne = document.querySelector('[data-count-one]');
  const countMany = document.querySelector('[data-count-many]');
  const countActive = document.querySelector('[data-count-active]');
  const clearSearch = document.querySelector('[data-search-clear]');
  const moreWrap = document.querySelector('[data-more-wrap]');
  const PAGE = 8; // with more than 12 bottles, show the first 8 and a "Show more" button
  const paged = cards.length > 12;
  const empty = document.querySelector('[data-empty]');
  const emptyTitle = document.querySelector('[data-empty-title]');
  const emptyText = document.querySelector('[data-empty-text]');
  const state = { filter: 'all', query: '', sort: 'featured', brand: '', all: false };

  // The houses: ?brand=dior shows one house's bottles. The slug rule is the same as src/lib/houses.js.
  const slug = (name) =>
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  const brands = new Map(cards.map((card) => [slug(card.dataset.brand), card.dataset.brand]));
  const brandBar = document.querySelector('[data-brandbar]');
  const brandFromUrl = () => {
    const wanted = (new URLSearchParams(location.search).get('brand') ?? '').toLowerCase();
    return brands.has(wanted) ? wanted : '';
  };
  function syncBrandBar() {
    if (!brandBar) return;
    brandBar.hidden = !state.brand;
    brandBar.querySelector('[data-brand-name]').textContent = brands.get(state.brand) ?? '';
  }

  const isVisible = (card) => !card.hidden;
  let matches = [];

  function apply() {
    const query = state.query.trim().toLowerCase();
    const sorted = [...cards].sort(SORTERS[state.sort]);
    matches = sorted.filter((card) => {
      const inFilter =
        state.filter === 'all' || card.dataset.collections.split(' ').includes(state.filter);
      const inBrand = !state.brand || slug(card.dataset.brand) === state.brand;
      return inFilter && inBrand && (!query || card.dataset.search.includes(query));
    });
    const shown = new Set(paged && !state.all ? matches.slice(0, PAGE) : matches);
    cards.forEach((card) => (card.hidden = !shown.has(card)));
    sorted.forEach((card) => grid.append(card));
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

    const n = matches.length;
    countN.textContent = n;
    countOne.hidden = n !== 1;
    countMany.hidden = n === 1;
    const activeChip = state.filter === 'all' ? null : chipFor(state.filter);
    const activeName = state.brand ? (brands.get(state.brand) ?? '') : (activeChip?.firstElementChild.textContent ?? '');
    countActive.hidden = !activeName;
    countActive.textContent = activeName;
    if (moreWrap) moreWrap.hidden = !(paged && !state.all && matches.length > PAGE);
    clearSearch.hidden = state.query === '';
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

  /** Show one house's bottles ('' shows every house). Picking a house resets the section tab to All. */
  function chooseBrand(brand, { push = true } = {}) {
    state.brand = brand;
    if (brand && state.filter !== 'all') {
      state.filter = 'all';
      const all = chipFor('all');
      if (all) press(all, { reveal: false });
    }
    syncBrandBar();
    if (push) {
      const url = new URL(location.href);
      if (brand) {
        url.searchParams.set('brand', brand);
        url.searchParams.delete('filter');
      } else url.searchParams.delete('brand');
      if (url.href !== location.href) history.pushState({ brand }, '', url);
    }
    render();
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-brand-link]');
    if (
      !link ||
      event.defaultPrevented ||
      event.button ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey
    )
      return;
    event.preventDefault();
    chooseBrand(link.dataset.brandLink);
    document
      .getElementById('collection')
      .scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });
  document.querySelector('[data-brand-clear]')?.addEventListener('click', () => chooseBrand(''));

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

  window.addEventListener('popstate', () => {
    state.brand = brandFromUrl();
    syncBrandBar();
    choose(fromUrl(), { push: false });
  });

  search.addEventListener('input', () => {
    state.query = search.value;
    render();
  });
  clearSearch.addEventListener('click', () => {
    search.value = '';
    state.query = '';
    render();
    search.focus();
  });
  document.querySelector('[data-more]')?.addEventListener('click', () => {
    state.all = true;
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
      if (state.brand) {
        state.brand = '';
        syncBrandBar();
        const url = new URL(location.href);
        url.searchParams.delete('brand');
        history.replaceState(history.state, '', url);
      }
      choose('all');
    })
  );

  // Arrive on a shared filtered link: apply it without adding a history entry.
  const initialBrand = brandFromUrl();
  if (initialBrand) {
    state.brand = initialBrand;
    syncBrandBar();
    render();
  }
  const initial = fromUrl();
  if (initial !== 'all') {
    state.filter = initial;
    const chip = chipFor(initial);
    if (chip) press(chip, { reveal: false });
    else chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
    apply();
    render();
    if (chip) requestAnimationFrame(() => press(chip));
  } else if (paged && !initialBrand) {
    render(); // a long shelf starts with its first page
  }
}
