/**
 * Adds 8 clearly marked SAMPLE perfumes with drawn placeholder bottles.
 * Prices, notes and descriptions are placeholders: replace them with your real products.
 * Re-running removes the old samples first and never touches products you added yourself.
 */
const { db, products } = require('./db');
const { saveProductImage, removeProductImage } = require('./lib/images');
const { slugify, slugSource } = require('./lib/format');

const SAMPLES = [
  {
    brand: 'Chanel',
    name: 'Bleu de Chanel',
    size: '100ml',
    concentration: 'Eau de Parfum',
    price: 15000,
    category: 'men',
    collections: ['men', 'woody', 'handpick'],
    family: 'Woody Aromatic',
    longevity: 4,
    projection: 4,
    badges: ['featured', 'bestseller'],
    colors: ['#5b1a24', '#dccfba'],
    description:
      'A confident aromatic-woody scent: bright citrus over warm cedar and sandalwood. A refined all-rounder for office and evenings.',
    top: 'Grapefruit, Lemon, Mint, Pink Pepper',
    heart: 'Ginger, Nutmeg, Jasmine',
    base: 'Incense, Cedar, Sandalwood',
  },
  {
    brand: 'Chanel',
    name: 'Coco Mademoiselle',
    size: '50ml',
    concentration: 'Eau de Parfum',
    price: 14000,
    category: 'women',
    collections: ['women', 'oriental'],
    family: 'Oriental Floral',
    longevity: 4,
    projection: 4,
    badges: ['featured'],
    colors: ['#8c7a66', '#d9ccb6'],
    description:
      'A fresh, sparkling opening settles into rose and jasmine over soft patchouli and vanilla. Elegant and easy to wear.',
    top: 'Orange, Bergamot, Grapefruit',
    heart: 'Rose, Jasmine, Lychee',
    base: 'Patchouli, Vetiver, Vanilla, White Musk',
  },
  {
    brand: 'Yves Saint Laurent',
    name: 'Libre',
    size: '50ml',
    concentration: 'Eau de Parfum',
    price: 12500,
    category: 'women',
    collections: ['women', 'oriental'],
    family: 'Floral Lavender',
    longevity: 4,
    projection: 3,
    badges: ['new'],
    colors: ['#6b4a2f', '#d6c7ae'],
    description: 'Lavender meets orange blossom over warm vanilla. Bold and free-spirited.',
    top: 'Lavender, Mandarin, Blackcurrant',
    heart: 'Orange Blossom, Jasmine',
    base: 'Vanilla, Tonka Bean, Musk, Cedar',
  },
  {
    brand: 'Yves Saint Laurent',
    name: 'Y',
    size: '100ml',
    concentration: 'Eau de Parfum',
    price: 13500,
    category: 'men',
    collections: ['men', 'fresh'],
    family: 'Fresh Aromatic',
    longevity: 4,
    projection: 4,
    badges: ['new'],
    colors: ['#4a5648', '#d3d0c0'],
    description:
      'A modern fresh-woody fragrance: crisp apple and ginger over sage and amberwood. Clean and bold.',
    top: 'Apple, Ginger, Bergamot',
    heart: 'Sage, Juniper Berries, Geranium',
    base: 'Amberwood, Tonka Bean, Cedar, Vetiver',
  },
  {
    brand: 'Valentino',
    name: 'Born in Roma Donna',
    size: '50ml',
    concentration: 'Eau de Parfum',
    price: 11500,
    category: 'women',
    collections: ['women', 'oriental', 'handpick'],
    family: 'Floral Vanilla',
    longevity: 4,
    projection: 3,
    badges: [],
    colors: ['#7a4a3a', '#dccdb8'],
    description:
      'A warm, floral-vanilla signature with a touch of spice. Feminine and long lasting.',
    top: 'Bergamot, Pink Pepper, Blackcurrant',
    heart: 'Jasmine, Bourbon Vanilla',
    base: 'Vanilla, Cashmeran, Woody Notes',
  },
  {
    brand: 'Hugo Boss',
    name: 'Boss Bottled',
    size: '100ml',
    concentration: 'Eau de Toilette',
    price: 6500,
    category: 'men',
    collections: ['men', 'woody', 'affordable'],
    family: 'Woody Spicy',
    longevity: 3,
    projection: 3,
    badges: ['bestseller'],
    colors: ['#3d3430', '#d4c8b6'],
    description:
      'A classic: crisp apple and warm cinnamon on a base of sandalwood and cedar. A dependable everyday scent at an accessible price.',
    top: 'Apple, Bergamot, Lemon',
    heart: 'Cinnamon, Carnation, Geranium',
    base: 'Sandalwood, Vanilla, Cedar, Vetiver',
  },
  {
    brand: 'Bentley',
    name: 'Bentley for Men Intense',
    size: '100ml',
    concentration: 'Eau de Parfum',
    price: 7500,
    category: 'men',
    collections: ['men', 'oriental', 'affordable'],
    family: 'Oriental Woody',
    longevity: 4,
    projection: 4,
    badges: [],
    colors: ['#a68a5b', '#e0d3bb'],
    description:
      'A warm, rich evening scent with spice, amber and vanilla. Great value for its performance.',
    top: 'Bergamot, Cardamom',
    heart: 'Cinnamon, Iris, Leather',
    base: 'Vanilla, Amber, Sandalwood',
  },
  {
    brand: 'Azzaro',
    name: 'Chrome',
    size: '100ml',
    concentration: 'Eau de Toilette',
    price: 5500,
    category: 'men',
    collections: ['men', 'fresh', 'affordable', 'handpick'],
    family: 'Fresh Aquatic',
    longevity: 3,
    projection: 3,
    badges: [],
    colors: ['#5f6b66', '#d6d2c4'],
    description:
      'Clean, bright and aquatic: citrus and rosemary over musk and cedar. Ideal for warm days.',
    top: 'Lemon, Bergamot, Rosemary, Neroli',
    heart: 'Cyclamen, Jasmine, Coriander',
    base: 'Oakmoss, Musk, Cedar, Sandalwood',
  },
];

