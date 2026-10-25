const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { dataDir } = require('./env');

fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, 'yannick.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
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
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    text TEXT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 5,
    image TEXT NOT NULL DEFAULT '',
    image_w INTEGER NOT NULL DEFAULT 0,
    image_h INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    expires INTEGER NOT NULL
  );
`);

const splitList = (s) =>
  String(s || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

function toProduct(r) {
  if (!r) return null;
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    brand: r.brand,
    price: r.price,
    size: r.size,
    concentration: r.concentration,
    category: r.category,
    collections: JSON.parse(r.collections),
    family: r.family,
    longevity: r.longevity,
    projection: r.projection,
    description: r.description,
    notes: {
      top: splitList(r.top_notes),
      heart: splitList(r.heart_notes),
      base: splitList(r.base_notes),
    },
    badges: splitList(r.badges),
    image: r.image,
    inStock: r.in_stock === 1,
    isSample: r.is_sample === 1,
    sortOrder: r.sort_order,
    updatedAt: r.updated_at,
  };
}

const ORDER = 'ORDER BY sort_order ASC, id DESC';

const products = {
  list: () => db.prepare(`SELECT * FROM products ${ORDER}`).all().map(toProduct),
  get: (id) => toProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(id)),
  getBySlug: (slug) => toProduct(db.prepare('SELECT * FROM products WHERE slug = ?').get(slug)),
  count: () => db.prepare('SELECT COUNT(*) AS n FROM products').get().n,

  slugExists(slug, exceptId = 0) {
    return !!db.prepare('SELECT 1 FROM products WHERE slug = ? AND id != ?').get(slug, exceptId);
  },

  create(p) {
    const top = db.prepare('SELECT COALESCE(MIN(sort_order), 1) - 1 AS n FROM products').get().n;
    const info = db
      .prepare(
        `INSERT INTO products (slug, name, brand, price, size, concentration, category, collections,
          family, longevity, projection, description, top_notes, heart_notes, base_notes, badges,
          image, in_stock, is_sample, sort_order)
         VALUES (@slug, @name, @brand, @price, @size, @concentration, @category, @collections,
          @family, @longevity, @projection, @description, @top_notes, @heart_notes, @base_notes,
          @badges, @image, @in_stock, @is_sample, @sort_order)`
      )
      .run({ ...p, sort_order: top });
    return Number(info.lastInsertRowid);
  },

  update(id, p) {
    db.prepare(
      `UPDATE products SET slug=@slug, name=@name, brand=@brand, price=@price, size=@size,
        concentration=@concentration, category=@category, collections=@collections, family=@family,
        longevity=@longevity, projection=@projection, description=@description,
        top_notes=@top_notes, heart_notes=@heart_notes, base_notes=@base_notes, badges=@badges,
        image=@image, in_stock=@in_stock, is_sample=@is_sample, updated_at=datetime('now')
       WHERE id=@id`
    ).run({ ...p, id });
  },

  remove: (id) => db.prepare('DELETE FROM products WHERE id = ?').run(id),

  setStock: (id, inStock) =>
    db
      .prepare("UPDATE products SET in_stock = ?, updated_at = datetime('now') WHERE id = ?")
      .run(inStock ? 1 : 0, id),

  setBadges: (id, badges) =>
    db.prepare('UPDATE products SET badges = ? WHERE id = ?').run(badges.join(','), id),

  /** Swap display position with the neighbour above (-1) or below (+1). */
  move(id, direction) {
    const rows = db.prepare(`SELECT id FROM products ${ORDER}`).all();
    const i = rows.findIndex((r) => r.id === id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= rows.length) return;
    [rows[i], rows[j]] = [rows[j], rows[i]];
    const set = db.prepare('UPDATE products SET sort_order = ? WHERE id = ?');
    db.transaction(() => rows.forEach((r, n) => set.run(n, r.id)))();
  },
};

const reviews = {
  list: () => db.prepare('SELECT * FROM reviews ORDER BY id DESC').all(),
  get: (id) => db.prepare('SELECT * FROM reviews WHERE id = ?').get(id),
  create: (r) =>
    Number(
      db
        .prepare(
          'INSERT INTO reviews (name, text, rating, image, image_w, image_h) VALUES (@name, @text, @rating, @image, @image_w, @image_h)'
        )
        .run(r).lastInsertRowid
    ),
  update: (id, r) =>
    db
      .prepare(
        'UPDATE reviews SET name=@name, text=@text, rating=@rating, image=@image, image_w=@image_w, image_h=@image_h WHERE id=@id'
      )
      .run({ ...r, id }),
  remove: (id) => db.prepare('DELETE FROM reviews WHERE id = ?').run(id),
};

const settings = {
  get: (key) => db.prepare('SELECT value FROM settings WHERE key = ?').get(key)?.value,
  set: (key, value) =>
    db
      .prepare(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
      )
      .run(key, value),
};

module.exports = { db, toProduct, products, reviews, settings };
