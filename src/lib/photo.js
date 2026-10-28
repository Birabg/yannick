/**
 * How a product photo is served. Every photo, uploaded in the admin or imported from public/img,
 * is stored as `<base>-<width>.webp` in a few widths, and the product row keeps the largest
 * width and height (img_w, img_h) so every <img> can carry explicit dimensions.
 */
const { effectiveBackground, textOn } = require('./bgcolor');

const TARGET_WIDTHS = [480, 960, 1600];

/** The widths saved for a photo that is `sourceWidth` wide. Photos are never enlarged. */
function variantWidths(sourceWidth) {
  const top = Math.min(sourceWidth, TARGET_WIDTHS[TARGET_WIDTHS.length - 1]);
  return [...new Set([...TARGET_WIDTHS.filter((w) => w < top), top])];
}

const STEP = (n) => Math.min(100, Math.max(0, Math.round(n / 10) * 10));

/** Class names that place the focal point; steps of 10 keep the stylesheet small and CSP-safe. */
const focusClass = (p) => `fx-${STEP(p.focusX)} fy-${STEP(p.focusY)}`;

/**
 * Shape of a collection card's photo area, from the uploaded picture: ar-N where N is width/height x 20,
 * limited to 12..24 (0.6 to 1.2) so the grid stays tidy. Pictures outside that range get `ar-clamped`
 * and are shown whole instead of cropped.
 */
const ratioClass = (p) => {
  if (!p.imageW || !p.imageH) return 'ar-16';
  const n = Math.round((p.imageW / p.imageH) * 20);
  const c = Math.min(24, Math.max(12, n));
  return `ar-${c}` + (c !== n ? ' ar-clamped' : '');
};

/**
 * Height of a hero card as a multiple of its width, from the uploaded picture: hh-N where N is
 * height/width x 20, limited to 20..34 (1.0 to 1.7). Pictures outside that range get `hh-clamped`.
 */
const heightClass = (p) => {
  if (!p.imageW || !p.imageH) return 'hh-30';
  const n = Math.round((p.imageH / p.imageW) * 20);
  const c = Math.min(34, Math.max(20, n));
  return `hh-${c}` + (c !== n ? ' hh-clamped' : '');
};

/** Legacy uploads (before widths were recorded) used -sm and -lg files at 480 and 1000px. */
const isLegacy = (p) => !p.imageW;

function widthsOf(p) {
  return isLegacy(p) ? [480, 1000] : variantWidths(p.imageW);
}

const file = (p, w) =>
  `/uploads/products/${p.image}-${isLegacy(p) ? (w === 480 ? 'sm' : 'lg') : w}.webp`;

/** URL of a photo: 'sm' is the smallest width, 'lg' the largest, or pass a width in px. */
function photoUrl(p, variant = 'lg') {
  const widths = widthsOf(p);
  const w =
    variant === 'sm'
      ? widths[0]
      : variant === 'lg'
        ? widths[widths.length - 1]
        : widths.find((x) => x >= variant) || widths[widths.length - 1];
  return file(p, w);
}

const srcset = (p) =>
  widthsOf(p)
    .map((w) => `${file(p, w)} ${w}w`)
    .join(', ');

/** Width and height attributes for the file `photoUrl(p, variant)` points at. */
function photoSize(p, variant = 'lg') {
  const widths = widthsOf(p);
  const w =
    variant === 'sm'
      ? widths[0]
      : variant === 'lg'
        ? widths[widths.length - 1]
        : widths.find((x) => x >= variant) || widths[widths.length - 1];
  if (isLegacy(p)) return { width: w, height: Math.round(w * 1.25) };
  return { width: w, height: Math.round((w * p.imageH) / p.imageW) };
}

/**
 * The backdrop behind a product photo is the photo's own colour (see bgcolor.js). The page cannot carry
 * style attributes (strict CSP), so every product gets a class, `bgc-<id>`, and one <style> block in the
 * page head defines its custom properties. A product without a photo, or with a transparent one, sits on
 * the theme surface instead.
 */
const bgClass = (p) => (p.image ? `bgc-${p.id}` : '');
const isAlpha = (p) => !!p.image && p.bgMode === 'alpha' && !effectiveBackground(p);

function bgCss(list) {
  return list
    .filter((p) => p.image)
    .map((p) => {
      const bg = effectiveBackground(p);
      const vars = bg
        ? [
            ['--card-bg', bg.color],
            ['--card-bg-top', bg.top],
            ['--card-bg-bottom', bg.bottom],
            ['--card-fg', textOn(bg.color)],
            ['--card-fg-top', textOn(bg.top)],
            ['--card-fg-bottom', textOn(bg.bottom)],
          ]
        : [
            ['--card-bg', 'var(--c-surface)'],
            ['--card-bg-top', 'var(--c-surface)'],
            ['--card-bg-bottom', 'var(--c-surface)'],
            ['--card-fg', 'var(--c-text)'],
            ['--card-fg-top', 'var(--c-text)'],
            ['--card-fg-bottom', 'var(--c-text)'],
          ];
      return `.bgc-${Number(p.id)}{${vars.map(([k, v]) => `${k}:${v}`).join(';')}}`;
    })
    .join('');
}

/** The top colour and its text colour, for the panel header (a theme colour when there is none). */
const bgTop = (p) => effectiveBackground(p)?.top || '';
const bgFgTop = (p) => {
  const bg = effectiveBackground(p);
  return bg ? textOn(bg.top) : '';
};

module.exports = {
  bgClass,
  bgCss,
  bgTop,
  bgFgTop,
  isAlpha,
  TARGET_WIDTHS,
  variantWidths,
  focusClass,
  ratioClass,
  heightClass,
  photoUrl,
  photoSize,
  srcset,
  widthsOf,
};
