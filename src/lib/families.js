/**
 * Scent families for the home accordion and /families/<key>: each configured family with the
 * bottles tagged with its collection key, a photo to show, and the notes found across them.
 */
const { families } = require('../../config/families');

const NOTE_LIMIT = 6;

/** The bottle whose photo fronts a family: a cut-out first (it sits cleanly on the colour), then featured, then any photo. */
function pickCover(list) {
  const withPhoto = list.filter((p) => p.image);
  const rank = (p) => (p.cutW > 0 ? 0 : 2) + (p.badges.includes('featured') ? 0 : 1);
  return [...withPhoto].sort((a, b) => rank(a) - rank(b))[0] || null;
}

/** Most common notes first, so the strongest threads of the family lead. */
function topNotes(list, field) {
  const count = new Map();
  list.forEach((p) => (p.notes[field] || []).forEach((n) => count.set(n, (count.get(n) || 0) + 1)));
  return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, NOTE_LIMIT).map(([n]) => n);
}

function buildFamilies(allProducts) {
  return families.map((f) => {
    const list = allProducts.filter((p) => p.collections.includes(f.key));
    return {
      key: f.key,
      products: list,
      cover: pickCover(list),
      notes: { top: topNotes(list, 'top'), heart: topNotes(list, 'heart'), base: topNotes(list, 'base') },
    };
  });
}

/** Families that have at least one bottle, in the configured order. */
const available = (allProducts) => buildFamilies(allProducts).filter((f) => f.products.length);

const find = (allProducts, key) => buildFamilies(allProducts).find((f) => f.key === key) || null;

module.exports = { available, find };
