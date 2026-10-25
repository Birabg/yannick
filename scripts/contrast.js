/** Prints WCAG contrast ratios for the colour pairs the design relies on. */
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const pairs = [
  ['ink on ivory', '#1C1714', '#F7F3EC'],
  ['ink on stone', '#1C1714', '#EAE3D7'],
  ['taupe on ivory', '#6B5F54', '#F7F3EC'],
  ['taupe on stone', '#6B5F54', '#EAE3D7'],
  ['brief taupe on ivory', '#7A6E63', '#F7F3EC'],
  ['bordeaux on ivory', '#5B1A24', '#F7F3EC'],
  ['bordeaux on stone', '#5B1A24', '#EAE3D7'],
  ['ivory on bordeaux', '#F7F3EC', '#5B1A24'],
  ['ivory on ink', '#F7F3EC', '#1C1714'],
  ['taupe-dark on ink', '#B3A798', '#1C1714'],
  ['brass on ink', '#A68A5B', '#1C1714'],
  ['danger on ivory', '#8C1D18', '#F7F3EC'],
];
for (const [name, fg, bg] of pairs) console.log(ratio(fg, bg).toFixed(2).padStart(6), name);
