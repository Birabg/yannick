import { toast } from './toast.js';

const MAX_PHOTO = 5 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const csrf = document.body.dataset.csrf;

// A "Saved." / "Deleted." message arrives as a data attribute after a redirect.
if (document.body.dataset.toast) {
  toast(document.body.dataset.toast);
  const url = new URL(location.href);
  ['saved', 'deleted', 'changed'].forEach((key) => url.searchParams.delete(key));
  history.replaceState(null, '', url);
}

/* ---------- Delete confirmation (styled dialog, not window.confirm) ---------- */
const dialog = document.getElementById('confirm-dialog');
document.addEventListener('submit', (event) => {
  const form = event.target.closest('form[data-confirm]');
  if (!form || form.dataset.confirmed) return;
  event.preventDefault();
  document.getElementById('confirm-text').textContent = form.dataset.confirm;
  dialog.returnValue = '';
  dialog.addEventListener(
    'close',
    () => {
      if (dialog.returnValue !== 'ok') return;
      form.dataset.confirmed = 'true';
      form.requestSubmit();
    },
    { once: true }
  );
  dialog.showModal();
});

/* ---------- Dashboard: search + optimistic stock / feature toggles ---------- */
const search = document.querySelector('[data-admin-search]');
if (search) {
  const rows = [...document.querySelectorAll('.prow[data-search]')];
  const none = document.querySelector('[data-admin-empty]');
  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    let shown = 0;
    rows.forEach((row) => {
      row.hidden = !row.dataset.search.includes(query);
      if (!row.hidden) shown += 1;
    });
    none.hidden = shown > 0;
  });
}

const paint = {
  stock(row, inStock) {
    row.classList.toggle('is-soldout', !inStock);
    const pill = row.querySelector('[data-stock-pill]');
    pill.textContent = inStock ? 'In stock' : 'Sold out';
    pill.classList.toggle('sticker--new', inStock);
    pill.classList.toggle('sticker--soldout', !inStock);
    row.querySelector('form[data-async="stock"] [data-label]').textContent = inStock
      ? 'Mark sold out'
      : 'Mark in stock';
  },
  feature(row, featured) {
    row.querySelector('[data-feature-pill]').hidden = !featured;
    row.querySelector('form[data-async="feature"] [data-label]').textContent = featured
      ? 'Unfeature'
      : 'Feature';
  },
};

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('form[data-async]');
  if (!form) return;
  event.preventDefault();
  const kind = form.dataset.async;
  const row = form.closest('.prow');
  const was =
    kind === 'stock'
      ? !row.classList.contains('is-soldout')
      : !row.querySelector('[data-feature-pill]').hidden;
  paint[kind](row, !was); // optimistic: show the result now, undo if the server disagrees
  const button = form.querySelector('button');
  button.disabled = true;
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      headers: { 'x-csrf-token': csrf, accept: 'application/json' },
    });
    if (!response.ok) throw new Error(String(response.status));
    const data = await response.json();
    paint[kind](row, kind === 'stock' ? data.inStock : data.featured);
    toast(
      kind === 'stock'
        ? data.inStock
          ? 'Marked in stock.'
          : 'Marked sold out.'
        : data.featured
          ? 'Featured.'
          : 'Unfeatured.'
    );
  } catch {
    paint[kind](row, was);
    toast('That did not save. Check your connection and try again.', 'error');
  } finally {
    button.disabled = false;
  }
});

/* ---------- Photo dropzone ---------- */
document.querySelectorAll('[data-dropzone]').forEach((zone) => {
  const input = zone.querySelector('input[type="file"]');
  const img = zone.querySelector('[data-dropzone-img]');
  const error = zone.querySelector('[data-dropzone-error]');

  function take(file) {
    error.hidden = true;
    if (!file) return;
    const okType = PHOTO_TYPES.includes(file.type);
    if (!okType || file.size > MAX_PHOTO) {
      error.textContent = okType
        ? 'That photo is larger than 5 MB.'
        : 'Choose a JPG, PNG or WebP image.';
      error.hidden = false;
      input.value = '';
      return;
    }
    img.src = URL.createObjectURL(file);
    zone.classList.add('has-image');
    zone.dispatchEvent(new CustomEvent('photo', { bubbles: true, detail: img.src }));
  }

  input.addEventListener('change', () => take(input.files[0]));
  ['dragenter', 'dragover'].forEach((type) =>
    zone.addEventListener(type, (event) => {
      event.preventDefault();
      zone.classList.add('is-over');
    })
  );
  ['dragleave', 'drop'].forEach((type) =>
    zone.addEventListener(type, () => zone.classList.remove('is-over'))
  );
  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    take(file);
  });
});

