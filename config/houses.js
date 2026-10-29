/**
 * The "Houses We Carry" marquee on the home page.
 *
 * `seed` is the starting list. Every brand on a perfume in the admin is added automatically, and the
 * houses are shown with the most perfumes first (see src/lib/houses.js), so this list only guarantees
 * that these houses are always there (they read "Coming soon" while they have no bottle).
 *
 * `palette` is one deep colour per house, keyed by slug: [top-left, bottom-right, glow] for each theme.
 * The dark variants are a little deeper. Text on the cards is always `--house-ink`, and every pair
 * is kept at 4.5:1 or better (checked by `node scripts/check-houses.js`). House names are typeset in the
 * site font, never a logo. Brands without an entry take `fallback` in turn.
 */
const seed = ['Hugo Boss', 'Afnan', 'Dior', 'Chanel', 'Versace', 'Louis Vuitton'];

const palette = {
  'hugo-boss': {
    light: ['#235c41', '#0f3125', '#6fd3a0'],
    dark: ['#1f5640', '#0b261c', '#4fb585'],
  },
  afnan: {
    light: ['#7d4226', '#43200f', '#e6a47a'],
    dark: ['#6f3a21', '#331609', '#c9835a'],
  },
  dior: {
    light: ['#8c2740', '#4a1022', '#f08aa5'],
    dark: ['#6f1d33', '#33091a', '#d86b88'],
  },
  chanel: {
    light: ['#3a3a3f', '#18181b', '#e8c46a'],
    dark: ['#2c2c31', '#0f0f12', '#d9b45a'],
    edge: '#c9a24a',
  },
  versace: {
    light: ['#6e4f0b', '#3d2a04', '#f2c55c'],
    dark: ['#62470a', '#2f2102', '#d9a93e'],
  },
  'louis-vuitton': {
    light: ['#5e3a26', '#2c1a10', '#d9a77f'],
    dark: ['#4a2d1c', '#20120a', '#bf8a63'],
  },
  azzaro: {
    light: ['#2f4a6b', '#142236', '#8fb7e6'],
    dark: ['#233a56', '#0d1829', '#6d9bd0'],
  },
  creed: {
    light: ['#1b4f57', '#0b272c', '#7fd0da'],
    dark: ['#17464e', '#081f24', '#5bb3be'],
  },
  prada: {
    light: ['#434f24', '#1f260d', '#c4d68a'],
    dark: ['#3c4720', '#181d09', '#a3b86a'],
  },
  valentino: {
    light: ['#6b2d5a', '#331229', '#e69acd'],
    dark: ['#54224a', '#260c20', '#c97cb5'],
  },
};

/** For a brand added in the admin that has no colour above: taken in order, so a new house is never plain. */
const fallback = [
  { light: ['#2f4a6b', '#142236', '#8fb7e6'], dark: ['#233a56', '#0d1829', '#6d9bd0'] },
  { light: ['#6b2d5a', '#331229', '#e69acd'], dark: ['#54224a', '#260c20', '#c97cb5'] },
  { light: ['#434f24', '#1f260d', '#c4d68a'], dark: ['#3c4720', '#181d09', '#a3b86a'] },
  { light: ['#1b4f57', '#0b272c', '#7fd0da'], dark: ['#17464e', '#081f24', '#5bb3be'] },
  { light: ['#6e4f0b', '#3d2a04', '#f2c55c'], dark: ['#62470a', '#2f2102', '#d9a93e'] },
  { light: ['#8c2740', '#4a1022', '#f08aa5'], dark: ['#6f1d33', '#33091a', '#d86b88'] },
];

/** Text on every card (name, count). The count uses `inkSoft`. */
const ink = '#fff7ea';
const inkSoft = '#f1e8d9';

module.exports = { seed, palette, fallback, ink, inkSoft };
