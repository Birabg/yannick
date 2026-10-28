const fs = require('node:fs');
const path = require('node:path');
const { isProd, dataDir } = require('./env');

/*
 * Database: Turso (hosted libSQL, SQLite-compatible) through @libsql/client.
 *   TURSO_DATABASE_URL  libsql://your-db-your-org.turso.io
 *   TURSO_AUTH_TOKEN    the database token
 * Serverless hosts such as Vercel have no writable, persistent disk, so production must use Turso.
 * In development, when TURSO_DATABASE_URL is not set, a local SQLite file (data/yannick.db) is used instead.
 */
const remoteUrl = (process.env.TURSO_DATABASE_URL || '').trim();
if (!remoteUrl && isProd) {
  throw new Error(
    'TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in production (see .env.example).'
  );
}

function openClient() {
  if (remoteUrl.startsWith('file:') || !remoteUrl) {
    let url = remoteUrl;
    if (!url) {
      fs.mkdirSync(dataDir, { recursive: true });
      url = `file:${path.join(dataDir, 'yannick.db')}`;
    }
    return require('@libsql/client').createClient({ url });
  }
  // The web build talks to Turso over HTTPS only, so no native module has to load in a serverless function.
  const { createClient } = require('@libsql/client/web');
  return createClient({
    url: remoteUrl.replace(/^libsql:/, 'https:'),
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

const client = openClient();

/** Named parameters (@name) are passed as an object; only the ones the statement uses are sent. */
function bind(sql, args) {
  if (args == null) return [];
  if (Array.isArray(args)) return args;
  const used = new Set([...sql.matchAll(/[@:$](\w+)/g)].map((m) => m[1]));
  return Object.fromEntries(Object.entries(args).filter(([k]) => used.has(k)));
}

const stmt = ([sql, args]) => ({ sql, args: bind(sql, args) });

async function all(sql, args) {
  const rs = await client.execute(stmt([sql, args]));
  return rs.rows.map((row) => Object.fromEntries(rs.columns.map((c, i) => [c, row[i]])));
}

const get = async (sql, args) => (await all(sql, args))[0];

async function run(sql, args) {
  const rs = await client.execute(stmt([sql, args]));
  return { changes: rs.rowsAffected, lastInsertRowid: Number(rs.lastInsertRowid ?? 0) };
}

/** Several statements in one round trip and one transaction: [[sql, args], ...]. */
const batch = (list) => client.batch(list.map(stmt), 'write');

const db = { all, get, run, batch, close: () => client.close() };

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    price INTEGER NOT NULL,
    size TEXT NOT NULL,
    concentration TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'unisex',
    collections TEXT NOT NULL DEFAULT '[]',
    family TEXT NOT NULL DEFAULT '',
    longevity INTEGER NOT NULL DEFAULT 3,
    projection INTEGER NOT NULL DEFAULT 3,
    description TEXT NOT NULL DEFAULT '',
    top_notes TEXT NOT NULL DEFAULT '',
    heart_notes TEXT NOT NULL DEFAULT '',
    base_notes TEXT NOT NULL DEFAULT '',
    badges TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    in_stock INTEGER NOT NULL DEFAULT 1,
    is_sample INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    text TEXT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 5,
    image TEXT NOT NULL DEFAULT '',
    image_w INTEGER NOT NULL DEFAULT 0,
    image_h INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  'CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
  `CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    expires INTEGER NOT NULL
  )`,
  // Extra sizes of one perfume, each with its own price. A perfume with a single size needs no rows here.
  `CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size_ml INTEGER NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    sale_price INTEGER NOT NULL DEFAULT 0,
    in_stock INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`,
  'CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id)',
];

// Columns added after the first release; each is added once to databases that predate it.
const ADDED_COLUMNS = {
  img_w: 'INTEGER NOT NULL DEFAULT 0',
  img_h: 'INTEGER NOT NULL DEFAULT 0',
  img_alt: "TEXT NOT NULL DEFAULT ''",
  focus_x: 'INTEGER NOT NULL DEFAULT 50',
  focus_y: 'INTEGER NOT NULL DEFAULT 50',
  fit: "TEXT NOT NULL DEFAULT 'cover'",
  tint: "TEXT NOT NULL DEFAULT ''",
  needs_details: 'INTEGER NOT NULL DEFAULT 0',
  cutout: 'INTEGER NOT NULL DEFAULT 0',
  best_order: 'INTEGER NOT NULL DEFAULT 0', // position in "Most Loved" (1 = first, 0 = not set)
  cut_w: 'INTEGER NOT NULL DEFAULT 0',
  cut_h: 'INTEGER NOT NULL DEFAULT 0',
  description_en: "TEXT NOT NULL DEFAULT ''",
  description_am: "TEXT NOT NULL DEFAULT ''",
  tagline_en: "TEXT NOT NULL DEFAULT ''",
  tagline_am: "TEXT NOT NULL DEFAULT ''",
  meta_description: "TEXT NOT NULL DEFAULT ''",
  description_status: "TEXT NOT NULL DEFAULT 'approved'", // 'draft' | 'approved'
  am_reviewed: 'INTEGER NOT NULL DEFAULT 0',
  // The photo's own backdrop, found when the photo is saved (src/lib/bgcolor.js). bg_override is the owner's
  // colour and is kept apart, so re-running `npm run image-colors` never replaces a manual choice.
  bg_color: "TEXT NOT NULL DEFAULT ''",
  bg_color_top: "TEXT NOT NULL DEFAULT ''",
  bg_color_bottom: "TEXT NOT NULL DEFAULT ''",
  bg_is_dark: 'INTEGER NOT NULL DEFAULT 0',
  bg_mode: "TEXT NOT NULL DEFAULT ''", // 'solid' | 'busy' | 'alpha'
  bg_override: "TEXT NOT NULL DEFAULT ''",
  // Prices (ETB, whole numbers). `price` above is the price; 0 means not set yet. A sale price of 0 means no sale.
  sale_price: 'INTEGER NOT NULL DEFAULT 0',
  price_visible: 'INTEGER NOT NULL DEFAULT 1',
  price_updated_at: "TEXT NOT NULL DEFAULT ''",
  // Where the price came from: 'manual' (typed in the admin, never overwritten by an import), 'live-site' or 'csv'.
  price_source: "TEXT NOT NULL DEFAULT ''",
};

async function init() {
  await client.batch(SCHEMA, 'write');

  const have = new Set((await all('PRAGMA table_info(products)')).map((c) => c.name));
  for (const [col, def] of Object.entries(ADDED_COLUMNS)) {
    if (have.has(col)) continue;
    // Two cold instances can race to add the same column; the loser's error is harmless.
    await run(`ALTER TABLE products ADD COLUMN ${col} ${def}`).catch((err) => {
      if (!/duplicate column/i.test(err.message)) throw err;
    });
  }

  // One-off text fix: "Yanick's" (one n) is a misspelling of the owner's name wherever it was typed.
  if (!(await get("SELECT 1 FROM settings WHERE key = 'fix_yanick_v1'"))) {
    const textColumns = [
      'name',
      'brand',
      'description',
      'description_en',
      'description_am',
      'tagline_en',
      'tagline_am',
      'meta_description',
      'img_alt',
    ];
    await batch([
      ...textColumns.map((col) => [
        `UPDATE products SET ${col} = REPLACE(${col}, 'Yanick', 'Yannick') WHERE ${col} LIKE '%Yanick%'`,
      ]),
      ["INSERT OR IGNORE INTO settings (key, value) VALUES ('fix_yanick_v1', '1')"],
    ]);
  }
}

/** Creates the tables on first use. Safe to await on every request; a failed attempt is retried next time. */
let initialising = null;
const ready = () => {
  initialising ||= init().catch((err) => {
    initialising = null;
    throw err;
  });
  return initialising;
};

const PRODUCT_DEFAULTS = {
  img_w: 0,
  img_h: 0,
  img_alt: '',
  focus_x: 50,
  focus_y: 50,
  fit: 'cover',
  tint: '',
  needs_details: 0,
  cutout: 0,
  cut_w: 0,
  cut_h: 0,
  best_order: 0,
  description_en: '',
  description_am: '',
  tagline_en: '',
  tagline_am: '',
  meta_description: '',
  description_status: 'approved',
  am_reviewed: 0,
  bg_color: '',
  bg_color_top: '',
  bg_color_bottom: '',
  bg_is_dark: 0,
  bg_mode: '',
  bg_override: '',
  sale_price: 0,
  price_visible: 1,
  price_updated_at: '',
  price_source: '',
};

const splitList = (s) =>
  String(s || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

function toProduct(r, variants = []) {
  if (!r) return null;
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    brand: r.brand,
    price: r.price,
    salePrice: r.sale_price ?? 0,
    priceVisible: r.price_visible !== 0,
    priceUpdatedAt: r.price_updated_at ?? '',
    priceSource: r.price_source ?? '',
    variants: variants.map((v) => ({
      id: v.id,
      sizeMl: v.size_ml,
      price: v.price,
      salePrice: v.sale_price,
      inStock: v.in_stock === 1,
    })),
    size: r.size,
    concentration: r.concentration,
    category: r.category,
    collections: JSON.parse(r.collections),
    family: r.family,
    longevity: r.longevity,
    projection: r.projection,
    // `description` is the older column; description_en supersedes it once set.
    description: r.description_en || r.description,
    descriptionAm: r.description_am,
    tagline: r.tagline_en,
    taglineAm: r.tagline_am,
    metaDescription: r.meta_description,
    descriptionDraft: r.description_status === 'draft',
    amReviewed: r.am_reviewed === 1,
    notes: {
      top: splitList(r.top_notes),
      heart: splitList(r.heart_notes),
      base: splitList(r.base_notes),
    },
    badges: splitList(r.badges),
    image: r.image,
    imageW: r.img_w,
    imageH: r.img_h,
    imageAlt: r.img_alt,
    focusX: r.focus_x,
    focusY: r.focus_y,
    fit: r.fit,
    cutout: r.cutout === 1,
    bestOrder: r.best_order,
    cutW: r.cut_w,
    cutH: r.cut_h,
    tint: r.tint,
    bgColor: r.bg_color,
    bgTop: r.bg_color_top,
    bgBottom: r.bg_color_bottom,
    bgIsDark: r.bg_is_dark === 1,
    bgMode: r.bg_mode,
    bgOverride: r.bg_override,
    // Flagged by hand, or while the owner still has to confirm a price, size or concentration.
    needsDetails: r.needs_details === 1 || r.price <= 0 || !r.size || !r.concentration,
    needsDetailsFlag: r.needs_details === 1,
    inStock: r.in_stock === 1,
    isSample: r.is_sample === 1,
    sortOrder: r.sort_order,
    updatedAt: r.updated_at,
  };
}

const ORDER = 'ORDER BY sort_order ASC, id DESC';

const variantRows = (id) =>
  all('SELECT * FROM product_variants WHERE product_id = ? ORDER BY size_ml ASC, id ASC', [id]);

const products = {
  async list() {
    const [variants, rows] = await Promise.all([
      all('SELECT * FROM product_variants ORDER BY size_ml ASC, id ASC'),
      all(`SELECT * FROM products ${ORDER}`),
    ]);
    const byProduct = new Map();
    for (const v of variants) {
      if (!byProduct.has(v.product_id)) byProduct.set(v.product_id, []);
      byProduct.get(v.product_id).push(v);
    }
    return rows.map((r) => toProduct(r, byProduct.get(r.id) || []));
  },
  async get(id) {
    const r = await get('SELECT * FROM products WHERE id = ?', [id]);
    return r ? toProduct(r, await variantRows(r.id)) : null;
  },
  async getBySlug(slug) {
    const r = await get('SELECT * FROM products WHERE slug = ?', [slug]);
    return r ? toProduct(r, await variantRows(r.id)) : null;
  },

  /** Replaces a perfume's extra sizes. Each: { size_ml, price, sale_price, in_stock }. */
  setVariants: (id, list) =>
    batch([
      ['DELETE FROM product_variants WHERE product_id = ?', [id]],
      ...list.map((v, n) => [
        'INSERT INTO product_variants (product_id, size_ml, price, sale_price, in_stock, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [id, v.size_ml, v.price, v.sale_price || 0, v.in_stock ? 1 : 0, n],
      ]),
    ]),

  /** Marks a price as just updated (new products, size changes). */
  stampPrice: (id, source) =>
    run("UPDATE products SET price_updated_at = datetime('now'), price_source = ? WHERE id = ?", [
      source,
      id,
    ]),

  /** Price fields only; stamps the update date when the price or sale price changed. */
  async setPrice(id, { price, sale_price = 0, price_visible = 1, source }) {
    const now = await get('SELECT price, sale_price FROM products WHERE id = ?', [id]);
    if (!now) return;
    const changed = now.price !== price || now.sale_price !== sale_price;
    await run(
      `UPDATE products SET price = ?, sale_price = ?, price_visible = ?,
        price_source = CASE WHEN ? != '' AND ? THEN ? ELSE price_source END,
        price_updated_at = CASE WHEN ? THEN datetime('now') ELSE price_updated_at END,
        updated_at = datetime('now') WHERE id = ?`,
      [
        price,
        sale_price,
        price_visible ? 1 : 0,
        source || '',
        changed ? 1 : 0,
        source || '',
        changed ? 1 : 0,
        id,
      ]
    );
  },
  count: async () => (await get('SELECT COUNT(*) AS n FROM products')).n,

  async slugExists(slug, exceptId = 0) {
    return !!(await get('SELECT 1 FROM products WHERE slug = ? AND id != ?', [slug, exceptId]));
  },

  async create(p) {
    const top = (await get('SELECT COALESCE(MIN(sort_order), 1) - 1 AS n FROM products')).n;
    const info = await run(
      `INSERT INTO products (slug, name, brand, price, size, concentration, category, collections,
          family, longevity, projection, description, top_notes, heart_notes, base_notes, badges,
          image, img_w, img_h, img_alt, focus_x, focus_y, fit, tint, needs_details, cutout, cut_w, cut_h, best_order,
          description_en, description_am, tagline_en, tagline_am, meta_description,
          bg_color, bg_color_top, bg_color_bottom, bg_is_dark, bg_mode, bg_override,
          sale_price, price_visible, price_updated_at, price_source,
          description_status, am_reviewed, in_stock, is_sample, sort_order)
         VALUES (@slug, @name, @brand, @price, @size, @concentration, @category, @collections,
          @family, @longevity, @projection, @description, @top_notes, @heart_notes, @base_notes,
          @badges, @image, @img_w, @img_h, @img_alt, @focus_x, @focus_y, @fit, @tint,
          @needs_details, @cutout, @cut_w, @cut_h, @best_order, @description_en, @description_am, @tagline_en, @tagline_am,
          @meta_description, @bg_color, @bg_color_top, @bg_color_bottom, @bg_is_dark, @bg_mode, @bg_override,
          @sale_price, @price_visible, @price_updated_at, @price_source,
          @description_status, @am_reviewed, @in_stock, @is_sample, @sort_order)`,
      { ...PRODUCT_DEFAULTS, ...p, sort_order: top }
    );
    return info.lastInsertRowid;
  },

  update: (id, p) =>
    run(
      `UPDATE products SET slug=@slug, name=@name, brand=@brand, price=@price, size=@size,
        concentration=@concentration, category=@category, collections=@collections, family=@family,
        longevity=@longevity, projection=@projection, description=@description,
        top_notes=@top_notes, heart_notes=@heart_notes, base_notes=@base_notes, badges=@badges,
        image=@image, img_w=@img_w, img_h=@img_h, img_alt=@img_alt, focus_x=@focus_x,
        focus_y=@focus_y, fit=@fit, tint=@tint, needs_details=@needs_details,
        cutout=@cutout, cut_w=@cut_w, cut_h=@cut_h, best_order=@best_order, description_en=@description_en, description_am=@description_am,
        tagline_en=@tagline_en, tagline_am=@tagline_am, meta_description=@meta_description,
        bg_color=@bg_color, bg_color_top=@bg_color_top, bg_color_bottom=@bg_color_bottom,
        bg_is_dark=@bg_is_dark, bg_mode=@bg_mode, bg_override=@bg_override,
        sale_price=@sale_price, price_visible=@price_visible,
        description_status=@description_status, am_reviewed=@am_reviewed, in_stock=@in_stock, is_sample=@is_sample, updated_at=datetime('now')
       WHERE id=@id`,
      { ...PRODUCT_DEFAULTS, ...p, id }
    ),

  // The variants go in the same transaction, so cascading does not depend on the server's foreign-key setting.
  remove: (id) =>
    batch([
      ['DELETE FROM product_variants WHERE product_id = ?', [id]],
      ['DELETE FROM products WHERE id = ?', [id]],
    ]),

  async setPhoto(id, { image, img_w, img_h, cut_w = 0, cut_h = 0, ...bg }) {
    await run(
      "UPDATE products SET image = ?, img_w = ?, img_h = ?, cut_w = ?, cut_h = ?, updated_at = datetime('now') WHERE id = ?",
      [image, img_w, img_h, cut_w, cut_h, id]
    );
    if ('bg_mode' in bg) await products.setBackground(id, bg);
  },

  /** The detected backdrop colours. Never touches bg_override. */
  setBackground: (id, { bg_color, bg_color_top, bg_color_bottom, bg_is_dark, bg_mode }) =>
    run(
      'UPDATE products SET bg_color = ?, bg_color_top = ?, bg_color_bottom = ?, bg_is_dark = ?, bg_mode = ? WHERE id = ?',
      [bg_color, bg_color_top, bg_color_bottom, bg_is_dark ? 1 : 0, bg_mode, id]
    ),

  setStock: (id, inStock) =>
    run("UPDATE products SET in_stock = ?, updated_at = datetime('now') WHERE id = ?", [
      inStock ? 1 : 0,
      id,
    ]),

  setBadges: (id, badges) =>
    run('UPDATE products SET badges = ? WHERE id = ?', [badges.join(','), id]),

  /** Swap display position with the neighbour above (-1) or below (+1). */
  async move(id, direction) {
    const rows = await all(`SELECT id FROM products ${ORDER}`);
    const i = rows.findIndex((r) => r.id === id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= rows.length) return;
    [rows[i], rows[j]] = [rows[j], rows[i]];
    await batch(rows.map((r, n) => ['UPDATE products SET sort_order = ? WHERE id = ?', [n, r.id]]));
  },
};

const reviews = {
  list: () => all('SELECT * FROM reviews ORDER BY id DESC'),
  count: async () => (await get('SELECT COUNT(*) AS n FROM reviews')).n,
  get: (id) => get('SELECT * FROM reviews WHERE id = ?', [id]),
  create: async (r) =>
    (
      await run(
        'INSERT INTO reviews (name, text, rating, image, image_w, image_h) VALUES (@name, @text, @rating, @image, @image_w, @image_h)',
        r
      )
    ).lastInsertRowid,
  update: (id, r) =>
    run(
      'UPDATE reviews SET name=@name, text=@text, rating=@rating, image=@image, image_w=@image_w, image_h=@image_h WHERE id=@id',
      { ...r, id }
    ),
  remove: (id) => run('DELETE FROM reviews WHERE id = ?', [id]),
};

/*
 * Settings are a handful of small rows that templates read synchronously (site images, Our Story copy).
 * `load()` refreshes the copy held in memory and runs at the start of every request, so `get` stays
 * synchronous and a serverless instance never serves a value another instance has since changed.
 */
let settingsCache = new Map();
const settings = {
  async load() {
    const rows = await all('SELECT key, value FROM settings');
    settingsCache = new Map(rows.map((r) => [r.key, r.value]));
  },
  get: (key) => settingsCache.get(key),
  /** Reads straight from the database (scripts, and anything that runs before `load()`). */
  fetch: async (key) => (await get('SELECT value FROM settings WHERE key = ?', [key]))?.value,
  async set(key, value) {
    await run(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value]
    );
    settingsCache.set(key, value);
  },
};

module.exports = { db, ready, toProduct, products, reviews, settings };
