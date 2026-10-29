/**
 * The quick-view panel, loaded on demand (public/js/sheet.js imports it on the first hover, focus, tap or ?perfume= link).
 * Cards stay real links; a plain click opens this panel and the address becomes ?perfume=<slug>.
 * The page's own helpers arrive through init(), so this file shares their state instead of copying it.
 */
const SWAP_MS = 150;
const DISMISS_DISTANCE = 110; // px dragged down before the sheet closes
const DISMISS_VELOCITY = 0.6; // px/ms
const PARAM = 'perfume';

let deps;
let sheet;
let body;
let scroller;
let nav;
let count;
const cache = new Map(); // slug -> Promise<html>
let items = []; // { slug, href } in the order of the list the panel was opened from
let at = -1;
let opener = null;
let pageY = 0; // where the page was scrolled when the panel opened, put back on close
let pushed = false; // a history entry was added for the open panel, so closing pops it
let current = '';
let placeheld = false; // the panel opened on the card's own picture and words, not an empty skeleton
const strings = {};

const isPhone = () => window.matchMedia('(max-width: 767px)').matches;
const slugOf = (href) => new URL(href, location.href).pathname.split('/').pop();
const lang = () => (document.documentElement.lang === 'am' ? 'am' : 'en');

async function stringsFor(code) {
  if (!strings[code]) strings[code] = fetch(`/i18n/${code}.json`).then((r) => r.json());
  return strings[code];
}

/** The page's list of bottles, in its current filtered and sorted order, as the panel's previous/next sequence. */
function collect(from) {
  const scope = from?.closest('ul') ?? document.getElementById('grid');
  const links = [...(scope?.querySelectorAll('a[data-open-product]') ?? [])].filter(
    (link) => !link.closest('[hidden]') && !link.closest('.qv')
  );
  const seen = new Set();
  return links
    .map((link) => ({ slug: slugOf(link.href), href: link.getAttribute('href') }))
    .filter((item) => !seen.has(item.slug) && seen.add(item.slug));
}

function fetchHtml(slug) {
  if (!cache.has(slug)) {
    cache.set(
      slug,
      fetch(`/perfume/${encodeURIComponent(slug)}?partial=1`).then((response) => {
        if (!response.ok || response.status === 204) throw new Error(String(response.status));
        return response.text();
      })
    );
    cache.get(slug).catch(() => cache.delete(slug));
  }
  return cache.get(slug);
}

