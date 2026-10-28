/**
 * Builds the default share image (1200 x 630) from the bottle photos on the shelf: the first five
 * hero bottles on scent-coloured cards under the tagline. Run again after the shelf changes:
 *   node scripts/make-og.js
 * Once you upload your own share image in /admin/images, that one is used instead.
 */
const path = require('node:path');
const sharp = require('sharp');
const { db, ready, products } = require('../src/db');
const { heroProducts } = require('../src/lib/hero');
const { photoUrl } = require('../src/lib/photo');
const { cardColor } = require('../src/lib/format');
const { uploadsDir } = require('../src/env');

const COLORS = {
  fresh: '#e9f056',
  woody: '#1f5a43',
  oriental: '#d9651c',
  men: '#8fc6ee',
  women: '#f3c3d0',
  none: '#cfe0c6',
};
const W = 1200;
const H = 630;
const CARD_W = 208;
const CARD_H = 290;
const GAP = 16;
const LEFT = Math.round((W - (5 * CARD_W + 4 * GAP)) / 2);
const TOP = 300;

async function main() {
  await ready();
  const picks = heroProducts(await products.list())
    .filter((p) => p.image)
    .slice(0, 5);
  if (picks.length < 3) throw new Error('Need at least three products with photos.');

  const layers = [];
  for (const [n, p] of picks.entries()) {
    const x = LEFT + n * (CARD_W + GAP);
    // staggered like the hero: the middle card sits lower
    const y = TOP + (n === 2 ? 22 : 0);
    const card = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}"><rect width="${CARD_W}" height="${CARD_H}" rx="28" fill="${COLORS[cardColor(p)]}"/></svg>`
    );
    layers.push({ input: card, left: x, top: y });
    const file = path.join(uploadsDir, photoUrl(p, 960).replace('/uploads/', ''));
    const bottle = await sharp(file)
      .resize({
        width: CARD_W - 28,
        height: CARD_H - 36,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    layers.push({ input: bottle, left: x + 14, top: y + 18 });
  }

  const text = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <text x="${LEFT}" y="118" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="68" letter-spacing="-2.5" fill="#14110f">A Good Scent</text>
      <text x="${LEFT}" y="196" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="68" letter-spacing="-2.5" fill="#14110f">Speaks First</text>
      <rect x="${LEFT}" y="222" width="86" height="8" rx="4" fill="#ffa100"/>
      <text x="${LEFT}" y="266" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="24" fill="#5e5750">Yannick Scents · Original perfumes in Addis Ababa</text>
    </svg>`);
  layers.push({ input: text, left: 0, top: 0 });

  const out = path.join(__dirname, '../public/img/og-default.png');
  await sharp({ create: { width: W, height: H, channels: 3, background: '#fbfaf7' } })
    .composite(layers)
    .png({ compressionLevel: 9, palette: true })
    .toFile(out);
  console.log(`Wrote ${out}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.close());
