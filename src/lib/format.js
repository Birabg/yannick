const site = require('../../config/site');

const ABBREVIATIONS = {
  'Eau de Parfum': 'EDP',
  'Eau de Toilette': 'EDT',
  'Eau de Cologne': 'EDC',
};

const price = (n) => `${site.currency} ${Number(n).toLocaleString('en-US')}`;

const abbreviate = (concentration) => ABBREVIATIONS[concentration] || concentration;

const brandPrefix = (p) => (p.name.toLowerCase().includes(p.brand.toLowerCase()) ? '' : p.brand);

/** "Bleu de Chanel EDP 100ml"; the brand is prefixed only when the name lacks it. */
const productLabel = (p) =>
  [brandPrefix(p), p.name, abbreviate(p.concentration), p.size].filter(Boolean).join(' ');

/** Text a product URL slug is built from, e.g. "bleu-de-chanel-100ml". */
const slugSource = (p) => [brandPrefix(p), p.name, p.size].filter(Boolean).join(' ');

/** The scent family that colours a product: fresh, woody, oriental, or none. */
const famKey = (p) =>
  ['fresh', 'woody', 'oriental'].find((k) => p.collections.includes(k)) || 'none';

const waLink = (text) => `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(text)}`;

const orderLink = (p) =>
  waLink(
    p.inStock
      ? `Hello Yannick Scents, I'd like to order ${productLabel(p)} (${price(p.price)}).`
      : `Hello Yannick Scents, could you tell me when ${productLabel(p)} will be back in stock?`
  );

const genericLink = () =>
  waLink("Hello Yannick Scents, I'd like to order a perfume. Can you help me choose?");

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

module.exports = {
  price,
  abbreviate,
  productLabel,
  slugSource,
  famKey,
  waLink,
  orderLink,
  genericLink,
  slugify,
};
