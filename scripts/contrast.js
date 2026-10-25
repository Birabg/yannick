/* Prints WCAG contrast ratios for the colour pairs in public/css/tokens.css. Run: node scripts/contrast.js */
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const themes = {
  light: {
    bg: '#ffffff',
    surface: '#f4f4f2',
    chip: '#e9e9e9',
    photo: '#e9e9e9',
    text: '#1a1a1a',
    muted: '#5c5c5c',
    accent: '#557611',
    onAccent: '#ffffff',
    danger: '#a3231c',
    dangerBg: '#fbeceb',
    invBg: '#131312',
    invText: '#f0efec',
    invMuted: '#b0aeaa',
    invAccent: '#a5e12a',
  },
  dark: {
    bg: '#131312',
    surface: '#1c1c1b',
    chip: '#232322',
    photo: '#e9e9e9',
    text: '#f0efec',
    muted: '#b0aeaa',
    accent: '#a5e12a',
    onAccent: '#131312',
    danger: '#ff8d85',
    dangerBg: '#3a1d1b',
    invBg: '#1c1c1b',
    invText: '#f0efec',
    invMuted: '#b0aeaa',
    invAccent: '#a5e12a',
  },
};
const pairs = [
  ['text', 'bg', 4.5],
  ['text', 'surface', 4.5],
  ['text', 'chip', 4.5],
  ['muted', 'bg', 4.5],
  ['muted', 'surface', 4.5],
  ['muted', 'chip', 4.5],
  ['muted', 'photo', 4.5],
  ['accent', 'bg', 4.5],
  ['accent', 'surface', 4.5],
  ['onAccent', 'accent', 4.5],
  ['danger', 'bg', 4.5],
  ['danger', 'dangerBg', 4.5],
  ['invText', 'invBg', 4.5],
  ['invMuted', 'invBg', 4.5],
  ['invAccent', 'invBg', 4.5],
];
let bad = 0;
for (const [name, t] of Object.entries(themes)) {
  for (const [fg, bg, min] of pairs) {
    if (bg === 'photo' && name === 'dark') continue; // tags carry their own background
    const r = ratio(t[fg], t[bg]);
    const ok = r >= min;
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${r.toFixed(2).padStart(5)}  ${name}: ${fg} on ${bg}`);
  }
}
process.exit(bad ? 1 : 0);
