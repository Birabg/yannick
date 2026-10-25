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
    colors: ['#1d3557', '#a8c4e6'],
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
    colors: ['#8a5a2b', '#f1d9b0'],
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
    colors: ['#5b2a86', '#e2c6f5'],
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
    colors: ['#16324f', '#9fd3e6'],
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
    colors: ['#8c2f39', '#f4c7c3'],
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
    colors: ['#6b2f1a', '#e8c9a8'],
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
    colors: ['#2e2a24', '#d8b872'],
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
    colors: ['#0b5e75', '#bfeaf2'],
    description:
      'Clean, bright and aquatic: citrus and rosemary over musk and cedar. Ideal for warm days.',
    top: 'Lemon, Bergamot, Rosemary, Neroli',
    heart: 'Cyclamen, Jasmine, Coriander',
    base: 'Oakmoss, Musk, Cedar, Sandalwood',
  },
];

/** A simple drawn bottle in the sample's colours, labelled SAMPLE. */
function bottleSvg([deep, light]) {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="1000" height="1250">
      <rect width="400" height="500" fill="#f1ebdf"/>
      <ellipse cx="200" cy="440" rx="120" ry="14" fill="#000" opacity="0.12"/>
      <rect x="170" y="62" width="60" height="58" rx="6" fill="#b9975a"/>
      <rect x="160" y="116" width="80" height="26" rx="5" fill="#c9a45c"/>
      <rect x="98" y="146" width="204" height="284" rx="28" fill="${light}" stroke="${deep}" stroke-width="3"/>
      <rect x="110" y="250" width="180" height="168" rx="20" fill="${deep}" opacity="0.85"/>
      <rect x="122" y="164" width="14" height="236" rx="7" fill="#fff" opacity="0.35"/>
      <rect x="150" y="296" width="130" height="82" rx="6" fill="#faf6ee" opacity="0.92"/>
      <path d="M215 308l6 9-6 9-6-9z" fill="${deep}"/>
      <text x="215" y="355" text-anchor="middle" font-family="Georgia, serif" font-size="17" letter-spacing="3" fill="${deep}">SAMPLE</text>
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
