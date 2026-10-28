/** Writes data/prices.csv (the sheet the owner fills in) and PRICES-REVIEW.md (what was imported, what is missing). */
const fs = require('node:fs');
const path = require('node:path');
const { toCsv } = require('../src/lib/priceimport');
const pricing = require('../src/lib/pricing');

const ROOT = path.join(__dirname, '..');
const SHEET = path.join(ROOT, 'data', 'prices.csv');
const REPORT = path.join(ROOT, 'PRICES-REVIEW.md');

const noteFor = (m) => {
  if (!m) return '';
  if (m.status === 'uncertain') {
    const names = m.candidates.map((c) => `"${c.name}" (${c.priceRaw || 'no price'})`).join(' or ');
    return `Check: the old site lists ${names}. Not applied because the name differs. Fill price_etb if it is the same perfume.`;
  }
  if (m.status === 'none') return 'Not found on the old site. Price needed.';
  return m.note || '';
};

/** Creates the sheet if it is missing; an existing sheet may hold the owner's edits, so it is kept. */
function writeSheet(list, matches, { rewrite = process.argv.includes('--rewrite-sheet') } = {}) {
  if (fs.existsSync(SHEET) && !rewrite) {
    console.log('data/prices.csv already exists, kept (use --rewrite-sheet to rebuild it).');
    return;
  }
  const byId = new Map(matches.map((m) => [m.product.id, m]));
  const rows = list.map((p) => ({
    id: p.id,
    brand: p.brand,
    name: p.name,
    size: p.size,
    concentration: p.concentration,
    price_etb: p.price > 0 ? p.price : '',
    sale_price_etb: p.salePrice > 0 ? p.salePrice : '',
    in_stock: p.inStock ? 1 : 0,
    notes: p.price > 0 ? '' : noteFor(byId.get(p.id)),
  }));
  fs.mkdirSync(path.dirname(SHEET), { recursive: true });
  fs.writeFileSync(SHEET, toCsv(rows));
  console.log(`Wrote ${path.relative(ROOT, SHEET)} (${rows.length} rows).`);
}

const sourceName = (s) => {
  if (s === 'live-site') return 'old website (yanickscents.com)';
  if (s === 'csv') return 'data/prices.csv';
  if (s === 'manual') return 'typed in the admin';
  return 'unknown';
};

const hasPrice = (p) => p.price > 0 || p.variants.some((v) => v.price > 0);

function writeReport(list, matches, liveCount) {
  const priced = list.filter(hasPrice);
  const missing = list.filter((p) => !hasPrice(p));
  const byId = new Map(matches.map((m) => [m.product.id, m]));
  const uncertain = missing.filter((p) => byId.get(p.id)?.status === 'uncertain');
  const rest = missing.filter((p) => byId.get(p.id)?.status !== 'uncertain');
  const lines = ['# Prices review', ''];
  lines.push(
    `Generated ${new Date().toISOString().slice(0, 10)}.${liveCount ? ` The old website had ${liveCount} perfumes;` : ''} this shop has ${list.length}.`,
    '',
    `- Prices in place: **${priced.length}** of ${list.length}`,
    `- Still missing a price: **${missing.length}**`,
    `- Uncertain matches to confirm: **${uncertain.length}**`,
    '',
    'No price here is a guess. Every figure below was typed in the admin, imported from the old website, or read from `data/prices.csv`. Raw data from the old website is in `data/import/live-site-prices.json`. Price ranges on the old website are never imported.',
    '',
    '## Prices in place',
    ''
  );
  if (priced.length) {
    lines.push('| Perfume | Price | Source | Updated |', '| --- | --- | --- | --- |');
    for (const p of priced) {
      const sale = p.salePrice ? ` (sale ${pricing.format(p.salePrice)})` : '';
      const shown = p.price > 0 ? pricing.format(p.price) : 'by size';
      const when = p.priceUpdatedAt ? p.priceUpdatedAt.slice(0, 10) : '';
      lines.push(
        `| ${p.brand} ${p.name} | ${shown}${sale} | ${sourceName(p.priceSource)} | ${when} |`
      );
    }
  } else lines.push('None yet.');
  lines.push('', '## Uncertain matches: please confirm', '');
  if (uncertain.length) {
    lines.push(
      'The old website has a perfume with nearly the same name, but the name differs (usually the concentration), so the price was **not** applied.',
      ''
    );
    for (const p of uncertain) {
      const m = byId.get(p.id);
      const found = m.candidates
        .map((c) => `"${c.name}" at ${c.priceRaw || 'no price'}`)
        .join(' and ');
      lines.push(
        `- **${p.brand} ${p.name}**: old site has ${found}. If it is the same bottle, enter the price in Admin > Prices.`
      );
    }
  } else lines.push('None.');
  lines.push('', '## Missing a price', '');
  if (rest.length) {
    for (const p of rest)
      lines.push(`- **${p.brand} ${p.name}**: not on the old website, price needed`);
  } else lines.push('None.');
  lines.push(
    '',
    '## How to fill the gaps',
    '',
    '1. Admin > Prices: type each price and press Save. The Missing price button shows only the gaps.',
    '2. Or fill `price_etb` in `data/prices.csv` and run `npm run import-prices` (a price typed in the admin is kept unless you add `--force`).',
    ''
  );
  fs.writeFileSync(REPORT, lines.join('\n'));
  console.log('Wrote PRICES-REVIEW.md');
}

module.exports = { writeSheet, writeReport, SHEET };
