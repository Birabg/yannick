const SORTERS = {
  featured: (a, b) => a.dataset.order - b.dataset.order,
  low: (a, b) => a.dataset.price - b.dataset.price,
  high: (a, b) => b.dataset.price - a.dataset.price,
};

export function initFilters() {
  const grid = document.getElementById('grid');
  if (!grid) return;
  const cards = [...grid.querySelectorAll('[data-card]')];
  const chips = [...document.querySelectorAll('[data-filter]')];
  const search = document.getElementById('search');
  const sort = document.getElementById('sort');
  const count = document.querySelector('[data-count]');
  const empty = document.querySelector('[data-empty]');
  const state = { filter: 'all', query: '', sort: 'featured' };

  function render() {
    const query = state.query.trim().toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const inFilter =
        state.filter === 'all' || card.dataset.collections.split(' ').includes(state.filter);
      const inQuery = !query || card.dataset.search.includes(query);
      card.hidden = !(inFilter && inQuery);
      if (!card.hidden) visible += 1;
    });

    [...cards].sort(SORTERS[state.sort]).forEach((card) => grid.append(card));

    count.textContent = `${visible} ${visible === 1 ? 'perfume' : 'perfumes'}`;
    empty.hidden = visible > 0;
    grid.hidden = visible === 0;
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
  document.querySelector('[data-reset]')?.addEventListener('click', () => {
    state.filter = 'all';
    state.query = '';
    search.value = '';
    press(chips.find((chip) => chip.dataset.filter === 'all'));
    render();
  });
}
