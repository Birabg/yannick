const site = require('../../config/site');
const { TINTS } = require('./format');

const COLLECTION_KEYS = site.collections
  .map((c) => c.key)
  .filter((k) => k !== 'men' && k !== 'women' && k !== 'affordable');
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

const MAX_VARIANTS = 6;

/** "45000", "45,000" or "ETB 45,000" are numbers; anything else with text in it is not. */
const isMoney = (v) => /^(ETB\s*)?\d[\d,\s]*$/i.test(String(v ?? '').trim());

/** Extra sizes from the form (variant_size_0, variant_price_0, variant_sale_0, variant_stock_0 ...). */
function parseVariants(body, bad) {
  const out = [];
  const whole = (v) => {
    const digits = String(v ?? '').replace(/[^\d]/g, '');
    return digits ? Number.parseInt(digits, 10) : 0;
  };
  for (let n = 0; n < MAX_VARIANTS; n += 1) {
    const size = whole(body[`variant_size_${n}`]);
    const price = whole(body[`variant_price_${n}`]);
    const sale = whole(body[`variant_sale_${n}`]);
    for (const key of ['price', 'sale']) {
      const raw = String(body[`variant_${key}_${n}`] ?? '').trim();
      if (raw && !isMoney(raw))
        bad(`variant_${key}_${n}`, `Size ${n + 1}: ${raw} is not a price in ETB.`);
    }
    if (!size && !price && !sale) continue;
    const row = `Size ${n + 1}`;
    if (!(size > 0 && size <= 5000)) bad(`variant_size_${n}`, `${row}: enter the size in ml.`);
    else if (!(price > 0 && price <= 10_000_000))
      bad(`variant_price_${n}`, `${row}: enter its price in ETB.`);
    else if (sale && sale >= price)
      bad(`variant_sale_${n}`, `${row}: the sale price must be lower than its price.`);
    else if (out.some((v) => v.size_ml === size))
      bad(`variant_size_${n}`, `${row}: ${size}ml is listed twice.`);
    else {
      out.push({
        size_ml: size,
        price,
        sale_price: sale,
        in_stock: body[`variant_stock_${n}`] === 'on' || body[`variant_stock_${n}`] === '1' ? 1 : 0,
      });
    }
  }
  return out.sort((a, b) => a.size_ml - b.size_ml);
}

/** Returns { value, errors }. `value` is ready for products.create / products.update. */
function parseProduct(body) {
  const errors = [];
  const fields = {};
  const bad = (field, message) => {
    errors.push(message);
    fields[field] = message;
  };
  const name = str(body.name, 80);
  const brand = str(body.brand, 60);
  const size = str(body.size, 20);
  const price = Number.parseInt(String(body.price ?? '').replace(/[^\d]/g, ''), 10);
  const category = CATEGORY_KEYS.includes(body.category) ? body.category : '';
  const rating = (v) => Math.min(5, Math.max(0, Number.parseInt(v, 10) || 0));

  if (!name) bad('name', 'Name is required.');
  if (!brand) bad('brand', 'Brand is required.');
  // Price and size may stay empty until the owner confirms them; the card then says "Ask for price".
  if (String(body.price ?? '').trim() && (!isMoney(body.price) || price > 10_000_000)) {
    bad('price', 'Enter a valid price in ETB, or leave it empty.');
  }
  // Sale price: optional, a whole number below the regular price.
  const rawSale = String(body.sale_price ?? '').replace(/[^\d]/g, '');
  const salePrice = rawSale ? Number.parseInt(rawSale, 10) : 0;
  if (
    String(body.sale_price ?? '').trim() &&
    (!isMoney(body.sale_price) || !(salePrice > 0) || salePrice > 10_000_000)
  ) {
    bad('sale_price', 'Enter a valid sale price in ETB, or leave it empty.');
  } else if (salePrice > 0 && !(price > 0)) {
    bad('sale_price', 'Set the regular price before adding a sale price.');
  } else if (salePrice > 0 && salePrice >= price) {
    bad('sale_price', 'The sale price must be lower than the regular price.');
  }
  const variants = parseVariants(body, bad);
  const step = (v) =>
    Math.min(100, Math.max(0, Math.round((Number.parseInt(v, 10) || 50) / 10) * 10));
  if (!category) bad('category', 'Choose a category.');

  // The Men / Women shelves follow the category automatically.
  const collections = asArray(body.collections).filter((c) => COLLECTION_KEYS.includes(c));
  if (category === 'men' || category === 'unisex') collections.unshift('men');
  if (category === 'women' || category === 'unisex') collections.unshift('women');

  const description = multiline(body.description, 1200);

  return {
    errors,
    fields,
    value: {
      name,
      brand,
      size,
      price: Number.isInteger(price) ? price : 0,
      sale_price: salePrice > 0 && salePrice < price ? salePrice : 0,
      price_visible: body.price_hidden === 'on' ? 0 : 1,
      category,
      concentration: str(body.concentration, 40),
      collections: JSON.stringify([...new Set(collections)]),
      family: str(body.family, 60),
      longevity: rating(body.longevity),
      projection: rating(body.projection),
      description: description,
      description_en: description,
      description_am: multiline(body.description_am, 1200),
      tagline_en: str(body.tagline_en, 60),
      tagline_am: str(body.tagline_am, 80),
      meta_description: str(body.meta_description, 155),
      best_order: Math.min(999, Math.max(0, Number.parseInt(body.best_order, 10) || 0)),
      am_reviewed: body.am_reviewed === 'on' ? 1 : 0,
      top_notes: tags(body.top_notes),
      heart_notes: tags(body.heart_notes),
      base_notes: tags(body.base_notes),
      badges: asArray(body.badges)
        .filter((b) => BADGE_KEYS.includes(b))
        .join(','),
      img_alt: str(body.img_alt, 140),
      focus_x: step(body.focus_x),
      focus_y: step(body.focus_y),
      fit: body.fit === 'contain' ? 'contain' : 'cover',
      tint: TINTS.includes(body.tint) ? body.tint : '',
      bg_override:
        body.bg_override_on && /^#[0-9a-f]{6}$/i.test(body.bg_override || '')
          ? body.bg_override.toLowerCase()
          : '',
      needs_details: body.needs_details === 'on' ? 1 : 0,
      in_stock: body.in_stock === '0' ? 0 : 1,
      is_sample: body.is_sample === 'on' ? 1 : 0,
    },
    variants,
  };
}

function parseReview(body) {
  const errors = [];
  const fields = {};
  const bad = (field, message) => {
    errors.push(message);
    fields[field] = message;
  };
  const name = str(body.name, 60);
  const text = multiline(body.text, 600);
  const rating = Number.parseInt(body.rating, 10);
  if (!name) bad('name', 'Customer name is required.');
  if (!text) bad('text', 'Review text is required.');
  if (!(rating >= 1 && rating <= 5)) errors.push('Rating must be between 1 and 5.');
  return { errors, fields, value: { name, text, rating } };
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
