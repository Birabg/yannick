# Yannick Scents: design system

Source of truth for the look. Tokens live in `public/css/tokens.css`; the live sheet is at `/styleguide`.
Earlier versions: classic ivory/bordeaux is commit `16665ff`; the formicai.dev kit is branch `livery/formicai-dev-v1`.

An editorial storefront: a clean paper page, huge tight grotesk headings, and notched colour cards (one bottle each)
that carry the energy. Ink does the work, amber is the only brand accent.

## Principles

1. **Paper and ink first.** Most of the page is `#FBFAF7` and `#14110F`. Colour comes from the scent-family cards.
2. **Amber is for fills, hover and the shader, never for text.** Amber or yellow text on a light background fails AA. On amber, text is ink. Amber carries buttons on dark areas, hover states and highlights.
3. **One shape.** Every card, FAQ block, order block, panel and photo uses the same 28px radius and the same notch.
4. **Huge type, quiet body.** Headings are Bricolage Grotesque 700 with tight tracking; body is calm 16px Urbanist.
5. **Hairlines, not shadows.** 1px ink at 10% separates things; there are no coloured shadows.

Never: amber or yellow text on white, a second brand accent, fake people, invented testimonials, text on top of the shader.

## Colour

| Token                                                                                         | Value                                                       | Use                                                   |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------- |
| `--paper`                                                                                     | `#FBFAF7`                                                   | Page, text on ink                                     |
| `--stone`                                                                                     | `#F2EFE8`                                                   | Bands, FAQ and order blocks                           |
| `--ink`                                                                                       | `#14110F`                                                   | Text, primary buttons, order panel                    |
| `--amber` `--gold` `--sun`                                                                    | `#FFA100` `#FFC800` `#FFDA00`                               | Hover, the shader, the heading marker, buttons on ink |
| `--fam-fresh` / `--fam-woody` / `--fam-oriental` / `--fam-men` / `--fam-women` / `--fam-none` | `#E9F056` `#1F5A43` `#D9651C` `#8FC6EE` `#F3C3D0` `#CFE0C6` | Card, pill and panel backdrops by scent family        |

A product's colour is its scent family (Fresh & Citrus, Woody Aromatic, Oriental & Gourmand), else its category (men, women), else the neutral sage
(`cardColor()` in `src/lib/format.js`). Text on a family colour is ink, except on woody green where it is paper (`--card-fg`).
A product's text colour on a family card is set by `--card-fg`.

## Theme

Light, Dark or System (default). The header button cycles Light, Dark, System (44px, `aria-pressed`, labelled); the mobile menu has a three-way group.
The choice is kept in `localStorage` (inside try/catch) and an inline, nonce-protected script in `<head>` (`views/partials/theme-init.ejs`) sets `data-theme`, `color-scheme` and `<meta name="theme-color">` before paint, so there is no flash. On System the page follows the OS live.
Admin uses the same tokens and toggle.

| Semantic token                   | Light             | Dark                    |
| -------------------------------- | ----------------- | ----------------------- |
| `--bg`                           | `#FBFAF7`         | `#100E0C`               |
| `--surface` / `--surface-2`      | paper / `#F2EFE8` | `#1A1714` / `#231F1B`   |
| `--text`                         | `#14110F`         | `#F4EFE6`               |
| `--text-muted`                   | ink, softened     | `#B3A89A`               |
| `--border`                       | ink 10%           | `rgba(255,255,255,.12)` |
| `--accent` / `--accent-contrast` | ink / paper       | amber `#FFA100` / ink   |
| `--focus`                        | ink               | amber                   |

Family colours are deepened a step in dark so cards sit comfortably on the near-black page. Photos get `--photo-filter` (brightness .92 in dark); the shader stays amber with a darker vignette (`--vignette`).
Colour-only 200ms transition (`html.theme-anim`), off under reduced motion. The legacy `--c-*` names are aliases of the semantic tokens. `node scripts/contrast.js` checks every pair in both themes (all at least 4.5:1, focus ring 3:1).

## Type

- **Bricolage Grotesque** (OFL, variable weight) for headings and wordmark. Hero `--t-hero` 45 to 112px, weight 700, tracking -0.055em, line height 0.92. Section titles `--t-l` 36 to 68px.
- **Urbanist** for body and UI. 16px / 1.7, max 65ch.
- **Caveat** only for signatures (the quote on the home page).
- Amharic falls back to Noto Sans Ethiopic, loaded only when needed, with no tracking and taller lines.
- Section labels are small and numbered: `01 ── The Collection`. Accent words in headings get a marker stroke (ink text on an amber band).

