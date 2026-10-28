/**
 * Reads data/prices.csv and updates the database.
 *   npm run import-prices              apply the sheet
 *   npm run import-prices -- --dry     show what would change
 *   npm run import-prices -- --force   also replace prices that were typed by hand in the admin
 *
 * Columns: id, brand, name, size, concentration, price_etb, sale_price_etb, in_stock, notes.
 * Empty cells are skipped. Prices must be whole numbers of ETB (45000 or 45,000); a bad cell is reported and
 * that row is left alone. A price set by hand in the admin is kept unless --force is given.
 */
const fs = require('node:fs');
const { db, ready, products } = require('../src/db');
const { parseCsv, cellNumber, normalise, matchProducts } = require('../src/lib/priceimport');
const { writeReport, SHEET } = require('./price-files');

const force = process.argv.includes('--force');
const dry = process.argv.includes('--dry');

async function main() {
  await ready();
  if (!fs.existsSync(SHEET)) {
    console.error('data/prices.csv not found. Run `npm run live-prices` first to create it.');
    process.exit(1);
  }
  const rows = parseCsv(fs.readFileSync(SHEET, 'utf8'));
  const all = await products.list();
  const log = { updated: [], skipped: [], errors: [] };

  for (const [n, row] of rows.entries()) {
    const line = n + 2;
    const product =
      all.find((p) => String(p.id) === row.id) ||
      all.find(
        (p) =>
          normalise(p.brand) === normalise(row.brand) && normalise(p.name) === normalise(row.name)
      );
    if (!product) {
      log.errors.push(
        `line ${line}: no perfume with id ${row.id || '?'} (${row.brand} ${row.name})`
      );
      continue;
    }
    const label = `${product.brand} ${product.name}`;
    const price = cellNumber(row.price_etb);
    const sale = cellNumber(row.sale_price_etb);
    if (price === null) {
      log.errors.push(
        `line ${line}: ${label}: price_etb "${row.price_etb}" is not a whole number of ETB`
      );
      continue;
    }
    if (sale === null) {
      log.errors.push(
        `line ${line}: ${label}: sale_price_etb "${row.sale_price_etb}" is not a whole number of ETB`
      );
      continue;
    }
    const nextPrice = price ?? product.price;
    if (sale !== undefined && !(sale < nextPrice)) {
      log.errors.push(`line ${line}: ${label}: the sale price must be lower than the price`);
      continue;
    }
    const stock = row.in_stock === '' ? undefined : { 1: true, 0: false }[row.in_stock];
    if (row.in_stock !== '' && stock === undefined) {
      log.errors.push(`line ${line}: ${label}: in_stock must be 1, 0 or empty`);
      continue;
    }

    const touchesPrice = price !== undefined || sale !== undefined;
    const nextSale = sale ?? product.salePrice;
    const changesPrice = nextPrice !== product.price || nextSale !== product.salePrice;
    if (touchesPrice && changesPrice) {
      if (product.priceSource === 'manual' && product.price > 0 && !force) {
        log.skipped.push(`${label}: kept the price set in the admin (use --force to replace it)`);
      } else {
        log.updated.push(`${label}: ${nextPrice}${nextSale ? ` (sale ${nextSale})` : ''}`);
        if (!dry) {
          await products.setPrice(product.id, {
            price: nextPrice,
            sale_price: nextSale,
            price_visible: product.priceVisible,
            source: 'csv',
          });
        }
      }
    }

    if (!dry) {
      if (stock !== undefined && stock !== product.inStock) {
        await db.run('UPDATE products SET in_stock = ? WHERE id = ?', [stock ? 1 : 0, product.id]);
      }
      // Size and concentration only fill an empty field, unless --force.
      const size = row.size && (force || !product.size) ? row.size : product.size;
      const conc =
        row.concentration && (force || !product.concentration)
          ? row.concentration
          : product.concentration;
      if (size !== product.size || conc !== product.concentration) {
        await db.run('UPDATE products SET size = ?, concentration = ? WHERE id = ?', [
          size,
          conc,
          product.id,
        ]);
      }
    }
  }

  console.log(`${dry ? 'Would update' : 'Updated'}: ${log.updated.length}`);
  log.updated.forEach((l) => console.log('  +', l));
  console.log(`Skipped: ${log.skipped.length}`);
  log.skipped.forEach((l) => console.log('  -', l));
  console.log(`Problems: ${log.errors.length}`);
  log.errors.forEach((l) => console.log('  !', l));
  if (!dry) {
    const fresh = await products.list();
    writeReport(fresh, matchProducts(fresh, []), 0);
  }
  if (log.errors.length) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.close());
