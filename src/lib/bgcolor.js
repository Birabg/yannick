/**
 * The colour of a product photo's own backdrop, so a card or panel can extend the photo seamlessly.
 *
 * `detectBackground(buffer)` samples a ~4% strip along the edges of the picture and takes the median
 * colour (outliers ignored), plus the median of the top strip and of the bottom strip for photos with a
 * gradient backdrop or a floor shadow. Results:
 *   mode 'solid'  a clear uniform edge: colours are the photo's real background
 *   mode 'busy'   no uniform edge (high variance): a darkened, desaturated median, so it still feels related
 *   mode 'alpha'  the photo has a transparent background: no colours, the card uses the theme surface
 */
const sharp = require('sharp');

const INK = '#14110f';
const PAPER = '#fbfaf7';
const SAMPLE = 240; // longest side of the picture used for sampling
const STRIP = 0.04;
const OUTLIER = 38; // distance from the median beyond which a pixel is not "the background"
const BUSY_OUTLIERS = 0.3; // more than this share of outliers means there is no uniform edge
const BANDS = 10;
const DOMINANT = 0.25; // share of the edge one light colour must cover to count as the backdrop of a busy edge
const BUSY_SPREAD = 26; // or the remaining pixels still wander this far from the median

const hex = (c) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const parse = (h) => [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
const isHex = (v) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);

const lin = (v) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** True when paper-coloured text reads better on this colour than ink does. */
const isDark = (h) => contrast(parse(h), parse(PAPER)) > contrast(parse(h), parse(INK));
/** The text colour that passes AA on this background (ink or paper, whichever contrasts more). */
const textOn = (h) => (isDark(h) ? PAPER : INK);

const median = (list) => {
  const s = [...list].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const medianColor = (px) => [0, 1, 2].map((ch) => median(px.map((p) => p[ch])));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Median colour with outliers dropped. Returns { color, outliers (share), spread (mean distance) }. */
function robustMedian(px) {
  const first = medianColor(px);
  const kept = px.filter((p) => dist(p, first) <= OUTLIER);
  const use = kept.length ? kept : px;
  const color = medianColor(use);
  const spread = use.reduce((sum, p) => sum + dist(p, color), 0) / use.length;
  return { color, outliers: 1 - kept.length / px.length, spread };
}

function toHsl([r, g, b]) {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === rn ? ((gn - bn) / d) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}
function fromHsl([h, s, l]) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
/** A calmer, darker relative of a colour: half the saturation, 60% of the lightness. */
function muted(color) {
  const [h, s, l] = toHsl(color);
  return fromHsl([h, s * 0.5, l * 0.6]);
}

/** @returns {Promise<{mode:string,color:string,top:string,bottom:string,isDark:boolean}>} */
async function detectBackground(input) {
  const { data, info } = await sharp(input, { failOn: 'error' })
    .rotate()
    .resize({ width: SAMPLE, height: SAMPLE, fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const t = Math.max(1, Math.round(Math.min(w, h) * STRIP));
  const at = (x, y) => {
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3], y];
  };
  const strip = (x0, y0, x1, y1) => {
    const px = [];
    for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) px.push(at(x, y));
    return px;
  };
  const top = strip(0, 0, w, t);
  const bottom = strip(0, h - t, w, h);
  const sides = [...strip(0, t, t, h - t), ...strip(w - t, t, w, h - t)];
  const edge = [...top, ...bottom, ...sides];

  // A transparent backdrop: most of the edge has no pixels.
  const clear = edge.filter((p) => p[3] < 200).length / edge.length;
  if (clear > 0.5) {
    return { mode: 'alpha', color: '', top: '', bottom: '', isDark: false };
  }
  // Semi-transparent pixels sit on white, which is how the saved photo is flattened.
  const flat = (p) => {
    const a = p[3] / 255;
    return [p[0] * a + 255 * (1 - a), p[1] * a + 255 * (1 - a), p[2] * a + 255 * (1 - a)];
  };
  const all = robustMedian(edge.map(flat));
  // "Busy" is judged band by band down the picture, so a smooth vertical gradient backdrop is not mistaken
  // for noise: within one band the backdrop should be a single colour.
  const bands = Array.from({ length: BANDS }, () => []);
  for (const p of edge) bands[Math.min(BANDS - 1, Math.floor((p[4] / h) * BANDS))].push(flat(p));
  let outliers = 0;
  let spread = 0;
  for (const band of bands.filter((b) => b.length)) {
    const r = robustMedian(band);
    outliers += r.outliers * band.length;
    spread += r.spread * band.length;
  }
  let busy = outliers / edge.length > BUSY_OUTLIERS || spread / edge.length > BUSY_SPREAD;

  // Edges crossed by the bottle or its box look busy, yet the studio backdrop is often still the biggest
  // single colour on them. A large, tight, light cluster is taken as the backdrop (and used top to bottom).
  if (busy) {
    const flats = edge.map(flat);
    const groups = new Map();
    for (const px of flats) {
      const key = px.map((v) => Math.round(v / 16)).join(',');
      (groups.get(key) || groups.set(key, []).get(key)).push(px);
    }
    const best = [...groups.values()].sort((a, b) => b.length - a.length)[0];
    if (best && best.length / flats.length >= DOMINANT && luminance(medianColor(best)) > 0.6) {
      const color = hex(robustMedian(best).color);
      return { mode: 'solid', color, top: color, bottom: color, isDark: isDark(color) };
    }
  }

  let [color, topColor, bottomColor] = [
    all.color,
    robustMedian(top.map(flat)).color,
    robustMedian(bottom.map(flat)).color,
  ];
  if (busy) [color, topColor, bottomColor] = [color, topColor, bottomColor].map(muted);
  const out = {
    mode: busy ? 'busy' : 'solid',
    color: hex(color),
    top: hex(topColor),
    bottom: hex(bottomColor),
  };
  return { ...out, isDark: isDark(out.color) };
}

/**
 * The colours a page actually uses for a product: the owner's override if there is one, otherwise the
 * detected ones. A gradient is only used when the top and bottom differ noticeably.
 * Returns null when the product should sit on the theme surface (no colour, or a transparent photo).
 */
function effectiveBackground(p) {
  if (isHex(p.bgOverride)) {
    const c = p.bgOverride.toLowerCase();
    return { color: c, top: c, bottom: c, gradient: false, source: 'override' };
  }
  if (!p.image || p.bgMode === 'alpha' || !isHex(p.bgColor)) return null;
  const differ =
    isHex(p.bgTop) && isHex(p.bgBottom) && dist(parse(p.bgTop), parse(p.bgBottom)) > 14;
  return {
    color: p.bgColor,
    top: differ ? p.bgTop : p.bgColor,
    bottom: differ ? p.bgBottom : p.bgColor,
    gradient: differ,
    source: 'detected',
  };
}

module.exports = { detectBackground, effectiveBackground, isDark, textOn, isHex, INK, PAPER };
