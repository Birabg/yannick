/**
 * Site-wide pictures that are not products: the founder portrait (Our Story) and the share image
 * (WhatsApp, TikTok, Google). Each can be replaced in /admin/images; until then a built-in default shows.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const site = require('../../config/site');
const { uploadsDir } = require('../env');
const { settings } = require('../db');

const DIR = path.join(uploadsDir, 'site');

const SLOTS = {
  founder: {
    label: 'Founder portrait',
    use: 'Our Story section',
    fallback: site.founderPhoto,
    width: 1000,
    height: 1250,
    ext: 'webp',
    hint: 'A portrait, 4:5. It is cropped to fit the frame, so keep the face near the centre.',
  },
  share: {
    label: 'Share image',
    use: 'Link previews on WhatsApp, TikTok, Facebook and Google',
    fallback: '/img/og-default.png',
    width: 1200,
    height: 630,
    ext: 'jpg',
    hint: 'Saved at 1200 x 630. Use a wide photo of your shelf or display.',
  },
};

const key = (slot) => `img_${slot}`;

/** URL of a site image: the uploaded one, else the default. */
function siteImage(slot) {
  const name = settings.get(key(slot));
  return name ? `/uploads/site/${name}` : SLOTS[slot].fallback;
}

const isCustom = (slot) => !!settings.get(key(slot));

async function saveSiteImage(slot, buffer) {
  const def = SLOTS[slot];
  await fs.mkdir(DIR, { recursive: true });
  const name = `${slot}-${crypto.randomBytes(5).toString('hex')}.${def.ext}`;
  const image = sharp(buffer, { failOn: 'error' })
    .rotate()
    .flatten({ background: '#ffffff' })
    .resize({ width: def.width, height: def.height, fit: 'cover', position: 'attention' });
  await (
    def.ext === 'jpg' ? image.jpeg({ quality: 84, mozjpeg: true }) : image.webp({ quality: 82 })
  ).toFile(path.join(DIR, name));
  await removeSiteImage(slot);
  settings.set(key(slot), name);
  return name;
}

async function removeSiteImage(slot) {
  const old = settings.get(key(slot));
  if (old) await fs.unlink(path.join(DIR, path.basename(old))).catch(() => {});
  settings.set(key(slot), '');
}

module.exports = { SLOTS, siteImage, isCustom, saveSiteImage, removeSiteImage };
