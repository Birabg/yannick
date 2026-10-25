// Runs in <head> before first paint so the saved theme never flashes.
(function () {
  var root = document.documentElement;
  var theme = 'dark';
  try {
    theme = localStorage.getItem('ys-theme') || 'dark';
  } catch {
    /* storage unavailable: keep the default */
  }
  root.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
  root.classList.add('js');
})();
