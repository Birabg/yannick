const LOADING = `
  <div class="modal__loading" role="status" aria-label="Loading perfume details">
    <div class="skeleton skeleton--tall"></div><div class="skeleton"></div><div class="skeleton"></div>
  </div>`;
const FAILED = `
  <div class="modal__loading"><p>We couldn't load this perfume. Please try again.</p></div>`;

const isProductPath = (path) => path.startsWith('/perfume/');

export function initModal() {
  const modal = document.getElementById('product-modal');
  const body = document.getElementById('modal-body');
  const grid = document.getElementById('grid');
  if (!modal || !grid || typeof modal.showModal !== 'function') return;

  // True when we pushed a history entry for the open modal, so closing should pop it.
  let pushed = false;

  async function load(path) {
    body.innerHTML = LOADING;
    document.documentElement.classList.add('modal-open');
    if (!modal.open) modal.showModal();
    try {
      const response = await fetch(`${path}?partial=1`);
      if (!response.ok) throw new Error(String(response.status));
      body.innerHTML = await response.text();
    } catch {
      body.innerHTML = FAILED;
    }
  }

  grid.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-open-product]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    const path = new URL(link.href).pathname;
    history.pushState({ modal: true }, '', path);
    pushed = true;
    load(path);
  });

  modal.addEventListener('close', () => {
    document.documentElement.classList.remove('modal-open');
    if (pushed) {
      pushed = false;
      history.back();
    }
  });
  modal.addEventListener('click', (event) => {
    // A click on the backdrop lands on the <dialog> element itself.
    if (event.target === modal) modal.close();
  });
  modal.querySelector('[data-modal-close]').addEventListener('click', () => modal.close());

  // Browser back/forward: close the modal or reopen the one in the URL.
  window.addEventListener('popstate', () => {
    if (isProductPath(location.pathname)) {
      pushed = true;
      load(location.pathname);
    } else if (modal.open) {
      pushed = false;
      modal.close();
    }
  });
}
