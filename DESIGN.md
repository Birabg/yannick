# Yannick Scents: Design System

Direction: a classic, quietly luxurious perfumery. Printed editorial campaign and a boutique glass counter, not a tech startup. Luxury comes from restraint, generous space and craft in the details. If something feels loud, trendy or gimmicky, it is removed.

This file is the source of truth. `public/css/tokens.css` implements it and `/styleguide` shows every token and component state.

## Never

No neon or saturated colour, no gradients, no glassmorphism, no heavy shadows, no emoji, no rotated sticker badges, no marquee, no bouncy animation, no identical grid of rounded shadowed cards, no centred-everything layouts, no stock-icon clutter, no filler copy.

## Colour

| Token          | Value     | Use                                                                      |
| -------------- | --------- | ------------------------------------------------------------------------ |
| `--ivory`      | `#F7F3EC` | main background                                                          |
| `--stone`      | `#EAE3D7` | alternate sections, image backdrops                                      |
| `--white`      | `#FDFBF7` | inputs, panels                                                           |
| `--ink`        | `#1C1714` | text, dark sections                                                      |
| `--taupe`      | `#6B5F54` | secondary text                                                           |
| `--bordeaux`   | `#5B1A24` | the one accent: buttons, links, focus, highlights                        |
| `--brass`      | `#A68A5B` | hairlines and tiny details only. Never text on light, never a large fill |
| `--hair`       | `#D9D0C1` | 1px borders on light backgrounds                                         |
| `--taupe-dark` | `#B3A798` | secondary text on ink                                                    |
| `--danger`     | `#8C1D18` | errors only                                                              |

Contrast (WCAG, computed in `scripts/contrast.js`):

- ink on ivory 16.0, on stone 13.9
- taupe `#6B5F54` on ivory 5.6, on stone 4.9. The brief proposed `#7A6E63`, which measures 4.48 on ivory (just under the 4.5 AA line, and lower on stone), so it was darkened slightly.
- bordeaux on ivory 11.7, on stone 10.2; ivory on bordeaux 11.7
- ivory on ink 16.0; taupe-dark on ink 7.5; brass on ink 5.4 (used on dark only)

No pure black or pure white anywhere.

## Type

- Display: Bodoni Moda, regular weight, italic for the accent word. Large and airy. Never used below 22px (its hairlines vanish when small).
- Body and UI: Jost, 17px, line-height 1.7, measure max 65ch.
- Eyebrows and captions: Jost 12.5px uppercase, tracking 0.22em. Sections are numbered with roman numerals.
- Amharic: Noto Serif Ethiopic for display, Noto Sans Ethiopic for body. Uppercase, tracking and italics are switched off under `:lang(am)`.
- Fluid scale with `clamp()`: display XL (hero) 3rem to 7.5rem, display L (section title) 2.4rem to 4.6rem, display M 1.6rem to 2.2rem, lead 1.2rem to 1.4rem.
- Self-hosted woff2, `font-display: swap`.

## Space and layout

- 8px scale: 8, 16, 24, 32, 48, 64, 96, 128, 160.
- 12-column grid, container max 1240px, side margin 20px on phones to 48px on desktops.
- Sections breathe: 96px (phone) to 160px (desktop) of vertical padding, like pages of a book.
- Asymmetric compositions: large image on one side, small text block offset on the other. Hairline dividers. Captions in small caps.
- Radii: 2px for buttons and inputs. Arched frame (999px top corners) for the founder portrait only.

## Components

- **Button**: rectangular, 2px radius, small caps, tracking 0.16em, 52px tall. Primary = solid bordeaux with ivory text. Secondary = hairline ink outline. Dark = solid ink. Hover: slow colour change; underline-style arrow.
- **Tab** (collection filters): small-caps text, active has a 1px bordeaux underline that draws in. No chips.
- **Product card**: no box, no shadow. Image on a soft stone backdrop, brand in small caps, name in serif, size and price in one quiet line. Hairline underline draws in on hover. Image zooms to 1.03 over 900ms.
- **Panel** (product detail): right drawer from 760px, bottom sheet below. Big image, typeset notes pyramid, fine-line meters (2px rules, bordeaux fill), order buttons. Focus is trapped (native `<dialog>`).
- **Meter**: five 2px rules; filled ones are bordeaux.
- **Accordion** (FAQ): hairline rows, plus/minus drawn with two rules.
- **Fields**: white fill, 1px hair border, 2px radius, 52px tall; focus = bordeaux border and ring.
- **Toast**: ink background, ivory text, 2px radius.
- **Skeleton**, **empty state**, **sold-out** (image desaturated, label "Sold out") and **error** states are all styled.
- **Mobile bar**: slim, sticky, Call and WhatsApp.

## Page rhythm

Header (centred wordmark, hairline) > Hero (editorial image) > I Story (ivory) > II Collection (ivory) > III Olfactory Journey (ink) > IV Houses (stone) > V Find Your Scent (ivory) > Reviews (stone, hidden when empty) > FAQ > Order > Footer (ink, brass hairlines). Light sections alternate ivory and stone; numbering skips nothing when Reviews is hidden.

## Motion

- Reveals: opacity 0 to 1 and 16px upward, 800ms, `cubic-bezier(0.22, 0.61, 0.36, 1)`.
- Image hover: scale 1.03, 900ms. Underlines draw in with `scaleX`, 500ms.
- Panels: 500ms drawer / sheet slide. Filter changes cross-fade 500ms with gentle FLIP.
- Only `transform` and `opacity`. IntersectionObserver for reveals. `prefers-reduced-motion` removes all of it.

## Accessibility

AA contrast, bordeaux focus ring (2px offset), 48px minimum tap targets, skip link, native dialog focus trap, `aria-pressed` on tabs, live regions for counts and toasts, form errors tied to fields, keyboard-reachable drawer and menu.

## Imagery

Tall, uncropped product shots on warm neutral backdrops. Product photos should be shot on a plain white background: the site multiplies them over the stone backdrop so they sit on a consistent warm tone. Placeholders are flat SVG bottle silhouettes in soft tones. Replace `config/site.js` `founderPhoto` and `public/img/hero.svg` (or `hero.jpg`) with real photography.
