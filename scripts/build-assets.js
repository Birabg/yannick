/**
 * Generates the favicon set, the social share card and the paper-grain tile.
 * Run with `npm run build:assets`; the outputs in public/ are committed.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');

const pub = path.join(__dirname, '..', 'public');
const svg = fs.readFileSync(path.join(pub, 'favicon.svg'));
const png = (size) => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();

/** An .ico may embed PNG data directly (supported by all current browsers). */
function ico(pngBuffer, size) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count
  header.writeUInt8(size, 6); // width
  header.writeUInt8(size, 7); // height
  header.writeUInt16LE(1, 10); // colour planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(pngBuffer.length, 14);
  header.writeUInt32LE(22, 18); // data offset
  return Buffer.concat([header, pngBuffer]);
}

/** 240px tile of faint ink specks; tiles seamlessly because every pixel is independent. */
async function grain() {
  const size = 240;
  const raw = Buffer.alloc(size * size * 4);
  const noise = crypto.randomBytes(size * size);
  for (let i = 0; i < size * size; i++) {
    raw[i * 4] = 20;
    raw[i * 4 + 1] = 17;
    raw[i * 4 + 2] = 15;
    raw[i * 4 + 3] = noise[i] > 215 ? Math.round((noise[i] - 215) * 1.1) : 0;
  }
  await sharp(raw, { raw: { width: size, height: size, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(pub, 'img', 'grain.png'));
}

async function shareCard() {
  const card = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="#ff5a1f"/>
      <rect x="28" y="28" width="1144" height="574" fill="none" stroke="#14110f" stroke-width="6"/>
      <g font-family="Arial Black, Arial, Helvetica, sans-serif" fill="#14110f" font-weight="900">
        <text x="70" y="215" font-size="150" letter-spacing="-8">A GOOD SCENT</text>
        <text x="70" y="355" font-size="150" letter-spacing="-8">SPEAKS FIRST.</text>
      </g>
      <rect x="70" y="440" width="560" height="84" rx="10" fill="#14110f"/>
      <text x="100" y="496" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="40" font-weight="900" fill="#f4efe6" letter-spacing="1">YANNICK SCENTS</text>
      <text x="1130" y="496" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#14110f">Addis Ababa</text>
    </svg>`);
  await sharp(card)
    .png()
    .toFile(path.join(pub, 'img', 'og-default.png'));
}

async function main() {
  const write = (name, data) => fs.writeFileSync(path.join(pub, name), data);
  write('favicon-32.png', await png(32));
  write('apple-touch-icon.png', await png(180));
  write('icon-192.png', await png(192));
  write('icon-512.png', await png(512));
  write('favicon.ico', ico(await png(48), 48));
  await grain();
  await shareCard();
  console.log('Icons, grain tile and share card written to public/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
