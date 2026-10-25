const site = require('../../config/site');

const COLLECTION_KEYS = site.collections
  .map((c) => c.key)
  .filter((k) => k !== 'men' && k !== 'women');
const CATEGORY_KEYS = site.categories.map((c) => c.key);
const BADGE_KEYS = site.badges.map((b) => b.key);

const str = (v, max) =>
  String(v ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
const multiline = (v, max) =>
  String(v ?? '')
    .replace(/\r/g, '')
    .trim()
    .slice(0, max);
const asArray = (v) => (Array.isArray(v) ? v : v === undefined ? [] : [v]);
const tags = (v) =>
  [
    ...new Set(
      String(v ?? '')
        .split(',')
        .map((t) => str(t, 40))
        .filter(Boolean)
    ),
  ]
    .slice(0, 12)
    .join(', ');

/** Returns { value, errors }. `value` is ready for products.create / products.update. */
function parseProduct(body) {
  const errors = [];
  const name = str(body.name, 80);
  const brand = str(body.brand, 60);
  const size = str(body.size, 20);
  const price = Number.parseInt(String(body.price ?? '').replace(/[^\d]/g, ''), 10);
  const category = CATEGORY_KEYS.includes(body.category) ? body.category : '';
  const rating = (v) => Math.min(5, Math.max(1, Number.parseInt(v, 10) || 3));

  if (!name) errors.push('Name is required.');
  if (!brand) errors.push('Brand is required.');
  if (!size) errors.push('Size is required (for example 100ml).');
  if (!Number.isInteger(price) || price <= 0 || price > 10_000_000) {
    errors.push('Enter a valid price in ETB.');
  }
  if (!category) errors.push('Choose a category.');

  // The Men / Women shelves follow the category automatically.
  const collections = asArray(body.collections).filter((c) => COLLECTION_KEYS.includes(c));
  if (category === 'men' || category === 'unisex') collections.unshift('men');
  if (category === 'women' || category === 'unisex') collections.unshift('women');

  return {
    errors,
    value: {
      name,
      brand,
      size,
      price,
      category,
      concentration: str(body.concentration, 40),
      collections: JSON.stringify([...new Set(collections)]),
      family: str(body.family, 60),
      longevity: rating(body.longevity),
      projection: rating(body.projection),
      description: multiline(body.description, 1200),
      top_notes: tags(body.top_notes),
      heart_notes: tags(body.heart_notes),
      base_notes: tags(body.base_notes),
      badges: asArray(body.badges)
        .filter((b) => BADGE_KEYS.includes(b))
        .join(','),
      in_stock: body.in_stock === '0' ? 0 : 1,
      is_sample: body.is_sample === 'on' ? 1 : 0,
    },
  };
}

function parseReview(body) {
  const errors = [];
  const name = str(body.name, 60);
  const text = multiline(body.text, 600);
  const rating = Number.parseInt(body.rating, 10);
  if (!name) errors.push('Customer name is required.');
  if (!text) errors.push('Review text is required.');
  if (!(rating >= 1 && rating <= 5)) errors.push('Rating must be between 1 and 5.');
  return { errors, value: { name, text, rating } };
}

function parsePasswordChange(body) {
  const errors = [];
  if (!body.current) errors.push('Enter your current password.');
  if (String(body.next || '').length < 8)
    errors.push('New password must be at least 8 characters.');
  if (body.next !== body.confirm) errors.push('New password and confirmation do not match.');
  return errors;
}

module.exports = { parseProduct, parseReview, parsePasswordChange };
