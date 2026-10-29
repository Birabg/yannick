const { seed, palette, fallback } = require('../../config/houses');

/** "Louis Vuitton" -> "louis-vuitton"; also the value of ?brand= on the home page. */
const slugify = (name) =>
  String(name)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * The houses for the marquee: the seed list plus every brand on the shelf (matched case-insensitively),
 * most perfumes first. Counts are live, never typed in.
 */
function build(products) {
  const byKey = new Map();
  const add = (name) => {
    const key = name.trim().toLowerCase();
    if (!key) return null;
    if (!byKey.has(key)) byKey.set(key, { name: name.trim(), slug: slugify(name), count: 0 });
    return byKey.get(key);
  };
  seed.forEach(add);
  products.forEach((p) => {
    const house = add(p.brand || '');
    if (house) house.count += 1;
  });

  const order = [...byKey.values()];
  const list = order
    .map((h, n) => ({ h, n }))
    .sort((a, b) => b.h.count - a.h.count || a.n - b.n)
    .map(({ h }) => h);

  let spare = 0;
  list.forEach((h) => {
    if (palette[h.slug]) {
      h.theme = h.slug;
      h.colors = palette[h.slug];
    } else {
      const n = spare++ % fallback.length;
      h.theme = `x${n}`;
      h.colors = fallback[n];
    }
  });
  return list;
}

/** One rule per house: its two themes as custom properties on the card. Included in a nonce'd <style>. */
function css(houses) {
  const vars = (c, edge) =>
    `--h-a:${c[0]};--h-b:${c[1]};--h-glow:${c[2]};${edge ? `--h-edge:${edge};` : ''}`;
  const seen = new Set();
  const rules = [];
  houses.forEach((h) => {
    if (seen.has(h.theme)) return;
    seen.add(h.theme);
    const edge = (palette[h.slug] || {}).edge;
    const sel = `.house--${h.theme}`;
    rules.push(`${sel}{${vars(h.colors.light, edge)}}`);
    rules.push(`:root[data-theme='dark'] ${sel}{${vars(h.colors.dark, edge)}}`);
    rules.push(
      `@media (prefers-color-scheme:dark){:root:not([data-theme]) ${sel}{${vars(h.colors.dark, edge)}}}`
    );
  });
  return rules.join('\n');
}

module.exports = { build, css, slugify };
