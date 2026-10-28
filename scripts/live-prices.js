/**
 * Reads the perfumes (and their prices) from the old live website and applies the ones that match ours.
 *   npm run live-prices            fetch, save data/import/live-site-prices.json, apply sure matches, write the sheet + report
 *   npm run live-prices -- --dry   fetch and report only; nothing is written to the database
 *
 * Where the data comes from: yanickscents.com keeps its perfume list in its own data store
 * (cgi-bin/data-store.php, key yannicks_perfumes_v2), which the page loads with fetch(). This reads the same
 * public endpoint. Only an exact brand + name match is applied, and only when the old price is one clear
 * number: ranges ("ETB 8,000 – 10,000"), "Price on request" and near-matches are left for the owner.
 * A price the owner typed in the admin is never overwritten.
 */
const fs = require('node:fs');
const path = require('node:path');
const { db, ready, products } = require('../src/db');
const {
  parseLivePrice,
  tidySize,
  tidyConcentration,
  matchProducts,
} = require('../src/lib/priceimport');
const { writeSheet, writeReport } = require('./price-files');

const BASE = 'https://yanickscents.com/cgi-bin/data-store.php';
const KEY = 'yannicks_perfumes_v2';
const OUT = path.join(__dirname, '..', 'data', 'import', 'live-site-prices.json');
const dry = process.argv.includes('--dry');

async function fetchLive() {
  const get = async (key) => {
    const res = await fetch(`${BASE}?key=${encodeURIComponent(key)}`, {
      headers: { accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`${key}: HTTP ${res.status}`);
    return (await res.json()).value;
  };
  const [list, version] = await Promise.all([get(KEY), get('yannicks_perfumes_version_v1')]);
  return { perfumes: JSON.parse(list), version };
}

async function main() {
  await ready();
  const { perfumes, version } = await fetchLive();
  const live = perfumes.map((p) => ({
    id: p.id,
    brand: p.brand,
    name: p.name,
    size: p.size || '',
    concentration: p.conc || '',
    priceRaw: p.price || '',
    ...parseLivePrice(p.price),
  }));

  const ours = await products.list();
  const matches = matchProducts(ours, live);

  const applied = [];
  for (const m of matches) {
    if (m.status !== 'exact') continue;
    const { product, live: l } = m;
    if (!l.etb) {
      m.note = l.range
        ? `old site shows a range (${l.priceRaw}), not one price`
        : `old site has no price (${l.priceRaw || 'empty'})`;
      continue;
    }
    if (product.priceSource === 'manual' && product.price > 0) {
      m.note = 'kept: the price was set by hand in the admin';
      continue;
    }
    if (dry) {
      m.applied = true;
      continue;
    }
    const size = product.size || tidySize(l.size);
    const concentration = product.concentration || tidyConcentration(l.concentration);
    await db.run('UPDATE products SET size = ?, concentration = ? WHERE id = ?', [
      size,
      concentration,
      product.id,
    ]);
    await products.setPrice(product.id, {
      price: l.etb,
      sale_price: product.salePrice,
      price_visible: product.priceVisible,
      source: 'live-site',
    });
    // setPrice only stamps a changed price; a first import of the same figure still needs a date.
    if (!product.priceUpdatedAt) await products.stampPrice(product.id, 'live-site');
    m.applied = true;
    applied.push(product.name);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    `${JSON.stringify(
      {
        source: 'https://yanickscents.com/ (data store key yannicks_perfumes_v2)',
        fetchedAt: new Date().toISOString(),
        storeVersion: version,
        count: live.length,
        perfumes: live,
        matches: matches.map((m) => ({
          ourId: m.product.id,
          brand: m.product.brand,
          name: m.product.name,
          status: m.status,
          liveId: m.live?.id ?? null,
          applied: !!m.applied,
          note: m.note || '',
          candidates: m.candidates.map((c) => ({ id: c.id, name: c.name, priceRaw: c.priceRaw })),
        })),
      },
      null,
      2
    )}\n`
  );

  if (!dry) {
    const fresh = await products.list();
    writeSheet(fresh, matches);
    writeReport(fresh, matches, live.length);
  }
  const count = (s) => matches.filter((m) => m.status === s).length;
  console.log(
    `Old site: ${live.length} perfumes read. Ours: ${ours.length}. Exact matches: ${count('exact')}, uncertain: ${count('uncertain')}, no match: ${count('none')}.`
  );
  console.log(
    dry ? 'Dry run: nothing written to the database.' : `Prices imported: ${applied.length}.`
  );
  console.log(`Raw data: ${path.relative(process.cwd(), OUT)}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.close());
