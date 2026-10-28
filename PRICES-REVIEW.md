# Prices review

Generated 2026-10-26. The old website had 72 perfumes; this shop has 11.

- Prices in place: **5** of 11
- Still missing a price: **6**
- Uncertain matches to confirm: **3**

No price here is a guess. Every figure below was typed in the admin, imported from the old website, or read from `data/prices.csv`. Raw data from the old website is in `data/import/live-site-prices.json`. Price ranges on the old website are never imported.

## Prices in place

| Perfume | Price | Source | Updated |
| --- | --- | --- | --- |
| Louis Vuitton Ombré Nomade | ETB 120,000 | old website (yanickscents.com) | 2026-10-26 |
| Valentino Uomo Born in Roma Coral Fantasy | ETB 30,000 | old website (yanickscents.com) | 2026-10-26 |
| Azzaro The Most Wanted Parfum | ETB 29,000 | old website (yanickscents.com) | 2026-10-26 |
| Afnan 9pm | ETB 10,500 | old website (yanickscents.com) | 2026-10-26 |
| Afnan 9pm Night Out | ETB 16,500 | old website (yanickscents.com) | 2026-10-26 |

## Uncertain matches: please confirm

The old website has a perfume with nearly the same name, but the name differs (usually the concentration), so the price was **not** applied.

- **Versace Eros**: old site has "Eros Eau de Parfum" at ETB 29,000. If it is the same bottle, enter the price in Admin > Prices.
- **Chanel Bleu de Chanel**: old site has "Bleu de Chanel Parfum" at ETB 45,000 and "Bleu de Chanel EDP" at ETB 45,000. If it is the same bottle, enter the price in Admin > Prices.
- **Dior Sauvage**: old site has "Sauvage Parfum" at ETB 39,000. If it is the same bottle, enter the price in Admin > Prices.

## Missing a price

- **Creed Aventus**: not on the old website, price needed
- **Prada Prada Black**: not on the old website, price needed
- **Hugo Boss Bottled Night**: not on the old website, price needed

## How to fill the gaps

1. Admin > Prices: type each price and press Save. The Missing price button shows only the gaps.
2. Or fill `price_etb` in `data/prices.csv` and run `npm run import-prices` (a price typed in the admin is kept unless you add `--force`).
