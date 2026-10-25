/**
 * Turns the photos in public/img/originals into products, using the same pipeline as the admin upload:
 * WebP in up to three widths, aspect ratio kept, metadata stripped, width and height recorded.
 *
 *   node scripts/import-images.js                    add or refresh the photos listed in photo-catalog.js
 *   node scripts/import-images.js --replace-samples  also remove the placeholder SAMPLE products
 *   node scripts/import-images.js --reset            remove earlier imports first, so catalog changes (fit, focus, colour) apply
 *                                                     (this discards any edits you made to those imported products)
 *
 * Safe to re-run: a product that already exists only gets its photo refreshed, so anything you
 * edited in /admin (prices, sizes, notes, focus point) is kept. The originals are never touched.
 */
const fs = require('node:fs');
const path = require('node:path');
const { db, products } = require('../src/db');
const crypto = require('node:crypto');
const { saveProductImage, removeProductImage, PIPELINE_VERSION } = require('../src/lib/images');
const { slugify, slugSource } = require('../src/lib/format');
const catalog = require('./photo-catalog');

const ORIGINALS = path.join(__dirname, '../public/img/originals');
const replaceSamples = process.argv.includes('--replace-samples');
const reset = process.argv.includes('--reset');

async function main() {
  if (replaceSamples) {
    for (const row of db.prepare('SELECT id, image FROM products WHERE is_sample = 1').all()) {
      products.remove(row.id);
      await removeProductImage(row.image);
    }
  }

  if (reset) {
    for (const row of db
      .prepare("SELECT id, image FROM products WHERE image LIKE 'photo-%'")
      .all()) {
      products.remove(row.id);
      await removeProductImage(row.image);
    }
  }

  // New products go to the top of the shelf, so add them last-to-first to keep the catalog order.
  const added = [];
  for (const item of [...catalog].reverse()) {
    const source = path.join(ORIGINALS, item.file);
    if (!fs.existsSync(source)) {
      console.warn(`Missing original, skipped: ${item.file}`);
      continue;
    }
    const bytes = fs.readFileSync(source);
    // The name carries a short hash of the photo and the pipeline version, so a changed photo never hits a cached file.
    const hash = crypto
      .createHash('sha1')
      .update(bytes)
      .update(String(PIPELINE_VERSION))
      .digest('hex')
      .slice(0, 6);
    const base = `photo-${item.key}-${hash}`;
    const shot = await saveProductImage(bytes, { base });
    const photo = {
      image: base,
      img_w: shot.width,
      img_h: shot.height,
      cutout: shot.cutout ? 1 : 0,
    };
    const slug = slugify(slugSource({ brand: item.brand, name: item.name, size: '' }));
    const existing = products.getBySlug(slug);
    if (existing) {
      if (existing.image !== base) await removeProductImage(existing.image);
      db.prepare(
        'UPDATE products SET image=@image, img_w=@img_w, img_h=@img_h, cutout=@cutout WHERE id=@id'
      ).run({
        ...photo,
        id: existing.id,
      });
      continue;
    }
    products.create({
      slug,
      name: item.name,
      brand: item.brand,
      price: 0,
      size: '',
      concentration: '',
      category: item.category,
      collections: JSON.stringify(item.category === 'unisex' ? ['men', 'women'] : [item.category]),
      family: '',
      longevity: 0, // not rated until the owner sets it: no invented performance figures
      projection: 0,
      description: '',
      top_notes: '',
      heart_notes: '',
      base_notes: '',
      badges: item.hero ? 'featured' : '',
      ...photo,
      img_alt: item.alt,
      focus_x: item.fx,
      focus_y: item.fy,
      fit: item.fit,
      tint: item.tint,
      in_stock: 1,
      is_sample: 0,
    });
    added.push(item.name);
  }
  console.log(
    `Imported ${catalog.length} photos; ${added.length} new products: ${added.reverse().join(', ') || 'none'}.`
  );
  console.log(
    'Open /admin: each new product is flagged "needs details" until its price, size and concentration are set.'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
