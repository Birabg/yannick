const site = require('../../config/site');

const haystack = (p) =>
  [p.family, p.collections, p.notes.top, p.notes.heart, p.notes.base]
    .flat()
    .join(' ')
    .toLowerCase();

function score(p, mood) {
  const text = haystack(p);
  let s = 0;
  mood.collections.forEach((c) => {
    if (p.collections.includes(c)) s += 3;
  });
  mood.keywords.forEach((k) => {
    if (text.includes(k)) s += 2;
  });
  // A night out wants a bottle that lasts and is noticed, but only once something else matches.
  if (mood.key === 'night' && s > 0) s += p.longevity + p.projection;
  return s;
}

/** Three in-stock bottles per mood, from the shelf. Bottles already picked for another mood rank lower. */
function moodPicks(list) {
  const stock = list.filter((p) => p.inStock);
  const pool = stock.length ? stock : list;
  const used = new Map();
  return site.moods.map((mood) => {
    const picks = pool
      .map((p, n) => ({ p, n, s: score(p, mood) - 3 * (used.get(p.slug) || 0) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.n - b.n)
      .slice(0, 3)
      .map((x) => x.p);
    picks.forEach((p) => used.set(p.slug, (used.get(p.slug) || 0) + 1));
    return { ...mood, picks };
  });
}

module.exports = { moodPicks };