/** A flat, softly toned bottle on white (the site tints it with the stone backdrop), labelled SAMPLE. */
function bottleSvg([liquid, glass]) {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="1000" height="1250">
      <rect width="400" height="500" fill="#ffffff"/>
      <ellipse cx="200" cy="442" rx="112" ry="9" fill="#e4dccd"/>
      <rect x="172" y="70" width="56" height="64" fill="#2a211c"/>
      <rect x="164" y="128" width="72" height="12" fill="#a68a5b"/>
      <rect x="190" y="140" width="20" height="22" fill="#d6c7ae"/>
      <path d="M110 440 V240 Q110 176 176 164 H224 Q290 176 290 240 V440 Z" fill="${glass}"/>
      <rect x="120" y="270" width="160" height="160" fill="${liquid}"/>
      <rect x="124" y="200" width="9" height="226" fill="#f6efe2" opacity="0.7"/>
      <rect x="156" y="318" width="88" height="76" fill="#f7f3ec"/>
      <rect x="156" y="318" width="88" height="76" fill="none" stroke="#a68a5b"/>
      <text x="200" y="362" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="12" letter-spacing="3" fill="#1c1714">SAMPLE</text>
    </svg>`);
}

async function main() {
  const old = db.prepare('SELECT id, image FROM products WHERE is_sample = 1').all();
  for (const row of old) {
    products.remove(row.id);
    await removeProductImage(row.image);
  }

  // New products are added at the top, so insert in reverse to keep this list's order.
  for (const s of [...SAMPLES].reverse()) {
    const image = await saveProductImage(bottleSvg(s.colors));
    products.create({
      slug: slugify(slugSource(s)),
      name: s.name,
      brand: s.brand,
      price: s.price,
      size: s.size,
      concentration: s.concentration,
      category: s.category,
      collections: JSON.stringify(s.collections),
      family: s.family,
      longevity: s.longevity,
      projection: s.projection,
      description: s.description,
      top_notes: s.top,
      heart_notes: s.heart,
      base_notes: s.base,
      badges: s.badges.join(','),
      image,
      in_stock: 1,
      is_sample: 1,
    });
  }
  console.log(`Added ${SAMPLES.length} SAMPLE perfumes (replaced ${old.length} old samples).`);
  console.log('Replace them in /admin with your real products, prices and photos.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
