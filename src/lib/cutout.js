/**
 * Lifts a plain studio backdrop off a product photo so the bottle keeps its true colours on the
 * scent-coloured card (a multiply blend would tint the glass). It only acts when the photo's border
 * is a near-uniform light colour; anything else is returned untouched and the card blends the photo instead.
 *
 * The backdrop is found by growing a region inward from the border: a pixel joins when it is close to
 * the border colour and to the pixel it grew from, so dark outlines stop it and whites inside the label
 * or glass (not connected to the border) stay. The edge is then pulled in one pixel and softened.
 */
const sharp = require('sharp');

const MAX_FROM_BORDER = 70; // furthest a backdrop pixel may be from the border colour (per channel)
const MAX_STEP = 14; // largest jump between neighbouring backdrop pixels (shadows and gradients are gentle)
const MIN_LIGHT = 150; // the border must be lighter than this to count as a studio backdrop

const median = (values) => values.sort((a, b) => a - b)[values.length >> 1];

/** Returns { data (RGBA buffer), width, height, applied } for an RGB(A) buffer on white. */
async function cutout(input) {
  const { data, info } = await sharp(input)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const px = (i) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];

  // The border colour: the median of the outer ring, which must itself be consistent.
  const ring = [];
  for (let x = 0; x < w; x += 1) ring.push(0 * w + x, (h - 1) * w + x);
  for (let y = 0; y < h; y += 1) ring.push(y * w, y * w + w - 1);
  const channels = [0, 1, 2].map((c) => median(ring.map((i) => data[i * 3 + c])));
  const ringOk =
    ring.filter((i) => px(i).every((v, c) => Math.abs(v - channels[c]) <= MAX_FROM_BORDER / 2))
      .length /
      ring.length >
    0.9;
  if (!ringOk || Math.min(...channels) < MIN_LIGHT) return { applied: false };

  const near = (i) => px(i).every((v, c) => Math.abs(v - channels[c]) <= MAX_FROM_BORDER);
  const bg = new Uint8Array(w * h);
  const stack = [];
  const push = (i) => {
    if (!bg[i] && near(i)) {
      bg[i] = 1;
      stack.push(i);
    }
  };
  ring.forEach(push);
  while (stack.length) {
    const i = stack.pop();
    const x = i % w;
    const y = (i - x) / w;
    const from = px(i);
    const visit = (j) => {
      if (bg[j] || !near(j)) return;
      if (!px(j).every((v, c) => Math.abs(v - from[c]) <= MAX_STEP)) return;
      bg[j] = 1;
      stack.push(j);
    };
    if (x > 0) visit(i - 1);
    if (x < w - 1) visit(i + 1);
    if (y > 0) visit(i - w);
    if (y < h - 1) visit(i + w);
  }

  const covered = bg.reduce((n, v) => n + v, 0) / (w * h);
  if (covered < 0.08 || covered > 0.93) return { applied: false };

  // Alpha: subject = 255. Pull the edge in by one pixel, then soften it.
  const alpha = Buffer.alloc(w * h, 255);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x;
      const edge =
        bg[i] ||
        (x > 0 && bg[i - 1]) ||
        (x < w - 1 && bg[i + 1]) ||
        (y > 0 && bg[i - w]) ||
        (y < h - 1 && bg[i + w]);
      if (edge) alpha[i] = 0;
    }
  }
  const { data: soft, info: softInfo } = await sharp(alpha, {
    raw: { width: w, height: h, channels: 1 },
  })
    .blur(0.9)
    .toColourspace('b-w')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i += 1) {
    out[i * 4] = data[i * 3];
    out[i * 4 + 1] = data[i * 3 + 1];
    out[i * 4 + 2] = data[i * 3 + 2];
    out[i * 4 + 3] = soft[i * softInfo.channels];
  }
  return { applied: true, data: out, width: w, height: h };
}

module.exports = { cutout };
