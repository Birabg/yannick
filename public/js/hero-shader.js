/** Loads the shader island after first paint, only when the device can run it and wants it.
 *  It paints the "liquid glass" inside the centre hero card and the order panel, never behind text. */
export function initHeroShader() {
  const hosts = [...document.querySelectorAll('[data-shader]')];
  if (!hosts.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection && navigator.connection.saveData;
  const lowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
  const slow = ['slow-2g', '2g'].includes(
    navigator.connection && navigator.connection.effectiveType
  );
  // The shaders package renders with WebGPU; without it the CSS gradient stays.
  if (reduced || saveData || lowEnd || slow || !('gpu' in navigator)) return;

  let island;
  const load = () => {
    // Ask for an adapter first, so a device with no usable GPU never downloads the bundle.
    island ||= navigator.gpu
      .requestAdapter()
      .then((adapter) => (adapter ? import(hosts[0].dataset.src) : null))
      .catch(() => null);
    return island;
  };
  const start = (host) =>
    load()
      .then((mod) => mod && mod.mount(host))
      .catch(() => {});

  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 300));
  const lazy = [];
  const now = [];
  hosts.forEach((host) => (host.hasAttribute('data-lazy') ? lazy : now).push(host));

  // The glass is polish, so it waits for the page to settle: the first touch, scroll or key press,
  // or six seconds after load, whichever comes first. Until then the CSS gradient looks the same.
  if (now.length) {
    let started = false;
    const go = () => {
      if (started) return;
      started = true;
      ['pointermove', 'touchstart', 'scroll', 'keydown'].forEach((t) => removeEventListener(t, go));
      idle(() => now.forEach(start), { timeout: 2500 });
    };
    const arm = () => {
      ['pointermove', 'touchstart', 'scroll', 'keydown'].forEach((t) =>
        addEventListener(t, go, { passive: true, once: true })
      );
      setTimeout(go, 6000);
    };
    if (document.readyState === 'complete') arm();
    else addEventListener('load', arm, { once: true });
  }
  // Lower on the page: wait until it is about to scroll into view.
  if (lazy.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          start(e.target);
        });
      },
      { rootMargin: '400px 0px' }
    );
    lazy.forEach((h) => io.observe(h));
  }
}
