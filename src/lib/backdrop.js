/**
 * The backdrop colour of a product photo, read from the picture's own border, so a card can be
 * painted the same colour and the photo never shows as a box on it.
 *
 * colorOf() is synchronous for the templates: it answers from a cache and, on a miss, reads the
 * photo in the background (the next page view has it). warmAll() fills the cache at start-up.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const { PRODUCT_DIR } = require('./images');

const SIZE = 32;
const cache = new Map(); // photo base -> '#rrggbb'
const pending = new Set();

/** Mean colour of the outer 2px ring of the picture. */
async function edgeColor(file) {
  const { data, info } = await sharp(file)
    .resize({ width: SIZE, height: SIZE, fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (x > 1 && y > 1 && x < info.width - 2 && y < info.height - 2) continue;
      const i = (y * info.width + x) * info.channels;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
  }
  const hex = (v) => Math.round(v / n).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

async function load(base) {
  if (!base || cache.has(base) || pending.has(base)) return;
  pending.add(base);
  try {
    const files = await fs.readdir(PRODUCT_DIR);
    const small = files.find((f) => f === `${base}-480.webp`) || files.find((f) => f === `${base}-sm.webp`);
    if (small) cache.set(base, await edgeColor(path.join(PRODUCT_DIR, small)));
  } catch {
    /* no photo yet: the card keeps its theme colour */
  } finally {
    pending.delete(base);
  }
}

/** '#rrggbb' for a product's photo, or null until it has been read. */
function colorOf(p) {
  if (!p || !p.image) return null;
  const hit = cache.get(p.image);
  if (hit) return hit;
  load(p.image);
  return null;
}

async function warmAll() {
  const files = await fs.readdir(PRODUCT_DIR).catch(() => []);
  const bases = files.filter((f) => /-(480|sm)\.webp$/.test(f)).map((f) => f.replace(/-(480|sm)\.webp$/, ''));
  await Promise.all(bases.map(load));
}

/** The class and CSS rule that give a card photo its backdrop colour (inline styles are blocked by the CSP). */
function rule(p) {
  const hex = colorOf(p);
  if (!hex) return null;
  const name = `bd-${hex.slice(1)}`;
  return { name, css: `.${name}{--card:${hex}}` };
}

module.exports = { colorOf, rule, warmAll };
