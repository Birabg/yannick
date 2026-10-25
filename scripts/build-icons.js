/**
 * Generates the PNG/ICO favicon set and the social share image from public/favicon.svg.
 * Run once with `npm run build:icons`; the outputs are committed.
 */
const fs = require('node:fs');
const path = require('node:path');
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

async function main() {
  const write = (name, data) => fs.writeFileSync(path.join(pub, name), data);
  write('favicon-32.png', await png(32));
  write('apple-touch-icon.png', await png(180));
  write('icon-192.png', await png(192));
  write('icon-512.png', await png(512));
  write('favicon.ico', ico(await png(48), 48));

  const mark = await png(220);
  const card = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="#0e0c0a"/>
      <rect x="24" y="24" width="1152" height="582" fill="none" stroke="#c9a45c" stroke-opacity="0.45" stroke-width="2"/>
      <text x="600" y="400" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="84" fill="#f4ede0" letter-spacing="10">YANNICK SCENTS</text>
      <text x="600" y="470" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="38" font-style="italic" fill="#d4b06a">A Good Scent Speaks First</text>
    </svg>`);
  await sharp(card)
    .composite([{ input: mark, left: 490, top: 70 }])
    .png()
    .toFile(path.join(pub, 'img', 'og-default.png'));
  console.log('Icons and share image written to public/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
