/**
 * The hero's bottles: in-stock ones with a photo, featured first, then best sellers, then the rest of the
 * shelf, at most eight. The first five are the cards; the next three are the round thumbnails.
 */
function heroProducts(list) {
  const inStock = list.filter((p) => p.inStock);
  const withPhoto = inStock.filter((p) => p.image);
  const pool = withPhoto.length >= 3 ? withPhoto : inStock;
  const featured = (p) => p.badges.includes('featured');
  const loved = (p) => p.badges.includes('bestseller');
  return [
    ...pool.filter(featured),
    ...pool.filter((p) => !featured(p) && loved(p)),
    ...pool.filter((p) => !featured(p) && !loved(p)),
  ].slice(0, 8);
}

module.exports = { heroProducts };