## The notch

A rounded step cut from the top-right corner of a card, as if a tab were removed. It is built with a CSS mask, not images, so it scales cleanly:
`--notch-mask` in `hero.css` stacks five gradient layers (two rectangles, a rounded outer corner, the lower strip, a rounded inner corner),
driven by `--nw` (width, 64px), `--nh` (height, 52px) and `--nr` (corner radius, 16px). Small cards use 48 / 40 / 12.
A 40px round button (ink, amber on hover) sits in the cut-out: an arrow on product and order cards, a plus on FAQ blocks.
Use `.notch` for a block with text (the mask is on a pseudo-element so the content is never clipped), or apply `mask: var(--notch-mask)` to a photo.

## Hero

Header: wordmark, centred nav (Home, Collection, Find your scent, Story, FAQ), then a search icon, an outline pill "Order on WhatsApp" and the `EN | አማ` control.
It is transparent over the hero and turns into a paper bar with a hairline after 40px.

Headline "A Good Scent / Speaks First" centred (three lines on phones), each word sliding up out of a mask. Left of it a rotating TikTok badge (text on a circle around a play button, linking to
the TikTok; the spin stops under reduced motion). Right of it three round bottle thumbnails and a plus that jumps to the collection (no people avatars).

Below, five tall notched cards in a staggered rhythm (outer cards tallest, the centre one lowest and shortest), two small cards tucked under the first and last,
and an ink "Explore the Collection" button under the centre card. The cards are real products, featured first (`heroProducts` in `src/routes/public.js`), so replacing a
photo in the admin updates the hero. Photos are white-background WebP multiplied onto the family colour. Each card lifts and shows name and price on hover (always visible on touch),
tilts a few degrees toward the cursor on desktop, and enters with a 60ms stagger. The first card image is preloaded.

Phones: the row becomes a horizontal scroll-snap carousel with the next card peeking (arrow keys scroll it), the badge sits above the headline, the button sits under the carousel,
and the existing bottom bar offers Call and WhatsApp. Tablets show three cards with the rhythm kept.

Foot of the hero: left, a short quote with a large mark and a handwritten signature. It is the first admin review that has text; with no reviews it is the founder's own line from
`config/site.js`, signed "Yannick". Never invented. Right, "01 Find your scent" with the line "Answer 3 questions and we pick your bottle" and an arrow to the quiz.

### Shader island

`public/js/hero/GlassBackground.tsx` (Swirl, ChromaFlow, FlutedGlass from `shaders/react`) is mounted by `island.tsx` only into elements marked `data-shader`: the centre hero card (behind its bottle)
and the panel next to the order text. It is never behind text. One esbuild bundle (`public/dist/js/hero/island.js`), loaded only on the home page, never in `/admin`.

- `public/js/hero-shader.js` needs all of: WebGPU with a real adapter, no `prefers-reduced-motion`, no `saveData`, more than 4 cores, not 2g. Otherwise the CSS gradient stays (it is always there underneath).
- The centre card mounts after first paint, when the browser is idle. The order panel waits until it is 400px from the viewport. Both fade in over 600ms.
- Rendering is capped at 1.5 device pixels per CSS pixel (the stage is shrunk and scaled back up by CSS). The package pauses itself when off-screen; browsers pause frames in hidden tabs.
- Touch screens get a slow automatic drift in place of a cursor. An error boundary drops the shader if it throws. Telemetry is disabled.
- Size: about 2.7 MB raw, about 780 KB gzip, well above a 200 KB budget. The lighter option is a hand-written WebGL fragment shader of about 3 KB with the same rules.

## Components

- **Button**: pill, 48px min, sentence case. Primary = ink fill (amber on ink areas); hover = amber. Outline = 1px ink; hover fills ink.
- **Pill** (filters, moods): outline pill; the active one wears its family colour (fresh lime, woody green, oriental orange, men sky, women pink; others ink).
- **Product card**: a notched card in the photo's own backdrop colour (see Photo backgrounds), with the words on the page below it. Hover lifts the bottle slightly; the arrow turns amber.
- **Panel**: right drawer from 760px, bottom sheet below; the header behind the close button and the photo area are the photo's backdrop colour, edge to edge, and the body is the theme surface with 24px rounded top corners. 28px outer corners.
- **Note cards**: three notched colour cards (Top, Heart, Base) with a typographic list of real notes.
- **FAQ**: stone blocks, notched, with the plus in the notch. **Order**: an ink notched panel with the text, a shader panel with a bottle photo beside it, then three stone blocks.
- **Fields**: pill search and sort, 1px `--c-line` outline, visible focus ring.

