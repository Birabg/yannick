// A product photo that is missing or fails to load shows the vector bottle, never a broken icon.
const FALLBACK = '/img/bottle-placeholder.svg';

function swap(img) {
  if (img.dataset.failed) return;
  img.dataset.failed = '1';
  img.removeAttribute('srcset');
  img.removeAttribute('sizes');
  img.src = FALLBACK;
  img.classList.add('is-fallback');
}

export function initPhotos() {
  // Errors that happened before this script ran.
  document.querySelectorAll('img[data-photo]').forEach((img) => {
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) swap(img);
  });
  // Errors that happen later, including photos inside the product panel.
  document.addEventListener(
    'error',
    (event) => {
      if (event.target instanceof HTMLImageElement && event.target.matches('img[data-photo]')) {
        swap(event.target);
      }
    },
    true
  );
}
