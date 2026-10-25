# Image inventory

Every file that was in `public/img` when the photos were added, what it shows, and where it is used.
The untouched originals are kept in `public/img/originals/` (not served by the site: `/img/originals/*` returns 404). Nothing was deleted or overwritten.

Re-run the import at any time with `npm run import:images` (add `-- --reset` to rebuild the imported products from `scripts/photo-catalog.js`, which discards edits made to them in the admin).

## What the photos are

All eleven files are retailer-style product shots of a single bottle, some with the box beside it. There is no founder portrait, no group or display shot, no storefront photo and no logo among them.

| #   | Original file name                                                                                   | What it shows                                                         | Size (px)  | File size | Used as                                                        |
| --- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------- | --------- | -------------------------------------------------------------- |
| 1   | `Amazon_com_ Chanel Bleu De Chanel Eau De Toilette Spray For Men 100Ml_3.4Oz _ Clothing, Shoes & Jewelry` | Bleu de Chanel, navy glass bottle on white (no extension on the file) | 679 × 760  | 24 KB     | Product "Bleu de Chanel"; hero card 1; order-section panel     |
| 2   | `Versace Eros Eau de Toilette _ Nordstrom.jpg`                                                       | Versace Eros, teal bottle with Medusa head, on white                  | 736 × 1128 | 144 KB    | Product "Eros"; hero card 2                                    |
| 3   | `Louis Vuitton Ombré Nomade.jpg`                                                                     | Louis Vuitton Ombré Nomade, smoked amber bottle on light grey         | 735 × 1029 | 35 KB     | Product "Ombré Nomade"; hero card 3 (centre, amber glass card) |
| 4   | `Men's Grooming _ Nordstrom.jpg`                                                                     | Creed Aventus, clear glass over black band, on white                  | 476 × 730  | 33 KB     | Product "Aventus"; hero card 4                                 |
| 5   | `The best fragrances for men that'll set you ahead in the bedroom and boardroom.jpg`                 | Prada Black, glossy black bottle on white                             | 736 × 1104 | 41 KB     | Product "Prada Black"; hero card 5                             |
| 6   | `$2,980_                100 ml.jpg`                                                                  | Valentino Uomo Born in Roma Coral Fantasy, studded bottle and box    | 736 × 931  | 50 KB     | Product; small hero card under card 1                          |
| 7   | `download.jpg`                                                                                       | Azzaro The Most Wanted Parfum, black bottle and brown box             | 700 × 700  | 65 KB     | Product; small hero card under card 5                          |
| 8   | `download (2).jpg`                                                                                   | Hugo Boss Bottled Night, navy bottle and black box                    | 736 × 916  | 61 KB     | Product "Bottled Night"; collection grid                       |
| 9   | `AFNAN 9 PM for Men Eau de Parfum Spray, 3_4 Ounce.jpg`                                              | Afnan 9pm, black-labelled bottle and striped box                      | 736 × 736  | 48 KB     | Product "9pm"; collection grid                                 |
| 10  | `download (1).jpg`                                                                                   | Afnan 9pm Night Out, textured grey bottle and box                     | 430 × 500  | 38 KB     | Product "9pm Night Out"; collection grid                       |
| 11  | `These fragrances for men are as alluring as they___.jpg`                                            | Dior Sauvage, blue gradient bottle on white                           | 236 × 354  | 15 KB     | Product "Sauvage"; collection grid. **Low resolution.**        |

Other files already in `public/img` (not photos supplied by you): `bottle-placeholder.svg` (fallback when a photo is missing), `founder-placeholder.svg` (replaced on the page by a shelf of real bottles until you upload a portrait), `grain.png`, and `og-default.png` (the share image, now built from the bottle photos by `scripts/make-og.js`).

## How they are processed

One pipeline (`src/lib/images.js`) for the importer and for uploads in the admin, so both behave the same:

1. Auto-orient, flatten onto white, strip all metadata.
2. If the photo has a plain light studio backdrop, lift it off (`src/lib/cutout.js`) so the bottle keeps its true colours on the scent-coloured card. Trim the empty margin and add an even 4% margin. Photos without a plain backdrop are kept as they are and blended onto the card.
3. Save WebP at 480 px, 960 px and 1600 px wide, only the sizes smaller than the source. These photos are at most 736 px wide, so each has two files (480 px and its own width). Aspect ratio is kept; nothing is stretched or enlarged.
4. Record the width and height on the product, so every `<img>` has explicit dimensions (no layout shift). Pages use `srcset` and `sizes`, `loading="lazy"` (except the first hero card, which is preloaded with `fetchpriority="high"`) and alt text from the product.

Files are named `photo-<product>-<hash>-<width>.webp` in `uploads/products/`. The hash changes when the photo or the pipeline changes, because the files are cached for a year.

AVIF and JPEG fallbacks were not generated: WebP is supported by every browser the site targets, and at these sizes AVIF would save only a few KB per photo.

## What was not supplied

- **Logo:** none, so the header and footer keep the SVG wordmark and the favicon set is unchanged.
- **Founder portrait:** none. The Our Story section shows three bottles on a shelf until you upload a portrait in `/admin/images`. No stand-in person is shown.
- **Group or display shot:** none. The share image (1200 × 630) is built from five bottle photos. Upload your own in `/admin/images` and it replaces the generated one.
- **Store photo, videos:** none.

## Needs owner confirmation

Each product below was created from its photo with **only the brand and name read from the bottle label**. Price, size, concentration, scent family, notes and description are empty on purpose: nothing was invented. The site shows "Ask for price" on each card, and the admin tags each one "Needs details" until the price, size and concentration are filled in.

Tick each line when done (edit the product in `/admin`):

- [ ] **Bleu de Chanel**: price, size, concentration (the photo does not show them)
- [ ] **Versace Eros**: price, size, concentration
- [ ] **Louis Vuitton Ombré Nomade**: price, size, concentration; category set to _Unisex_ (confirm)
- [ ] **Creed Aventus**: price, size, concentration
- [ ] **Prada Black**: price, size, concentration; confirm the exact name (the label reads "PRADA BLACK")
- [ ] **Valentino Uomo Born in Roma Coral Fantasy**: price; the box reads 3.4 FL.OZ and Eau de Toilette, please confirm
- [ ] **Azzaro The Most Wanted Parfum**: price; the box reads 100 mL and Parfum, please confirm
- [ ] **Hugo Boss Bottled Night**: price; the box reads 100 ml and Eau de Toilette, please confirm
- [ ] **Afnan 9pm**: price; the box reads 100 ml and Eau de Parfum, please confirm
- [ ] **Afnan 9pm Night Out**: price; the box reads 100 ml and Extrait de Parfum, please confirm
- [ ] **Dior Sauvage**: price, size; the bottle reads Eau de Parfum, please confirm; **replace the photo** (236 px wide is too small for a card)

Also confirm for every product:

- [ ] **Category** (all but Ombré Nomade were set to _Men_ from the source file names and the "Uomo" / "for Men" labels).
- [ ] **Scent family, notes, longevity and projection.** Until a product has a family, the Fresh, Woody and Oriental filter pills and the "By mood" section stay hidden, because there is nothing true to show in them.
- [ ] **Card colour.** Each card's backdrop colour was chosen for contrast with the bottle, not to describe the scent. Change it under _Card colour_ in the product form.
- [ ] **Photo rights.** These look like retailer or brand product shots (file names mention Nordstrom and Amazon). Use them only if you have the right to, or replace them with your own photography, which behaves the same way.

## Intentionally unused

Nothing from the eleven photos is unused: each one is a product, and the hero uses the first seven (featured). The `originals/` folder is a backup only.
