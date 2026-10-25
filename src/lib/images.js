const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const { uploadsDir } = require('../env');

const PRODUCT_DIR = path.join(uploadsDir, 'products');
const REVIEW_DIR = path.join(uploadsDir, 'reviews');
const PAPER = '#f1ebdf';

const token = () => crypto.randomBytes(8).toString('hex');

/** Save a large (1000x1250) and a thumbnail (480x600) WebP. Returns the shared base name. */
async function saveProductImage(buffer) {
  await fs.mkdir(PRODUCT_DIR, { recursive: true });
  const base = token();
  const render = (w, h, quality, suffix) =>
    sharp(buffer, { failOn: 'error' })
      .rotate()
      .resize({ width: w, height: h, fit: 'contain', background: PAPER })
      .flatten({ background: PAPER })
      .webp({ quality })
      .toFile(path.join(PRODUCT_DIR, `${base}-${suffix}.webp`));
  await Promise.all([render(1000, 1250, 82, 'lg'), render(480, 600, 78, 'sm')]);
  return base;
}

/** Save a review screenshot, at most 900px wide. Returns { name, width, height }. */
async function saveReviewImage(buffer) {
  await fs.mkdir(REVIEW_DIR, { recursive: true });
  const name = `${token()}.webp`;
  const info = await sharp(buffer, { failOn: 'error' })
    .rotate()
    .resize({ width: 900, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(REVIEW_DIR, name));
  return { name, width: info.width, height: info.height };
}

const unlinkQuiet = (file) => fs.unlink(file).catch(() => {});

const removeProductImage = (base) =>
  base
    ? Promise.all(['lg', 'sm'].map((v) => unlinkQuiet(path.join(PRODUCT_DIR, `${base}-${v}.webp`))))
    : undefined;

const removeReviewImage = (name) =>
  name ? unlinkQuiet(path.join(REVIEW_DIR, path.basename(name))) : undefined;

module.exports = { saveProductImage, saveReviewImage, removeProductImage, removeReviewImage };
