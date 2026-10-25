import { Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import GlassBackground from './GlassBackground';

/** If the shader throws, drop it and let the CSS gradient keep showing. */
class Boundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Touch screens have no cursor, so walk a slow loop through the hero while it is on screen. */
function startDrift(host: HTMLElement) {
  if (!window.matchMedia('(hover: none), (pointer: coarse)').matches) return () => {};
  let raf = 0;
  let visible = true;
  const io = new IntersectionObserver((entries) => (visible = entries[0].isIntersecting));
  io.observe(host);
  const tick = (t: number) => {
    raf = requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    const r = host.getBoundingClientRect();
    const s = t / 1000;
    const x = r.left + r.width * (0.5 + 0.34 * Math.sin(s * 0.35));
    const y = r.top + r.height * (0.5 + 0.3 * Math.sin(s * 0.27 + 1.3));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y }));
  };
  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
  };
}

/** Mounts the shader into a card or panel. Returns a cleanup function. */
export function mount(host: HTMLElement) {
  const stage = host.querySelector<HTMLElement>('[data-stage]');
  if (!stage) return () => {};
  // Render at most 1.5 device pixels per CSS pixel: a smaller canvas, scaled up by CSS.
  const k = Math.max(1, (window.devicePixelRatio || 1) / 1.5);
  stage.style.setProperty('--k', String(k));

  let stopDrift = () => {};
  const root = createRoot(stage);
  const giveUp = () => {
    host.classList.remove('is-ready');
    stopDrift();
    queueMicrotask(() => root.unmount());
  };
  const isHero = host.dataset.variant === 'hero';
  const theme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  const render = () =>
    root.render(
      <Boundary onError={giveUp}>
        <GlassBackground
          key={isHero ? theme() : 'amber'}
          variant={isHero ? (theme() === 'dark' ? 'hero-dark' : 'hero-light') : 'amber'}
          onReady={() => {
            host.classList.add('is-ready');
            stopDrift();
            stopDrift = startDrift(host);
          }}
          onUnavailable={giveUp}
        />
      </Boundary>
    );
  render();
  // The hero glass follows the site's light / dark theme.
  const watch = isHero ? new MutationObserver(render) : null;
  watch?.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => {
    watch?.disconnect();
    stopDrift();
    root.unmount();
  };
}
