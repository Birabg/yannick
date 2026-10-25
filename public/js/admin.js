const dialog = document.getElementById('confirm-dialog');

// Delete confirmations use a styled dialog instead of window.confirm().
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
      form.submit();
    },
    { once: true }
  );
  dialog.showModal();
});

// Live filter on the perfume list.
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

// Photo preview and a client-side size/type check (the server validates again).
const photoInput = document.querySelector('[data-photo-input]');
if (photoInput) {
  const preview = document.getElementById('photo-preview');
  const error = document.querySelector('[data-photo-error]');
  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    error.hidden = true;
    if (!file) return;
    const okType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    if (!okType || file.size > 5 * 1024 * 1024) {
      error.textContent = okType
        ? 'That photo is larger than 5 MB.'
        : 'Choose a JPG, PNG or WebP image.';
      error.hidden = false;
      photoInput.value = '';
      return;
    }
    preview.src = URL.createObjectURL(file);
  });
}

// Note tag preview and range read-outs.
document.querySelectorAll('[data-tags]').forEach((input) => {
  const list = document.getElementById(input.dataset.tags);
  const render = () => {
    list.replaceChildren(
      ...input.value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => Object.assign(document.createElement('li'), { textContent: tag }))
    );
  };
  input.addEventListener('input', render);
  render();
});
document.querySelectorAll('[data-range]').forEach((range) => {
  const out = document.querySelector(`[data-out="${range.dataset.range}"]`);
  range.addEventListener('input', () => {
    out.textContent = range.value;
  });
});