## Filter tabs and Most Loved

**Tabs** (`.tab`, `public/css/system.css`, colours `--tab-*` in `tokens.css`): pills (fully rounded), 44px tall, 20px padding, 12px gap, 13px uppercase at 0.14em tracking. Default is muted text on a hairline; hover brightens both; active has an amber border (`#B86E00` on paper so it keeps 3:1, `#FFA100` on dark), full-strength text and a faint amber tint. Order: All, Fresh & Citrus, Woody Aromatic, Men, Women, Affordable, Yannick's Hand Pick (`filterTabs` in `config/site.js`). A tab shows its count, "Men (11)", and is hidden while its section is empty. Centered on desktop; on phones one scroll-snap row with an edge fade, the active tab scrolled into view. The filter is in the address (`?filter=men`), the back button steps through filters, arrow keys / Home / End move between tabs. Sections come from each product's Collection sections in the admin, except **Affordable**, which follows the real price (see Prices). A section with no products shows "Nothing here yet. Ask Yannick on WhatsApp" with the WhatsApp button.

**Most Loved Right Now** (`#loved`, directly after the hero stack and above the collection, so the favourites are the first thing on the shelf and the filter bar stays attached to the grid): an outlined amber-border label above the heading on phones, beside it on desktop, then the same product card as the grid. Only perfumes ticked Best Seller appear, ordered by their "Best Seller position" number; four on desktop, a scroll-snap row with the next card peeking on phones. With none ticked the section is not rendered. The heading uses the site's display grotesk, not a serif, to stay with the rest of the page.

## Splash

A short branded intro on the home page, once per session. Files: `views/partials/splash-init.ejs` (flag script and inline CSS, in `<head>`), `views/partials/splash-art.ejs` (the inline SVG in a `<template>`, made from the identity kit `yannick-scents-logo.zip`, stacked dark logo, path numbers rounded to one decimal), and the small run script at the top of `views/home.ejs`. No library.

- **Look**: full-screen ink `#14110F` (same in both themes), centred. About 1.6s: the arch and baseline draw in (`stroke-dashoffset`), the serif Y rises, the amber droplet pops with a soft glow and eight mist dots that drift out and fade, "YANNICK" fades up while its width settles from 110% to 100% (tracking), "SCENTS" follows and its two amber lines draw out. At 1.15s the overlay slides up (450ms) off the hero. Easing `cubic-bezier(.22,.8,.2,1)`, no bounce. Only transform, opacity and stroke-dashoffset animate.
- **Hero hand-off**: the hero animations run once under the overlay (so LCP is unchanged), then restart when the overlay lifts (`html.sp-go` swaps the animation names; never remove that class or they replay).
- **When**: only the first page of a session, and only on the home page. Every public page writes `sessionStorage['ys-sp']` (in try/catch; if storage is blocked the splash is skipped), so a refresh, internal navigation, a direct `/perfume/:slug` or the 404 page never show it, and `/admin` does not load it. Skipped under `prefers-reduced-motion`. No JS, no splash: the overlay only exists once the inline script adds `html.sp` and clones the template.
- **Skip**: click or tap anywhere, any key, or the "Skip" button (a quick 160ms fade; the button stays out of the tab order so focus stays on the page). The overlay is `aria-hidden`.
- **Safety**: a hard timeout in the head script removes the overlay, the `sp` classes and restores the theme colour at 2.2s whatever happens. Scroll is locked only while `html.sp` is set (`scrollbar-gutter: stable` so nothing shifts). `<meta name="theme-color">` is ink while it shows (`theme.js` leaves it alone then) and returns to the theme value after.
- **Size**: inline CSS and JS are under 5KB together. The artwork markup is about 6.5KB more (about 2.5KB gzipped), because the kit's Y and lettering are outlined paths; shipped on the home page only.

## Footer

