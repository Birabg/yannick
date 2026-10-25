const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const { uploadsDir } = require('../env');
const { variantWidths } = require('./photo');
const { cutout } = require('./cutout');

const PRODUCT_DIR = path.join(uploadsDir, 'products');
const REVIEW_DIR = path.join(uploadsDir, 'reviews');
const BACKDROP = '#ffffff';

/** Bump when the image pipeline changes, so re-imported photos get new file names (files are cached for a year). */
const PIPELINE_VERSION = 4;

const token = () => crypto.randomBytes(8).toString('hex');

/**
 * Save a product photo as WebP in up to three widths (480, 960, 1600; never enlarged), keeping its
 * aspect ratio and dropping all metadata. A plain studio backdrop is lifted off (see cutout.js) so the
 * bottle keeps its true colours on the card; otherwise transparent areas become white and the card
 * blends the photo instead. Returns { base, width, height, cutout } for the largest saved file.
 * Pass `base` to write to a fixed name (the importer does, so it can be re-run safely).
 */
async function saveProductImage(buffer, { base = token() } = {}) {
  await fs.mkdir(PRODUCT_DIR, { recursive: true });
  const flat = await sharp(buffer, { failOn: 'error' })
    .rotate()
    .flatten({ background: BACKDROP })
    .toBuffer();

  // Photos are used exactly as supplied. A second, background-free copy (`<base>-cut.webp`) is made
  // when the backdrop is a plain studio colour, for places that sit a bottle on a coloured panel.
  const source = flat;

  const { data, info } = await sharp(source)
    .resize({ width: 1600, withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });
  const widths = variantWidths(info.width);
  await removeProductImage(base);
  await Promise.all(
    widths.map((w) =>
      sharp(data)
        .resize({ width: w })
        .webp({ quality: w <= 480 ? 80 : 84, alphaQuality: 92 })
        .toFile(path.join(PRODUCT_DIR, `${base}-${w}.webp`))
    )
  );
  const cutShot = await saveCutout(flat, base); // after the old files were cleared above
  return {
    base,
    width: info.width,
    height: info.height,
    cutW: cutShot.width,
    cutH: cutShot.height,
  };
}

/** Lifts a plain backdrop off the photo, trims and saves it as `<base>-cut.webp`. { width, height } or zeros. */
async function saveCutout(flat, base) {
  const none = { width: 0, height: 0 };
  const cut = await cutout(flat);
  if (!cut.applied) return none;
  const png = await sharp(cut.data, { raw: { width: cut.width, height: cut.height, channels: 4 } })
    .png()
    .toBuffer();
  const trimmed = await sharp(png).trim({ threshold: 2 }).toBuffer({ resolveWithObject: true });
  const pad = Math.round(Math.max(trimmed.info.width, trimmed.info.height) * 0.04);
  const info = await sharp(trimmed.data)
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize({ width: 960, withoutEnlargement: true })
    .webp({ quality: 84, alphaQuality: 92 })
    .toFile(path.join(PRODUCT_DIR, `${base}-cut.webp`));
  return { width: info.width, height: info.height };
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

/** Removes every saved width of a product photo (and the legacy -sm / -lg files). */
async function removeProductImage(base) {
  if (!base) return;
  const safe = path.basename(base);
  const files = await fs.readdir(PRODUCT_DIR).catch(() => []);
  await Promise.all(
    files
      .filter(
        (f) => f.startsWith(`${safe}-`) && /^-(\d+|sm|lg|cut)\.webp$/.test(f.slice(safe.length))
      )
      .map((f) => unlinkQuiet(path.join(PRODUCT_DIR, f)))
  );
}

/** Photos present on disk: Map of base name to { widths, bytes }. */
async function listProductFiles() {
  const files = await fs.readdir(PRODUCT_DIR).catch(() => []);
  const bases = new Map();
  for (const f of files) {
    const m = /^(.+)-(\d+|sm|lg|cut)\.webp$/.exec(f);
    if (!m) continue;
    const { size } = await fs.stat(path.join(PRODUCT_DIR, f));
    const entry = bases.get(m[1]) || { widths: [], bytes: 0 };
    entry.widths.push(m[2]);
    entry.bytes += size;
    bases.set(m[1], entry);
  }
  return bases;
}

const removeReviewImage = (name) =>
  name ? unlinkQuiet(path.join(REVIEW_DIR, path.basename(name))) : undefined;

module.exports = {
  saveProductImage,
  saveReviewImage,
  removeProductImage,
  removeReviewImage,
  listProductFiles,
  PIPELINE_VERSION,
  PRODUCT_DIR,
};
