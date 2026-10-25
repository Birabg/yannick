/** Hero cards: featured, in-stock bottles with a photo first, then the rest of the shelf, at most seven. */
function heroProducts(list) {
  const inStock = list.filter((p) => p.inStock);
  const withPhoto = inStock.filter((p) => p.image);
  const pool = withPhoto.length >= 3 ? withPhoto : inStock;
  return [
    ...pool.filter((p) => p.badges.includes('featured')),
    ...pool.filter((p) => !p.badges.includes('featured')),
  ].slice(0, 7);
}

module.exports = { heroProducts };
