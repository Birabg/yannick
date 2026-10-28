/**
 * Finds the backdrop colour of every product photo and stores it (bg_color, top, bottom, dark/light).
 *   npm run image-colors
 * Safe to re-run: it only writes the detected colours. A colour the owner chose in the admin
 * (bg_override) is kept separately and is never touched.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const { db, ready, products } = require('../src/db');
const { detectBackground } = require('../src/lib/bgcolor');
const { PRODUCT_DIR } = require('../src/lib/images');
const { widthsOf } = require('../src/lib/photo');

async function main() {
  await ready();
  const rows = [];
  for (const p of await products.list()) {
    if (!p.image) continue;
    const widest = Math.max(...widthsOf(p));
    const suffix = p.imageW && widthsOf(p).length ? widest : 'lg';
    const file = path.join(PRODUCT_DIR, `${p.image}-${suffix}.webp`);
    try {
      const bg = await detectBackground(await fs.readFile(file));
      await products.setBackground(p.id, {
        bg_color: bg.color,
        bg_color_top: bg.top,
        bg_color_bottom: bg.bottom,
        bg_is_dark: bg.isDark,
        bg_mode: bg.mode,
      });
      rows.push([
        p.name,
        bg.mode,
        bg.color,
        bg.top,
        bg.bottom,
        bg.isDark ? 'dark' : 'light',
        p.bgOverride ? `override ${p.bgOverride}` : '',
      ]);
    } catch (err) {
      rows.push([p.name, `skipped: ${err.message}`]);
    }
  }
  console.table(
    rows.map(([name, mode, color, top, bottom, tone, note]) => ({
      name,
      mode,
      color,
      top,
      bottom,
      tone,
      note,
    }))
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.close());
