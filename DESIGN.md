# Yannick Scents: design system

Source of truth for the look. Tokens live in `public/css/tokens.css`; the live sheet is at `/styleguide`.
The system is the **formicai.dev kit (Livery v1)**, applied one area per commit
(`git log --grep "livery(formicai.dev v1)"`). It replaced the earlier classic ivory/bordeaux design (commit `16665ff`);
`git revert` the area commits, or check out that commit, to go back.

A light interface on a near-white neutral background where a lime accent marks the next step.
Type is Urbanist set tight at large sizes, controls are fully rounded, depth comes from soft neutral shadows.

## Principles

1. **One accent, used sparingly.** Lime (`--c-accent`) is for primary actions, links, active states and focus. Nothing else.
2. **Soft, neutral depth.** 1px rings and one faint float shadow (`0 4px 24px rgb(0 0 0 / 0.04)`). Never tinted.
3. **Big type, quiet body.** Tight headings (tracking -0.02em), calm 16px body.
4. **Rounded and approachable.** Pills for buttons, tabs and fields; 14 to 16px for cards.

Never: coloured shadows, a second accent, positive tracking on headings, square buttons, all-caps button labels, a second display typeface.

## Colour

| Token         | Light          | Dark           | Use                               |
| ------------- | -------------- | -------------- | --------------------------------- |
| `--c-bg`      | `#FFFFFF`      | `#131312`      | Page                              |
| `--c-surface` | `#F4F4F2`      | `#1C1C1B`      | Alternate bands                   |
| `--c-chip`    | `#E9E9E9`      | `#232322`      | Badges, skeletons, image backdrop |
| `--c-text`    | `#1A1A1A`      | `#F0EFEC`      | Text                              |
| `--c-muted`   | `#5C5C5C`      | `#B0AEAA`      | Secondary text                    |
| `--c-accent`  | `#557611`      | `#A5E12A`      | Actions, links, focus             |
| `--c-border`  | `#E5E5E5`      | `#2A2A29`      | 1px lines                         |
| `--c-danger`  | `#A3231C`      | `#FF8D85`      | Errors only                       |
| `--c-inv-*`   | `#131312` band | `#1C1C1B` band | Inverse section (journey, footer) |

The dark theme follows the system setting (`prefers-color-scheme`); there is no toggle.
`node scripts/contrast.js` checks every pair in both themes (all at least 4.5:1).
`--c-surface` (`#F4F4F2`) is lighter than the kit's `#E9E9E9` so large bands stay calm; the kit's grey is used for chips and image backdrops.

## Type

Urbanist (OFL, self-hosted in `public/fonts/`), one family for everything. Amharic falls back to Noto Sans Ethiopic, loaded only when needed.

- Hero `--t-xl` 40 to 72px, section titles `--t-l` 30 to 48px, `--t-m` 24 to 30px, `--t-s` 20px.
- Body 16px / 1.7, max 65ch. Small 14px. Labels 12px, sentence case.
- Weights 400, 500 (headings 500, prices 700). Tabular figures everywhere.
- The kit's 12px body is not used: 16px keeps phone text readable.
- A word wrapped in `*asterisks*` in config strings becomes the muted second tone of a title.

## Space, shape, depth

- Container 1080px, section padding 80px on desktop (56px on phones), header 56px sticky with a hairline.
- Space scale in 8px steps (`--s-1` to `--s-9`).
- Radii: 6px chips, 8px fields, 14 to 16px cards, pill (9999px) buttons, tabs, search and sort.
- Borders 1px `--c-border`; focus ring 2px `--c-accent`, offset 2px.

## Components

- **Button**: pill, 48px min height, sentence case, weight 500. Primary = solid lime; secondary = outlined; dark = solid text colour. Hover darkens by mixing with black, no movement.
- **Tab**: pill chip with a 1px border; selected = filled with the text colour.
- **Card** (product): 16px corners, 1px border, 16px padding, 4:5 image on `--c-chip`. Hover: border darkens, float shadow. Nothing moves.
- **Tag**: 6px chip. New = lime, Best seller = text colour, Sample = dashed outline.
- **Panel**: right drawer from 760px, bottom sheet with 16px top corners below; native `<dialog>`, focus trapped.
- **Meter**: five 6px pills; filled ones are lime.
- **Fields**: 8px radius (search and sort are pills), 1px border, accent ring on focus, inline errors in `--c-danger`.
- **States**: loading (shimmer, spinner), empty, error, disabled and sold out are all designed; see `/styleguide`.

## Motion

- Default 150ms `ease` for colour; panels and shadows 300ms; reveals 700ms.
- Scroll reveal: clip-path wipe (`cubic-bezier(0.23, 1, 0.32, 1)`), staggered 120ms.
- Hero copy enters with a 420ms fade from a 4px blur.
- Skeleton shimmer 1.4s; spinner 1.1s; the houses rail scrolls once per 80s and pauses on hover.
- Everything above stops under `prefers-reduced-motion` (the rail becomes a wrapped grid).

## Details

Tabular numerals, fine grain on dark bands, filled gradient on the hero's second line, masked rail edges, thin scrollbars, accent selection colour.

## Voice

Concise, calm, conversational. Sentences around 11 words, sentence-case headings, no exclamation marks, buttons of about three words ("Order on WhatsApp", "Find your scent"). No invented reviews, numbers or claims.

## Accessibility

AA contrast in both themes, 48px touch targets, visible focus, native dialog and details, reduced motion respected, Amharic typography overrides (no letter-spacing, taller lines).

## Imagery

Photograph bottles on plain white: the card multiplies the picture onto `--c-chip`. Sample products carry a dashed "Sample" tag until replaced.