Always dark (`#14110F`) in both themes, full-bleed, about 100svh on desktop. Built in `views/partials/foot.ejs`, styled in `public/css/footer.css`, motion in `public/js/footer.js`.

1. Dark band with about 120px of top padding. Row inside the container: small mark (the favicon) and "Yannick Scents" at 20px on the left; three labelled `<nav>` columns on the right (Navigation, Order, Visit) with a white 15px heading and 13px links at 72% off-white, 34px rows (48px on phones). Only real targets are linked: page anchors, `tel:`, the wa.me link and the TikTok URL from `config/site.js`.
2. One thin copyright line under the columns ("(c) year Yannick Scents. Original fragrances only." and "Built by Bira Girma, linked with mailto:biragirma4@gmail.com"), 66% off-white, AA on the dark band.
3. The photo (`public/img/originals/footer.jpg`, never modified) fills the lower 65% edge to edge and fades up into the band with a long mask gradient, a soft dark overlay on its top and a fine grain. `scripts/make-footer.js` writes AVIF and WebP to `public/img/footer/`: landscape at 1280, 1920, 2560 and 3840 (original width, never upscaled), and a 4:5 portrait crop at 640, 960 and 1280 for phones (a `footer-mobile.*` original is used instead if one exists). `<picture>` swaps them at 700px. If the image fails, a dark to deep amber gradient shows.
4. A giant "Yannick" wordmark in off-white `#F2EEE8` at 95%, Bricolage Grotesque 800, SVG with a viewBox and fixed `textLength` so it spans 84% of the width (96% on phones), never wraps and is cut off by the bottom edge so only the top 70% of the letters show. "Yannick Scents" was tried and rejected: the text is twice as long, the letters half as tall and the crop loses its punch.
5. Links go full white and draw an amber underline from the left in 200ms; focus rings are amber. The photo drifts from scale 1 to 1.04 while scrolling and the wordmark rises 24px as it enters (transform only, off for reduced motion).

## Motion

Transform and opacity only, except the one-off blur-free word reveal (a mask slide). Words slide up 800ms staggered 80ms; cards rise and fade 800ms staggered 60ms;
the badge turns once per 22s; sections reveal with a clip wipe. Everything stops under `prefers-reduced-motion`, and tilt is desktop-only.

## Space and depth

Container 1240px, space in 8px steps, sections 64 to 104px, header 72px. Radii: 28px cards, pill buttons and fields. Rules are 1px ink at 10%.

## Voice

Concise, calm, conversational; sentence-case copy, three-word buttons ("Order on WhatsApp", "Find your scent"). No invented reviews, numbers or claims.

## Accessibility

AA contrast in both themes, 48px targets (44px for the header icon and language control), visible focus, native dialog and details, a keyboard-operable carousel
(focus it and use the arrow keys, or tab through the cards), reduced motion respected.

## Photo backgrounds

Scent-family colours no longer sit behind product photos. A card, hero card, thumbnail, panel or product page takes **the colour of the photo's own backdrop**, so the picture runs into it with no box, no blending, no overlay and no filter (the dark-mode brightness drop is gone for product photos). Images are shown whole (`object-fit: contain`), never cropped; on phones every card photo has the same 4:5 box so rows line up.

- **Detection** (`src/lib/bgcolor.js`, once, when a photo is saved or replaced): a ~4% strip along all four edges is sampled at 240px; outliers are dropped and the median colour is `bg_color`. The top and bottom strips give `bg_color_top` / `bg_color_bottom` (a gradient is used only when they differ by more than 14 in RGB distance, otherwise solid). Busy edges are judged band by band down the picture, so a smooth vertical gradient is not mistaken for noise. If the edge looks busy but one light colour still covers 25% or more of it, that is the backdrop (a bottle or box touching one edge). Otherwise `busy`: a darker, half-saturated version of the median. A photo with a transparent backdrop is `alpha`: it keeps its transparency, the card uses the theme surface, and the bottle gets a soft `drop-shadow`. `bg_is_dark` records whether paper text reads better than ink.
- **Storage**: `bg_color`, `bg_color_top`, `bg_color_bottom`, `bg_is_dark`, `bg_mode` on `products`, plus `bg_override`, which belongs to the owner. `npm run image-colors` re-measures every photo and never touches `bg_override`. Admin: a swatch of the detected colour, a colour picker and a "use my colour" box on the product form.
- **Delivery**: the page cannot carry style attributes (strict CSP), so each product gets a class `bgc-<id>` and one `<style nonce>` block in the head sets `--card-bg`, `--card-bg-top`, `--card-bg-bottom` and `--card-fg*` (ink or paper, whichever passes AA on that colour). The panel is fetched as a fragment and reuses the classes already on the page. The same colour in light and dark: it is the photo's real background; only the page around it changes.
- **Text on the colour**: badges are solid chips (readable on any colour), the close button is a solid chip, the panel title uses `--sheet-fg`.
- **Panel motion**: tapping a card paints the panel header and loading block in that card's colour before the details arrive, so it feels like the card growing; the phone browser bar (`theme-color`) takes the same colour while the panel is open and is restored on close. Reduced motion: no transitions. Letterboxed photos get a 5% side feather so a one-shade difference cannot show as a line.
- **Missing image**: the placeholder bottle on the theme surface.