/** Fetch a neighbour's panel ahead of time and warm its picture. */
function prefetch(slug) {
  fetchHtml(slug)
    .then((html) => {
      const src = html.match(/<img class="qv__img[^>]*src="([^"]+)"/)?.[1];
      if (src) new Image().src = src;
    })
    .catch(() => {});
}

/** The WhatsApp link in the visitor's language: name, size, price and the page link. */
async function localiseOrder() {
  const link = body.querySelector('[data-wa]');
  if (!link) return;
  const text = await stringsFor(lang());
  const { waLabel: item, waPrice, waUrl, waStock, waNum } = link.dataset;
  const template = text[waStock === '1' ? 'qv.waOrder' : 'qv.waBack'];
  if (!template) return;
  const message = template
    .replace('{item}', item)
    .replace('{price}', waPrice ? ` (${waPrice})` : '')
    .replace('{link}', waUrl);
  link.href = `https://wa.me/${waNum}?text=${encodeURIComponent(message)}`;
}

function setUrl(slug, { push }) {
  const url = new URL(location.href);
  if (slug) url.searchParams.set(PARAM, slug);
  else url.searchParams.delete(PARAM);
  if (url.href === location.href) return;
  if (push) {
    history.pushState({ qv: true }, '', url);
    pushed = true;
  } else history.replaceState(history.state, '', url);
}

function syncNav() {
  const many = items.length > 1 && at >= 0;
  nav.hidden = !many;
  if (many) count.textContent = `${at + 1} / ${items.length}`;
}

/**
 * What the panel can show at once: the card's own picture, brand, name and price, in the panel's own layout,
 * with quiet blocks where the rest will arrive. Returns '' when no card for this perfume is on the page.
 */
function placeholder(slug, from) {
  const card =
    from?.closest('[data-card]') ??
    [...document.querySelectorAll('[data-card]')].find((el) => el.dataset.slug === slug);
  if (!card) return '';
  const { brand, name, priceText, price, fam } = card.dataset;
  const img = card.querySelector('.card__img');
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    node.className = cls;
    if (text) node.textContent = text;
    return node;
  };
  const article = el('article', `qv fam--${fam || 'none'} is-placeholder`);
  const photo = el('div', 'qv__photo');
  const plate = el('div', 'qv__plate');
  if (img) {
    const copy = el('img', `qv__img${img.classList.contains('is-cut') ? ' is-cut' : ''}`);
    copy.src = img.currentSrc || img.src;
    copy.alt = '';
    copy.width = img.width;
    copy.height = img.height;
    plate.append(copy);
  }
  photo.append(plate);
  const text = el('div', 'qv__body');
  text.append(el('p', 'qv__brand', brand));
  const title = el('h2', 'qv__name', name);
  title.id = 'qv-title';
  title.tabIndex = -1;
  text.append(title);
  const cost = el('p', Number(price) > 0 ? 'qv__price' : 'qv__price is-ask');
  const [currency, ...amount] = priceText.split(' ');
  if (Number(price) > 0) cost.append(el('small', '', currency), amount.join(' '));
  else cost.textContent = priceText;
  text.append(cost);
  text.append(el('span', 'qv__skel qv__skel--wide'), el('span', 'qv__skel'), el('span', 'qv__skel qv__skel--short'));
  article.append(photo, text);
  return article.outerHTML;
}

/** Puts a perfume in the panel. The old content fades out and the new fades in (opacity only). */
async function show(slug, { first = false } = {}) {
  current = slug;
  const html = fetchHtml(slug);
  const wait = first || deps.prefersReducedMotion() ? 0 : SWAP_MS;
  if (!first) body.classList.add('is-swapping');
  let markup;
  try {
    [markup] = await Promise.all([html, new Promise((resolve) => setTimeout(resolve, wait))]);
  } catch {
    if (current === slug) failed();
    return;
  }
  if (current !== slug) return;
  body.innerHTML = markup;
  body.classList.toggle('is-first', first && !placeheld);
  body.classList.toggle('is-filled', first && placeheld);
  placeheld = false;
  deps.refreshLanguage(body);
  localiseOrder();
  scroller.scrollTop = 0;
  requestAnimationFrame(() => {
    scroller.scrollTop = 0; // again once the picture and fonts have settled
    body.classList.remove('is-swapping');
    holdHeight();
  });
  const article = body.querySelector('[data-qv]');
  if (article) sheet.setAttribute('aria-labelledby', 'qv-title');
  body.querySelector('[data-qv-share]').hidden = typeof navigator.share !== 'function';
  at = items.findIndex((item) => item.slug === slug);
  syncNav();
  if (first) body.querySelector('.qv__name')?.focus({ preventScroll: true });
  [items[at - 1], items[at + 1]].filter(Boolean).forEach((item) => prefetch(item.slug));
}

/** On a desktop modal the height only ever grows while it is open, so switching perfumes never makes it jump. */
function holdHeight() {
  if (isPhone()) return;
  const held = parseFloat(sheet.style.minHeight) || 0;
  sheet.style.minHeight = `${Math.max(held, sheet.getBoundingClientRect().height)}px`;
}

/** An unknown or unreachable perfume closes the panel quietly. */
function failed() {
  closeNow();
  setUrl('', { push: false });
}

function open(slug, from) {
  items = collect(from);
  opener = document.activeElement;
  if (!sheet.open) {
    pageY = window.scrollY;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--sbw', `${gap}px`);
    document.documentElement.classList.add('sheet-open');
    const early = placeholder(slug, from);
    placeheld = Boolean(early);
    body.classList.remove('is-swapping');
    body.innerHTML =
      early ||
      '<div class="sheet__loading" role="status"><div class="skeleton skeleton--tall"></div><div class="skeleton"></div></div>';
    scroller.scrollTop = 0;
    sheet.showModal();
  }
  show(slug, { first: true });
}

function closeNow() {
  sheet.classList.remove('is-closing');
  if (sheet.open) sheet.close();
}

function dismiss() {
  if (!sheet.open || sheet.classList.contains('is-closing')) return;
  if (deps.prefersReducedMotion()) {
    closeNow();
    return;
  }
  sheet.classList.add('is-closing');
  sheet.addEventListener('animationend', closeNow, { once: true });
}

function step(by) {
  if (items.length < 2 || at < 0) return;
  const next = items[(at + by + items.length) % items.length];
  setUrl(next.slug, { push: false });
  show(next.slug);
}

async function copyLink() {
  const url = new URL(location.href);
  url.search = '';
  url.searchParams.set(PARAM, current);
  try {
    await navigator.clipboard.writeText(url.href);
    deps.toast(body.querySelector('[data-qv-copied]')?.textContent || 'Link copied');
  } catch {
    deps.toast(url.href);
  }
}

function zoomOnTap(event) {
  const plate = event.target.closest('[data-qv-zoom]');
  if (!plate || !isPhone()) return;
  const box = plate.getBoundingClientRect();
  plate.style.setProperty('--zx', `${((event.clientX - box.left) / box.width) * 100}%`);
  plate.style.setProperty('--zy', `${((event.clientY - box.top) / box.height) * 100}%`);
  plate.classList.toggle('is-zoomed');
}

function swipe() {
  let startY = 0;
  let startTime = 0;
  let dy = 0;
  let tracking = false;
  let dragging = false;
  sheet.addEventListener(
    'touchstart',
    (event) => {
      if (!isPhone() || event.touches.length !== 1) return;
      const onBar = event.target.closest('.sheet__bar');
      if (!onBar && scroller.scrollTop > 0) return;
      if (event.target.closest('.qv__plate.is-zoomed')) return;
      tracking = true;
      dragging = false;
      startY = event.touches[0].clientY;
      startTime = event.timeStamp;
      dy = 0;
    },
    { passive: true }
  );
  sheet.addEventListener(
    'touchmove',
    (event) => {
      if (!tracking) return;
      dy = event.touches[0].clientY - startY;
      if (dy <= 0 || (!dragging && scroller.scrollTop > 0 && !event.target.closest('.sheet__bar'))) {
        if (!dragging) tracking = false;
        return;
      }
      dragging = true;
      event.preventDefault();
      sheet.classList.add('is-dragging');
      sheet.style.setProperty('--drag', `${dy}px`);
    },
    { passive: false }
  );
  const end = (event) => {
    if (!tracking) return;
    tracking = false;
    if (!dragging) return;
    dragging = false;
    sheet.classList.remove('is-dragging');
    const velocity = dy / Math.max(1, event.timeStamp - startTime);
    if (dy > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY) {
      sheet.style.setProperty('--drag', '100vh');
      if (deps.prefersReducedMotion()) closeNow();
      else sheet.addEventListener('transitionend', closeNow, { once: true });
    } else sheet.style.setProperty('--drag', '0px');
  };
  sheet.addEventListener('touchend', end);
  sheet.addEventListener('touchcancel', end);
}

export function init(helpers) {
  if (sheet) return;
  deps = helpers;
  sheet = document.getElementById('sheet');
  body = document.getElementById('sheet-body');
  scroller = body.parentElement;
  nav = sheet.querySelector('[data-qv-nav]');
  count = sheet.querySelector('[data-qv-count]');

  sheet.addEventListener('close', () => {
    document.documentElement.classList.remove('sheet-open');
    document.documentElement.style.removeProperty('--sbw');
    sheet.style.removeProperty('--drag');
    sheet.style.removeProperty('min-height');
    sheet.removeAttribute('aria-labelledby');
    current = '';
    const target = opener;
    opener = null;
    // focus goes back to the card that opened the panel (again after the history step, which can move it)
    const restore = () => {
      if (target && document.contains(target)) target.focus({ preventScroll: true });
      window.scrollTo({ top: pageY, behavior: 'instant' }); // the history step can restore a different spot
    };
    if (pushed) {
      pushed = false;
      window.addEventListener('popstate', () => setTimeout(restore, 0), { once: true });
      history.back();
    } else setUrl('', { push: false });
    restore();
  });
  sheet.addEventListener('cancel', (event) => {
    event.preventDefault(); // Esc closes with the exit animation
    dismiss();
  });
  sheet.addEventListener('click', (event) => {
    if (event.target === sheet) return dismiss(); // the backdrop is part of the <dialog>
    if (event.target.closest('[data-qv-copy]')) copyLink();
    else if (event.target.closest('[data-qv-share]'))
      navigator.share?.({ title: body.querySelector('[data-qv]')?.dataset.title, url: location.href }).catch(() => {});
    else zoomOnTap(event);
    const link = event.target.closest('a[data-open-product]');
    if (link && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) {
      event.preventDefault(); // a "you may also like" bottle swaps into the panel
      const slug = slugOf(link.href);
      if (!items.some((item) => item.slug === slug)) items = [{ slug }];
      setUrl(slug, { push: false });
      show(slug);
    }
  });
  sheet.querySelector('[data-sheet-close]').addEventListener('click', dismiss);
  sheet.querySelector('[data-qv-prev]').addEventListener('click', () => step(-1));
  sheet.querySelector('[data-qv-next]').addEventListener('click', () => step(1));
  document.addEventListener('keydown', (event) => {
    if (!sheet.open || event.target.closest('input, textarea, select')) return;
    if (event.key === 'ArrowLeft') step(-1);
    else if (event.key === 'ArrowRight') step(1);
  });

  // Back and forward: close the panel, or open the one the address names.
  window.addEventListener('popstate', () => {
    const slug = new URLSearchParams(location.search).get(PARAM);
    if (slug) {
      if (!sheet.open) open(slug);
      else show(slug);
    } else if (sheet.open) {
      pushed = false;
      closeNow();
    }
  });

  // A language switch re-words the WhatsApp message.
  new MutationObserver(localiseOrder).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang'],
  });
  swipe();
}

/** A plain click on a card link. */
export function openFrom(link) {
  const slug = slugOf(link.href);
  setUrl(slug, { push: true });
  open(slug, link);
}

/** The address already names a perfume (a shared link, or a reload). */
export function openFromUrl() {
  const slug = new URLSearchParams(location.search).get(PARAM);
  if (slug) open(slug);
}

export { prefetch };
