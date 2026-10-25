/**
 * Builds the footer photo from public/img/originals/footer.* into public/img/footer/ (the original is never touched).
 *
 *   node scripts/make-footer.js
 *
 * Landscape: AVIF + WebP at 1280, 1920, 2560 and the original width (never upscaled).
 * Portrait (phones): footer-mobile.* if it exists, otherwise a 4:5 crop around the brightest area.
 * Prints the sizes and writes public/img/footer/footer.json, which the footer template reads.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const ORIGINALS = path.join(__dirname, '..', 'public', 'img', 'originals');
const OUT = path.join(__dirname, '..', 'public', 'img', 'footer');
const LANDSCAPE_WIDTHS = [1280, 1920, 2560];
const PORTRAIT_WIDTHS = [640, 960, 1280];

const find = async (name) => {
  const files = await fs.readdir(ORIGINALS);
  const hit = files.find((f) => new RegExp(`^${name}\\.(jpe?g|png|webp|avif|tiff?)$`, 'i').test(f));
  return hit ? path.join(ORIGINALS, hit) : null;
};

/** Left edge of a 4:5 crop, centred on the brightest column band of the photo. */
async function brightestCrop(file, meta) {
  const cropW = Math.round((meta.height * 4) / 5);
  const small = await sharp(file)
    .resize({ width: 400 })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = small.info;
  const scale = meta.width / width;
  const columns = new Array(width).fill(0);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) columns[x] += small.data[y * width + x] ** 2;
  const win = Math.round(cropW / scale);
  let best = 0;
  let bestSum = -1;
  let sum = columns.slice(0, win).reduce((a, b) => a + b, 0);
  for (let x = 0; x + win <= width; x++) {
    if (x > 0) sum += columns[x + win - 1] - columns[x - 1];
    if (sum > bestSum) {
      bestSum = sum;
      best = x;
    }
  }
  return { left: Math.round(best * scale), width: cropW };
}

async function write(input, widths, prefix, report) {
  const meta = await sharp(input).metadata();
  const sizes = [
    ...new Set(
      widths
        .map((w) => Math.min(w, meta.width))
        .concat(meta.width <= Math.max(...widths) ? [] : [meta.width])
    ),
  ];
  for (const w of sizes) {
    const base = sharp(input).resize({ width: w, withoutEnlargement: true });
    const info = await base
      .clone()
      .avif({ quality: 80, effort: 6, chromaSubsampling: '4:4:4' })
      .toFile(path.join(OUT, `${prefix}-${w}.avif`));
    await base
      .clone()
      .webp({ quality: 88, smartSubsample: false, effort: 5 })
      .toFile(path.join(OUT, `${prefix}-${w}.webp`));
    const webp = (await fs.stat(path.join(OUT, `${prefix}-${w}.webp`))).size;
    report.push({ prefix, width: info.width, height: info.height, avif: info.size, webp });
  }
  return sizes;
}

(async () => {
  const src = await find('footer');
  if (!src) throw new Error('No footer.* in public/img/originals');
  await fs.mkdir(OUT, { recursive: true });
  const meta = await sharp(src).metadata();
  const report = [];

  // the original width is part of the set
  const landscapeWidths = [...LANDSCAPE_WIDTHS.filter((w) => w < meta.width), meta.width];
  const landscape = await write(src, landscapeWidths, 'footer', report);

  let portraitSrc = await find('footer-mobile');
  let cropInfo = 'footer-mobile.*';
  if (!portraitSrc) {
    const crop = await brightestCrop(src, meta);
    const buf = await sharp(src)
      .extract({ left: crop.left, top: 0, width: crop.width, height: meta.height })
      .toBuffer();
    portraitSrc = buf;
    cropInfo = `4:5 crop at x=${crop.left}, ${crop.width}x${meta.height}`;
  }
  const portrait = await write(portraitSrc, PORTRAIT_WIDTHS, 'footer-portrait', report);

  const pm = await sharp(portraitSrc).metadata();
  const manifest = {
    landscape: { widths: landscape, ratio: [meta.width, meta.height] },
    portrait: { widths: portrait, ratio: [pm.width, pm.height] },
  };
  await fs.writeFile(path.join(OUT, 'footer.json'), JSON.stringify(manifest, null, 2));
  console.log(`portrait source: ${cropInfo}`);
  for (const r of report) {
    console.log(
      `${r.prefix.padEnd(16)} ${String(r.width).padStart(4)}x${String(r.height).padEnd(4)} avif ${(r.avif / 1024).toFixed(0).padStart(5)} KB  webp ${(r.webp / 1024).toFixed(0).padStart(5)} KB`
    );
  }
})();
