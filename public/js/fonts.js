/**
 * The two faces the first screen does not need: the large Ethiopic face (the Amharic toggle label and Amharic
 * copy) and the handwriting face (signatures). They are fetched from here, on the visitor's first interaction or
 * when Amharic is chosen, instead of from the stylesheet, so they never compete with the headline and the first
 * bottles (the Ethiopic file alone is about 200 KB).
 */
const FACES = [
  [
    'Noto Sans Ethiopic',
    '/fonts/noto-sans-ethiopic-ethiopic-wght-normal.woff2',
    {
      weight: '100 900',
      style: 'normal',
      display: 'swap',
      unicodeRange: 'U+1200-139F, U+2D80-2DDF, U+AB00-AB2F',
    },
  ],
  [
    'Caveat',
    '/fonts/caveat-latin-600-normal.woff2',
    { weight: '600', style: 'normal', display: 'swap' },
  ],
];
let started = false;

export function loadLateFonts() {
  if (started || !('FontFace' in window)) return;
  started = true;
  FACES.forEach(([family, url, descriptors]) => {
    const face = new FontFace(family, `url(${url}) format('woff2')`, descriptors);
    face.load().then(
      () => document.fonts.add(face),
      () => {}
    );
  });
}
