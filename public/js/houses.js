import { prefersReducedMotion } from './motion.js';

const RAMP_UP = 1300; // ms from standing still to full speed
const RAMP_DOWN = 600; // ms to slow to a stop
const RESUME_AFTER = 2000; // ms a swiped row rests before it carries on
const DRAG_START = 6; // px a finger must move before it counts as a swipe rather than a tap
const START_AT = 0.18; // share of the section that must be on screen before it starts
const READY_CAP = 3000; // never hold the section back longer than this for fonts on a slow line
const ENTER = { row: 700, card: 500, stagger: 60, cards: 10 };
const EASE = 'cubic-bezier(.22, .8, .2, 1)';
const SMALL = window.matchMedia('(max-width: 640px)');
const SMALL_CYCLE = 0.73; // the cards are smaller there, so one cycle is shorter at the same speed

const easeOut = (x) => 1 - (1 - x) ** 3;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The marquee. The markup is complete on arrival (every repeat is server-rendered), and CSS keeps the
 * rows invisible. Once the fonts and the grain texture are in and 18% of the section is on screen, the rows
 * fade up, the first cards stagger in, and the slide is eased from standing to full speed. It eases to a
 * stop when paused (hover, keyboard focus, off screen, hidden tab) and eases back when it resumes.
 * The slide is a Web Animation on the track (transform only), so none of this touches layout.
 */
export async function initHouses() {
  const root = document.querySelector('[data-houses]');
  if (!root) return;
  if (prefersReducedMotion()) {
    root.classList.add('is-in'); // a plain row to scroll, shown at once
    return;
  }

  const grain = new Image();
  grain.src = '/img/grain.png';
  await Promise.race([
    Promise.all([document.fonts?.ready, grain.decode().catch(() => {})]),
    wait(READY_CAP),
  ]);

  const state = {
    started: false,
    offscreen: true,
    hover: false,
    focus: false,
    hidden: document.hidden,
  };
  const rows = [...root.querySelectorAll('.hm__row')].map((row) => makeRow(row, state));
  const update = () => rows.forEach((r) => r.sync());

  new IntersectionObserver(
    ([entry]) => {
      state.offscreen = !entry.isIntersecting;
      if (!state.started && entry.intersectionRatio >= START_AT) {
        state.started = true;
        enter(root, rows);
      }
      update();
    },
    { threshold: [0, START_AT] }
  ).observe(root);

  root.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse') {
      state.hover = true;
      update();
    }
  });
  root.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') {
      state.hover = false;
      update();
    }
  });
  // Only keyboard focus pauses it: a card you just clicked must not leave the row stuck.
  root.addEventListener('focusin', (e) => {
    if (!e.target.matches(':focus-visible')) return;
    e.target.scrollIntoView({ block: 'nearest', inline: 'center' });
    state.focus = true;
    update();
  });
  root.addEventListener('focusout', () => {
    root.querySelectorAll('.hm__row').forEach((row) => (row.scrollLeft = 0));
    state.focus = !!root.querySelector(':focus-visible');
    update();
  });
  document.addEventListener('visibilitychange', () => {
    state.hidden = document.hidden;
    update();
  });
}

/** Fades the rows in and staggers the cards that are on screen, left to right. Under 1.2s in all. */
function enter(root, rows) {
  rows.forEach(({ row }) => {
    row.classList.add('is-entering');
    row
      .animate(
        [
          { opacity: 0, transform: 'translate3d(0, 24px, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        ],
        { duration: ENTER.row, easing: EASE, fill: 'backwards' }
      )
      .finished.then(
        () => row.classList.remove('is-entering'),
        () => row.classList.remove('is-entering')
      );
    [...row.querySelectorAll('.house')]
      .map((card) => ({ card, box: card.getBoundingClientRect() }))
      .filter(({ box }) => box.right > 0 && box.left < innerWidth)
      .sort((a, b) => a.box.left - b.box.left)
      .slice(0, ENTER.cards)
      .forEach(({ card }, i) =>
        card.animate(
          [
            { opacity: 0, transform: 'scale(0.96)' },
            { opacity: 1, transform: 'scale(1)' },
          ],
          { duration: ENTER.card, delay: i * ENTER.stagger, easing: EASE, fill: 'backwards' }
        )
      );
  });
  root.classList.add('is-in');
}

function makeRow(row, state) {
  const track = row.querySelector('[data-track]');
  const reverse = row.dataset.dir === 'reverse';
  const cycle = () => parseFloat(row.dataset.cycle) * 1000 * (SMALL.matches ? SMALL_CYCLE : 1);

  // One group is half the track, so sliding by -50% lands on an identical frame. Built standing still.
  const anim = track.animate(
    [{ transform: 'translate3d(0, 0, 0)' }, { transform: 'translate3d(-50%, 0, 0)' }],
    {
      duration: cycle(),
      iterations: Infinity,
      easing: 'linear',
      direction: reverse ? 'reverse' : 'normal',
    }
  );
  anim.playbackRate = 0;
  SMALL.addEventListener('change', () => anim.effect.updateTiming({ duration: cycle() }));

  const api = { row, held: false, sync };
  let rate = 0;
  let target = 0;
  let frame = 0;
  let timer = 0;

  /** Eases the playback rate to `to`; the position carries on from where it is, so there is no jump. */
  function ramp(to, ms) {
    target = to;
    cancelAnimationFrame(frame);
    const from = rate;
    const t0 = performance.now();
    const step = (now) => {
      const x = Math.min(1, (now - t0) / ms);
      rate = from + (to - from) * easeOut(x);
      anim.updatePlaybackRate(rate);
      if (x < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  }
  function stopNow() {
    cancelAnimationFrame(frame);
    target = 0;
    rate = 0;
    anim.updatePlaybackRate(0);
  }
  function sync() {
    const run =
      state.started &&
      !state.offscreen &&
      !state.hover &&
      !state.focus &&
      !state.hidden &&
      !api.held;
    const to = run ? 1 : 0;
    if (to !== target) ramp(to, run ? RAMP_UP : RAMP_DOWN);
  }

  // ---- swipe (touch and pen): the finger moves the animation's clock, so the loop stays seamless ----
  let down = null;
  const shift = (dx) => {
    const d = anim.effect.getTiming().duration;
    const dt = (dx / (track.scrollWidth / 2)) * d * (reverse ? 1 : -1);
    anim.currentTime = ((((down.time + dt) % d) + d) % d) + d;
  };

  row.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse') return; // the mouse just pauses the row on hover
    clearTimeout(timer);
    stopNow();
    api.held = true;
    down = { id: event.pointerId, x: event.clientX, time: anim.currentTime ?? 0, moved: false };
  });
  row.addEventListener('pointermove', (event) => {
    if (!down || event.pointerId !== down.id) return;
    const dx = event.clientX - down.x;
    if (!down.moved && Math.abs(dx) < DRAG_START) return;
    if (!down.moved) {
      down.moved = true;
      row.setPointerCapture(event.pointerId); // only now, so a plain tap still reaches the card
    }
    shift(dx);
  });
  const release = (event) => {
    if (!down || event.pointerId !== down.id) return;
    // a swipe must not open the card it ended on
    if (down.moved)
      row.addEventListener('click', (e) => e.preventDefault(), { once: true, capture: true });
    down = null;
    timer = setTimeout(() => {
      api.held = false;
      sync();
    }, RESUME_AFTER);
  };
  row.addEventListener('pointerup', release);
  row.addEventListener('pointercancel', release);

  return api;
}