/* ---------- Inline validation ---------- */
function fieldMessage(input) {
  if (input.validity.valueMissing) return 'This field is required.';
  if (input.validity.tooShort) return `Use at least ${input.minLength} characters.`;
  if (input.dataset.numeric !== undefined && !/^\d+$/.test(input.value.replace(/[,\s]/g, ''))) {
    return 'Enter a number, for example 15000.';
  }
  if (input.dataset.match) {
    const other = input.form.elements[input.dataset.match];
    if (other && other.value !== input.value) return 'The passwords do not match.';
  }
  return '';
}

function check(input) {
  const field = input.closest('.field');
  const slot = field?.querySelector('.field__error');
  if (!slot) return true;
  const message = fieldMessage(input);
  slot.textContent = message;
  slot.hidden = !message;
  field.classList.toggle('has-error', Boolean(message));
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  return !message;
}

document.querySelectorAll('form[data-validate]').forEach((form) => {
  const inputs = [
    ...form.querySelectorAll('input[required], select[required], textarea[required], [data-match]'),
  ];
  inputs.forEach((input) => {
    input.addEventListener('blur', () => check(input));
    input.addEventListener('input', () => {
      if (input.closest('.field')?.classList.contains('has-error')) check(input);
    });
  });
  form.addEventListener('submit', (event) => {
    const bad = inputs.filter((input) => !check(input));
    if (bad.length) {
      event.preventDefault();
      bad[0].focus();
      toast('Please fix the highlighted fields.', 'error');
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    button?.classList.add('is-loading');
    if (button) setTimeout(() => (button.disabled = true), 0);
  });
});

/* ---------- Range read-outs ---------- */
document.querySelectorAll('[data-range]').forEach((range) => {
  const out = document.querySelector(`[data-out="${range.dataset.range}"]`);
  range.addEventListener('input', () => {
    out.textContent = range.value;
  });
});

/* ---------- Live card preview ---------- */
const previewForm = document.querySelector('[data-preview-form]');
if (previewForm) {
  const card = document.querySelector('[data-preview-card]');
  const set = (selector, text) => {
    card.querySelector(selector).textContent = text;
  };
  const flags = card.querySelector('[data-preview-flags]');
  const badgeLabels = { featured: 'Featured', new: 'New', bestseller: 'Best Seller' };
  const field = (name) => previewForm.elements[name];
  const families = ['fresh', 'woody', 'oriental'];

  function sticker(kind, label) {
    const node = document.createElement('span');
    node.className = `sticker sticker--${kind}`;
    node.textContent = label;
    return node;
  }

  function update() {
    set('[data-preview-brand]', field('brand').value || 'Brand');
    set('[data-preview-name]', field('name').value || 'Perfume name');
    set(
      '[data-preview-meta]',
      [field('size').value, field('concentration').value].filter(Boolean).join(' · ') || '100ml'
    );
    const price = Number.parseInt(field('price').value.replace(/\D/g, ''), 10);
    set('[data-preview-price]', Number.isFinite(price) ? price.toLocaleString('en-US') : '0');

    const checked = (name) =>
      [...previewForm.querySelectorAll(`input[name="${name}"]:checked`)].map((c) => c.value);
    const family = families.find((key) => checked('collections').includes(key)) || 'none';
    card.className = `card fam--${family}`;
    card.classList.toggle('is-soldout', field('in_stock').value === '0');

    const tags = [];
    if (field('in_stock').value === '0') tags.push(sticker('soldout', 'Sold out'));
    if (field('is_sample').checked) tags.push(sticker('sample', 'Sample'));
    checked('badges').forEach((key) => tags.push(sticker(key, badgeLabels[key])));
    flags.replaceChildren(...tags);
  }

  previewForm.addEventListener('input', update);
  previewForm.addEventListener('change', update);
  previewForm.addEventListener('photo', (event) => {
    card.querySelector('[data-preview-img]').src = event.detail;
  });
  update();
}
