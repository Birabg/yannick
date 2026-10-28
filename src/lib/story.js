/**
 * Our Story: the copy and the founder photo.
 *
 * The defaults live in config/site.js (`story`). The owner's edits from /admin/story are saved in the
 * settings table and win over the defaults, field by field. The photo is a set of AVIF + WebP files:
 * the built-in one in public/img/story (made by scripts/make-story.js) or one uploaded in the admin,
 * kept in uploads/story. Both come from the same function, `saveStoryVariants`.
 */
const fs = require('node:fs/promises');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const site = require('../../config/site');
const { uploadsDir } = require('../env');
const { settings } = require('../db');

const WIDTHS = [480, 800, 1200, 1600];
const UPLOAD_DIR = path.join(uploadsDir, 'story');
const DEFAULT_DIR = path.join(__dirname, '..', '..', 'public', 'img', 'story');

/**
 * Writes `<base>-<w>.avif` and `.webp` for every width up to the picture's own width (never upscaled),
 * with the rotation applied and all metadata dropped. Returns { base, widths, width, height }.
 */
async function saveStoryVariants(buffer, dir, base) {
  await fs.mkdir(dir, { recursive: true });
  const oriented = await sharp(buffer, { failOn: 'error' })
    .rotate()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = oriented.info;
  const widths = [...new Set([...WIDTHS.filter((w) => w < width), Math.min(width, WIDTHS[3])])];
  for (const w of widths) {
    const resized = sharp(oriented.data).resize({ width: w, withoutEnlargement: true });
    await resized
      .clone()
      .avif({ quality: 70, effort: 6 })
      .toFile(path.join(dir, `${base}-${w}.avif`));
    await resized
      .clone()
      .webp({ quality: 85 })
      .toFile(path.join(dir, `${base}-${w}.webp`));
  }
  return { base, widths, width, height };
}

const readJson = (text, fallback) => {
  try {
    return text ? JSON.parse(text) : fallback;
  } catch {
    return fallback;
  }
};

/** The built-in photo (public/img/story), or null until scripts/make-story.js has been run. */
let defaultManifest = null;
try {
  defaultManifest = {
    ...JSON.parse(readFileSync(path.join(DEFAULT_DIR, 'story.json'), 'utf8')),
    url: '/img/story',
  };
} catch {
  /* not built yet: the placeholder shows */
}

/** Copy fields the owner can edit. Anything not saved falls back to config/site.js. */
function getStory() {
  const base = site.story;
  const saved = readJson(settings.get('story_copy'), {});
  const pick = (key) => {
    const v = saved[key];
    return typeof v === 'string' && v.trim() ? v.trim() : base[key];
  };
  const list = (key, count) =>
    Array.from({ length: count }, (_, n) => {
      const v = saved[key]?.[n];
      return typeof v === 'string' && v.trim() ? v.trim() : base[key][n];
    });
  const stats = base.stats.map((s, n) => ({
    value: saved.stats?.[n]?.value?.trim() || s.value,
    label: saved.stats?.[n]?.label?.trim() || s.label,
    valueAm: saved.stats?.[n]?.valueAm?.trim() || s.valueAm,
    labelAm: saved.stats?.[n]?.labelAm?.trim() || s.labelAm,
  }));
  const photoSaved = readJson(settings.get('story_photo'), null);
  const photo = photoSaved ? { ...photoSaved, url: '/uploads/story' } : defaultManifest;
  const focus = readJson(settings.get('story_focus'), null) ?? base.focus;
  return {
    eyebrow: pick('eyebrow'),
    heading: pick('heading'),
    paragraphs: list('paragraphs', base.paragraphs.length),
    stats,
    caption: pick('caption'),
    alt: pick('alt'),
    am: {
      eyebrow: pick('eyebrowAm'),
      heading: pick('headingAm'),
      paragraphs: list('paragraphsAm', base.paragraphsAm.length),
      caption: pick('captionAm'),
    },
    photo,
    focus,
    customPhoto: !!photoSaved,
  };
}

/** Saves the owner's edits (already trimmed and length-limited by the route). */
const saveStoryCopy = (copy) => settings.set('story_copy', JSON.stringify(copy));

async function saveStoryPhoto(buffer) {
  const base = `founder-${crypto.randomBytes(5).toString('hex')}`;
  const manifest = await saveStoryVariants(buffer, UPLOAD_DIR, base);
  await removeStoryPhoto();
  await settings.set('story_photo', JSON.stringify(manifest));
  return manifest;
}

async function removeStoryPhoto() {
  const saved = readJson(settings.get('story_photo'), null);
  if (!saved) return;
  const files = await fs.readdir(UPLOAD_DIR).catch(() => []);
  await Promise.all(
    files
      .filter((f) => f.startsWith(`${path.basename(saved.base)}-`))
      .map((f) => fs.unlink(path.join(UPLOAD_DIR, f)).catch(() => {}))
  );
  await settings.set('story_photo', '');
}

const saveFocus = (x, y) => settings.set('story_focus', JSON.stringify({ x, y }));

module.exports = {
  WIDTHS,
  saveStoryVariants,
  getStory,
  saveStoryCopy,
  saveStoryPhoto,
  removeStoryPhoto,
  saveFocus,
};