## Prices

Prices are whole numbers of ETB, never invented or estimated. `price` 0 means unset. Written "ETB 15,000"; with the Amharic toggle "15,000 ብር" (every price has a `data-am` string).

- **Card**: price directly under the name, medium weight, larger than the meta line (`.card__price`, `components/price.ejs`). **Sale**: the sale price is prominent, the old price struck through beside it, plus a solid "Sale" badge. **Several sizes**: "From ETB X" (lowest price someone pays). **No price or hidden**: "Ask for price". **Sold out**: the price stays, muted, with the Sold out badge.
- **Panel / product page**: for 2+ priced sizes, size chips (radio group, 44px) switch the price and the WhatsApp message (it names the size and the price). Sold-out sizes are marked. No price: the order button asks "what is the price of <brand> <name>?". Sold out: "Ask when back in stock".
- **Text colour**: price text sits on the page surface, not on the photo colour, so it uses the theme text tokens (AA in both themes). Badges over a photo are solid chips.
- **Sorting**: Price low to high / high to low use the price someone pays; perfumes without a price always come last.
- **Affordable** is derived: priced below `site.affordableBelow` (12,000 ETB in `config/site.js`). No price, never in it.
- **Data**: `price`, `sale_price`, `price_visible`, `price_updated_at`, `price_source` (`manual` is never overwritten by an import) on `products`; `product_variants` (size_ml, price, sale_price, in_stock).
- **SEO**: JSON-LD Offer (ETB, InStock / OutOfStock) or AggregateOffer for sizes, only when a price is shown.
- **Admin**: product form Price fieldset (price, sale, hide toggle, up to 6 sizes); **Prices** page with every perfume inline, a "Missing price" filter and the last-updated date.

## Imagery

Real product photos live in `public/img/originals/` (never served, never altered). `src/lib/images.js` is the single pipeline for the importer and admin uploads:
orient, flatten, strip metadata, lift a plain studio backdrop off (`src/lib/cutout.js`, so the bottle keeps its true colours), trim, 4% margin, WebP at 480/960/1600 (never enlarged).
Width and height are stored on the product so every `<img>` has dimensions (no layout shift); `views/components/photo.ejs` writes `srcset`/`sizes`. Only the first hero image is eager with `fetchpriority="high"` and a preload; the rest are lazy.
Per product: backdrop colour (detected, with an owner override), alt text. The older focus point, fit and card tint fields are still stored but no longer change how photos are shown. A broken or missing image falls back to `/img/bottle-placeholder.svg`.
Unknown facts are never invented: no price shows "Ask for price", and the admin flags the product "Needs details" until price, size and concentration exist.
Our Story is two columns on desktop: the founder photo on the left (4:5, card radius, a 1px amber outline offset 12px behind it, a small-caps caption "Yannick — Founder"), the text on the right (eyebrow, display-font heading, three paragraphs capped at 60ch, then three facts between hairlines). On tablet the photo column is narrower; on phones the photo comes first and the facts stay in one row. The photo is `<picture>` AVIF/WebP at 480/800/1200/1600 (never upscaled), cover-fit with a configurable focus point, and falls back to an amber placeholder if it fails to load. The photo fades in while settling from 1.03; the text rises 16px and the facts follow one by one (transform and opacity only, off for reduced motion). The English copy is final; the Amharic is a draft that needs native review. Everything is editable in `/admin/story`.
See `IMAGE-INVENTORY.md` for every file and the owner checklist.
