/** If the founder photo fails to load, the brand-colour placeholder behind it stays visible. */
export function initStory() {
  const frame = document.querySelector('[data-story-frame]');
  const img = frame?.querySelector('[data-story-img]');
  if (!img) return;
  const fail = () => frame.classList.add('is-failed');
  img.addEventListener('error', fail);
  if (img.complete && img.naturalWidth === 0 && img.currentSrc) fail();
}
