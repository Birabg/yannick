/**
 * Builds the Our Story photo from public/img/originals/founder.* into public/img/story/ (AVIF + WebP at
 * 480, 800, 1200 and 1600 wide, never upscaled, metadata stripped). The original is never changed.
 *
 *   node scripts/make-story.js
 *
 * The supplied photo is a screenshot with the gallery's left and right arrow buttons at its edges, so a 4:5
 * crop that leaves them out is made first (CROP below, in pixels of the original).
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const { saveStoryVariants } = require('../src/lib/story');

const ORIGINALS = path.join(__dirname, '..', 'public', 'img', 'originals');
const OUT = path.join(__dirname, '..', 'public', 'img', 'story');
const CROP = { left: 45, top: 50, width: 555, height: 694 };

(async () => {
  const files = (await fs.readdir(ORIGINALS)).filter((f) => /^founder\.(jpe?g|png|webp)$/i.test(f));
  if (files.length !== 1)
    throw new Error(`Expected one founder.* in originals, found: ${files.join(', ') || 'none'}`);
  const source = path.join(ORIGINALS, files[0]);
  const meta = await sharp(source).rotate().metadata();
  console.log(`original: ${files[0]} ${meta.width}x${meta.height}`);
  const crop = await sharp(source).rotate().extract(CROP).toBuffer();
  const manifest = await saveStoryVariants(crop, OUT, 'founder');
  await fs.writeFile(path.join(OUT, 'story.json'), JSON.stringify(manifest, null, 2));
  for (const w of manifest.widths) {
    const [a, b] = await Promise.all(
      ['avif', 'webp'].map((e) => fs.stat(path.join(OUT, `founder-${w}.${e}`)))
    );
    console.log(
      `founder-${w}: avif ${(a.size / 1024).toFixed(0)} KB, webp ${(b.size / 1024).toFixed(0)} KB`
    );
  }
})();
