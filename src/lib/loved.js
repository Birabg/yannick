/**
 * "Most Loved Right Now": the bottles the owner ticked Best Seller (in the owner's order), topped up from the
 * featured bottles and then the newest in-stock ones, never twice, so the row is at least four when the shelf has four.
 * Shown as 8 or 4 (two full rows or one) so a grid never ends in a half-empty row; fewer than four are shown as they are.
 */
const MIN = 4;
const MAX = 8;

function pick(list) {
  const best = list
    .filter((p) => p.badges.includes('bestseller'))
    .sort((a, b) => (a.bestOrder || 999) - (b.bestOrder || 999));
  const featured = list.filter((p) => p.inStock && p.badges.includes('featured'));
  const newest = list.filter((p) => p.inStock).sort((a, b) => b.id - a.id);

  const picks = [];
  const add = (pool, limit) => {
    for (const p of pool) {
      if (picks.length >= limit) return;
      if (!picks.includes(p)) picks.push(p);
    }
  };
  add(best, MAX);
  const target = Math.min(MIN, list.length);
  add(featured, target);
  add(newest, target);

  const shown = picks.length >= MAX ? MAX : picks.length >= MIN ? MIN : picks.length;
  return picks.slice(0, shown);
}

module.exports = { pick };
