/**
 * Builds every logo file from the one source, public/img/Logo/*.jpg (640 x 640, gold on near-black).
 * The original is never changed. Run with `npm run build:logo`; the outputs are committed.
 *
 *   public/img/brand/logo-{96,192,384}.webp  round badge (transparent corners) for header, footer, admin
 *   public/favicon.ico, favicon-32.png, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
 *   public/img/og-default.png                1200 x 630 share image
 */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const pub = path.join(__dirname, '..', 'public');
const dir = path.join(pub, 'img', 'Logo');
const source = path.join(dir, fs.readdirSync(dir).find((f) => /\.(jpe?g|png)$/i.test(f)));
const out = path.join(pub, 'img', 'brand');
const BG = { r: 14, g: 12, b: 10 }; // the badge's own near-black, so padding is seamless

/** The artwork's circle sits inside the square; cut the corners to transparent. */
async function badge(size) {
  const r = size / 2;
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${r}" cy="${r}" r="${r}"/></svg>`);
  return sharp(source).resize(size, size).composite([{ input: mask, blend: 'dest-in' }]);
}

/** Just the bottle and YS monogram: the wordmark cannot be read at 16 to 48 px. */
const mark = () => sharp(source).extract({ left: 185, top: 95, width: 270, height: 270 });

function ico(images) {
  const head = Buffer.alloc(6 + 16 * images.length);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(images.length, 4);
  let offset = head.length;
  images.forEach(({ size, data }, n) => {
    const at = 6 + n * 16;
    head.writeUInt8(size, at);
    head.writeUInt8(size, at + 1);
    head.writeUInt16LE(1, at + 4);
    head.writeUInt16LE(32, at + 6);
    head.writeUInt32LE(data.length, at + 8);
    head.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([head, ...images.map((i) => i.data)]);
}

async function main() {
  fs.mkdirSync(out, { recursive: true });
  for (const size of [96, 192, 384]) {
    await (await badge(size)).webp({ quality: 90, alphaQuality: 100 }).toFile(path.join(out, `logo-${size}.webp`));
  }

  const square = async (size, pad = 0) => {
    const inner = Math.round(size * (1 - pad * 2));
    const body = await mark().resize(inner, inner).png().toBuffer();
    return sharp({ create: { width: size, height: size, channels: 3, background: BG } })
      .composite([{ input: body, gravity: 'centre' }])
      .png({ compressionLevel: 9 })
      .toBuffer();
  };
  const w = (name, data) => fs.writeFileSync(path.join(pub, name), data);
  w('favicon-32.png', await square(32));
  w('apple-touch-icon.png', await square(180));
  w('icon-192.png', await square(192));
  w('icon-512.png', await square(512));
  w('icon-maskable-512.png', await square(512, 0.1)); // 20% total padding keeps the mark inside the safe zone
  w('favicon.ico', ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await square(size) })))));

  const glow = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><radialGradient id="g" cx="50%" cy="50%" r="55%"><stop offset="0" stop-color="#ffa100" stop-opacity=".28"/><stop offset="1" stop-color="#ffa100" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="630" fill="#0e0c0a"/><rect width="1200" height="630" fill="url(#g)"/></svg>`);
  await sharp(glow)
    .composite([{ input: await (await badge(560)).png().toBuffer(), gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(pub, 'img', 'og-default.png'));
  console.log('Logo files written from', path.basename(source));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
