/**
 * WCAG contrast check for both themes. It reads the colours straight from public/css/tokens.css,
 * so the numbers can never drift from the stylesheet. Run: node scripts/contrast.js
 * Text pairs need 4.5:1; outlines, focus rings and other UI graphics need 3:1.
 */
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '../public/css/tokens.css'), 'utf8');

/** Custom properties declared in the first rule whose selector starts with `selector`. */
function block(selector) {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`tokens.css has no ${selector} block`);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
  );
}

const base = block(':root');
const light = { ...base, ...block(":root,\n:root[data-theme='light']") };
const dark = { ...base, ...block(":root[data-theme='dark']") };

const hex = (v) => {
  const m = /^#([0-9a-f]{6})$/i.exec(v);
  return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : null;
};

/** A token as [r, g, b]; rgb(r g b / a) is composited over `under`. Follows var(--x) one level. */
function rgb(theme, name, under) {
  let v = theme[name];
  const ref = /^var\(--([\w-]+)\)$/.exec(v || '');
  if (ref) return rgb(theme, ref[1], under);
  const h = hex(v);
  if (h) return h;
  const m = /^rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)\)$/.exec(v || '');
  if (m && under) {
    const a = Number(m[4]);
    return [1, 2, 3].map((i) => Math.round(Number(m[i]) * a + under[i - 1] * (1 - a)));
  }
  throw new Error(`cannot read --${name} = ${v}`);
}

const lum = (c) => {
  const [r, g, b] = c
    .map((x) => x / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

let failures = 0;
const check = (theme, label, fg, bg, min = 4.5) => {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failures += 1;
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${r.toFixed(2).padStart(5)} (>= ${min})  ${theme}: ${label}`
  );
};

const families = ['fresh', 'woody', 'oriental', 'men', 'women', 'none'];

for (const [name, t] of [
  ['light', light],
  ['dark', dark],
]) {
  const c = (token, under) => rgb(t, token, under);
  const bg = c('bg');
  const T = (label, fg, back, min) => check(name, label, fg, back, min);

  // body text on every surface
  for (const s of ['bg', 'surface', 'surface-2', 'chip']) {
    T(`text on ${s}`, c('text'), c(s));
    T(`muted text on ${s}`, c('text-muted'), c(s));
  }
  T('accent text on bg', c('accent-text'), bg);
  T('accent text on surface', c('accent-text'), c('surface'));
  T('button label on button', c('btn-fg'), c('btn-bg'));
  T('ink on amber fill (new badge, buttons on dark)', c('accent-contrast'), c('accent'));
  T('error text on page', c('c-danger'), bg);
  T('error text on error panel', c('c-danger'), c('c-danger-bg'));

  // the inverse band: mobile menu, footer
  T('footer / menu text on inverse band', rgb(t, 'c-inv-text'), c('inv-bg'));
  T('footer / menu muted on inverse band', rgb(t, 'c-inv-muted'), c('inv-bg'));
  T('amber links on inverse band', rgb(t, 'amber'), c('inv-bg'));
  T('menu text on its chips', rgb(t, 'c-inv-text'), rgb(t, 'inv-chip'));

  // the order panel (ink in light, raised charcoal in dark)
  const panel = c('notch-ink');
  T('order panel: paper text', rgb(t, 'paper'), panel);
  T('order panel: muted text', rgb(t, 'c-inv-muted'), panel);
  T('order panel: ink on amber button', rgb(t, 'ink'), rgb(t, 'amber'));
  T('order panel: amber on panel', rgb(t, 'amber'), panel);

  // scent-family colours: cards, pills, panel headers, the notes cards
  for (const f of families) {
    const fg = f === 'woody' ? rgb(t, 'paper') : rgb(t, 'ink');
    T(`${f} card: ${f === 'woody' ? 'paper' : 'ink'} text`, fg, c(`fam-${f}`));
    // the card colour must also stand apart from the page (graphic, 3:1 is not required for a fill, 1.2 avoids a glare-free blend)
  }
  T('ink on gold', rgb(t, 'ink'), rgb(t, 'gold'));
  T('ink on sun', rgb(t, 'ink'), rgb(t, 'sun'));
  T('hover label: text on its pill', c('text'), c('surface'));

  // non-text: outlines, focus ring, pills, fields
  const line = rgb(t, 'line-strong', bg);
  T('outline on page', line, bg, 3);
  T('outline on surface', rgb(t, 'line-strong', c('surface')), c('surface'), 3);
  T('focus ring on page', c('focus'), bg, 3);
  T('focus ring on surface', c('focus'), c('surface'), 3);
  T('focus ring on inverse band', rgb(t, 'amber'), c('inv-bg'), 3);
}

process.exit(failures ? 1 : 0);
