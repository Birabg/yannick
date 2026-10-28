// Size buttons on a perfume that comes in several sizes: they switch the price and the WhatsApp order link.
export function initSizes(root = document) {
  root.querySelectorAll('[data-size-root]').forEach((box) => {
    const scope = box.closest('.detail') || document;
    const chips = [...scope.querySelectorAll('[data-size-chip]')];
    if (!chips.length || box.dataset.ready) return;
    box.dataset.ready = '1';
    const order = scope.querySelector('[data-order-link]');
    const pick = (chip) => {
      chips.forEach((c) => c.setAttribute('aria-checked', String(c === chip)));
      box.querySelectorAll('[data-size-price-for]').forEach((el) => {
        el.hidden = el.dataset.sizePriceFor !== chip.dataset.sizeChip;
      });
      if (order) order.href = chip.dataset.href;
    };
    chips.forEach((chip) => chip.addEventListener('click', () => pick(chip)));
  });
}
