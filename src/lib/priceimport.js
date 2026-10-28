/**
 * Helpers shared by the price scripts: reading the old website's data, matching its perfumes to ours,
 * and reading / writing data/prices.csv. Nothing here guesses a price: a figure is only used when it is
 * one clear number, and a match is only trusted when brand and name agree.
 */
const site = require('../../config/site');

const strip = (s) =>
  String(s ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** "Ombré Nomade" and "Ombre  Nomade!" compare equal. */
const normalise = (s) =>
  strip(s)
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** The name without its concentration words, so "Eros" and "Eros Eau de Parfum" share a base. */
const baseName = (s) =>
  normalise(s)
    .replace(/\b(eau de parfum|eau de toilette|le parfum|extrait de parfum|edp|edt|parfum)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * "ETB 45,000" -> { etb: 45000 }; "ETB 8,000 – 10,000" -> { range: [8000, 10000] };
 * "Price on request" or nothing -> {}. A range is never turned into one price.
 */
function parseLivePrice(raw) {
  const nums = [...String(raw ?? '').matchAll(/\d[\d,]*/g)]
    .map((m) => Number(m[0].replace(/,/g, '')))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (nums.length === 1) return { etb: nums[0] };
  if (nums.length > 1) return { range: [Math.min(...nums), Math.max(...nums)] };
  return {};
}

/** "100 ml" -> "100ml" (how sizes are written on this site). */
const tidySize = (s) =>
  String(s ?? '')
    .replace(/\s+/g, '')
    .toLowerCase();

/** The concentration as this site names it, or '' when the old site's wording has no equal here. */
function tidyConcentration(c) {
  const text = String(c ?? '').trim();
  if (site.concentrations.includes(text)) return text;
  return ['extrait de parfum', 'extract de parfum'].includes(text.toLowerCase()) ? 'Extrait' : '';
}

/**
 * Matches our products to the old site's perfumes.
 *   exact      same brand and same name (accents, case and spacing ignored)
 *   uncertain  same brand and the same name apart from the concentration words, or one name inside the other
 *   none       nothing to go on
 * Returns [{ product, status, live, candidates }].
 */
function matchProducts(ours, live) {
  return ours.map((product) => {
    const brand = normalise(product.brand);
    const sameBrand = live.filter((l) => normalise(l.brand) === brand);
    const name = normalise(product.name);
    const exact = sameBrand.filter((l) => normalise(l.name) === name);
    if (exact.length === 1) return { product, status: 'exact', live: exact[0], candidates: [] };
    const base = baseName(product.name);
    const near = sameBrand.filter((l) => {
      const other = baseName(l.name);
      return other === base || (base.length > 3 && other.startsWith(`${base} `));
    });
    if (near.length) return { product, status: 'uncertain', live: null, candidates: near };
    return { product, status: 'none', live: null, candidates: [] };
  });
}

/* ---------------- CSV ---------------- */

const COLUMNS = [
  'id',
  'brand',
  'name',
  'size',
  'concentration',
  'price_etb',
  'sale_price_etb',
  'in_stock',
  'notes',
];

const quote = (v) => {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const toCsv = (rows) =>
  `${[COLUMNS.join(','), ...rows.map((r) => COLUMNS.map((c) => quote(r[c])).join(','))].join('\r\n')}\r\n`;

/** Minimal CSV reader: quoted fields, doubled quotes, CRLF or LF. Returns an array of objects by header. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c !== '')) rows.push(row);
  const [header, ...body] = rows;
  if (!header) return [];
  const names = header.map((h) => h.trim().toLowerCase());
  return body.map((cells) => Object.fromEntries(names.map((n, i) => [n, (cells[i] ?? '').trim()])));
}

/** A whole number of ETB from a cell ("45,000", "45000", "ETB 45,000"), or null when it is not one. */
function cellNumber(v) {
  const text = String(v ?? '').trim();
  if (!text) return undefined; // empty: skip
  if (!/^(ETB\s*)?\d[\d,]*$/i.test(text)) return null;
  const n = Number(text.replace(/[^\d]/g, ''));
  return n > 0 && n <= 10_000_000 ? n : null;
}

module.exports = {
  normalise,
  baseName,
  parseLivePrice,
  tidySize,
  tidyConcentration,
  matchProducts,
  COLUMNS,
  toCsv,
  parseCsv,
  cellNumber,
};
