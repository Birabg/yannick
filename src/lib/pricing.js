/**
 * What a perfume costs, and how that is shown.
 *
 * A price is a whole number of ETB; 0 means "not set yet" and the site says "Ask for price". Nothing here
 * invents or estimates a price. A perfume has either one price (`price`, optional `salePrice`) or several
 * sizes (`variants`, each with its own price). `priceVisible = false` hides the figures on the public site.
 */
const site = require('../../config/site');

const format = (n) => `${site.currency} ${Number(n).toLocaleString('en-US')}`;
/** Amharic reads the number first: "15,000 ብር". */
const formatAm = (n) => `${Number(n).toLocaleString('en-US')} ብር`;

/** The price someone pays: the sale price when it is lower than the regular one. */
const effective = (price, sale) => (sale > 0 && price > 0 && sale < price ? sale : price);

/** Sizes that can be priced: only variants with a price count. */
const pricedVariants = (p) => (p.variants || []).filter((v) => v.price > 0);

/**
 * { kind, now, was, from } for a product.
 *   ask     no price yet, or the owner hid it
 *   single  one price
 *   sale    one price with a lower sale price (`was` is the regular one)
 *   from    several sizes: `now` is the lowest price
 */
function priceState(p) {
  if (!p.priceVisible) return { kind: 'ask', now: 0, was: 0 };
  const sizes = pricedVariants(p);
  if (sizes.length >= 2) {
    const prices = sizes.map((v) => effective(v.price, v.salePrice));
    return {
      kind: 'from',
      now: Math.min(...prices),
      was: 0,
      onSale: sizes.some((v) => effective(v.price, v.salePrice) < v.price),
    };
  }
  const only = sizes[0];
  const price = only ? only.price : p.price;
  const sale = only ? only.salePrice : p.salePrice;
  if (!(price > 0)) return { kind: 'ask', now: 0, was: 0 };
  const now = effective(price, sale);
  return now < price ? { kind: 'sale', now, was: price } : { kind: 'single', now: price, was: 0 };
}

/** Number used to sort and filter: the price someone pays, or 0 when there is none to show. */
const sortPrice = (p) => priceState(p).now;
const hasSale = (p) => {
  const s = priceState(p);
  return s.kind === 'sale' || !!s.onSale;
};

/** One line of text for places that cannot show markup (alt text, WhatsApp, meta tags). */
function priceText(p) {
  const s = priceState(p);
  if (s.kind === 'ask') return 'Ask for price';
  return s.kind === 'from' ? `From ${format(s.now)}` : format(s.now);
}
function priceTextAm(p) {
  const s = priceState(p);
  if (s.kind === 'ask') return '';
  return s.kind === 'from' ? `ከ ${formatAm(s.now)}` : formatAm(s.now);
}

/** The size chips of the panel: every priced size, or none for a single-size perfume. */
function sizeOptions(p) {
  const sizes = pricedVariants(p);
  if (sizes.length < 2) return [];
  return sizes.map((v) => {
    const now = effective(v.price, v.salePrice);
    return {
      id: v.id,
      label: `${v.sizeMl}ml`,
      sizeMl: v.sizeMl,
      now,
      was: now < v.price ? v.price : 0,
      inStock: v.inStock,
    };
  });
}

/**
 * "Affordable" follows the real price, not a tick box: a perfume with a price below `affordableBelow`
 * (config/site.js) is in the section, one without a price never is.
 */
function withAffordable(list) {
  return list.map((p) => {
    const now = sortPrice(p);
    const rest = p.collections.filter((c) => c !== 'affordable');
    return {
      ...p,
      collections: now > 0 && now < site.affordableBelow ? [...rest, 'affordable'] : rest,
    };
  });
}

module.exports = {
  withAffordable,
  format,
  formatAm,
  effective,
  priceState,
  sortPrice,
  hasSale,
  priceText,
  priceTextAm,
  sizeOptions,
  pricedVariants,
};
