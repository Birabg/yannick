# Yannick Scents

Website for **Yannick Scents**, an Addis Ababa seller of 100% original designer fragrances.
Customers browse the collection and order by WhatsApp, phone call or TikTok DM (no cart or checkout).

Stack: Node.js + Express, EJS (server-rendered), SQLite on [Turso](https://turso.tech) (`@libsql/client`), `sharp` for images, vanilla CSS/JS.

> **Sample data:** `npm run seed` creates 8 perfumes marked **SAMPLE** (drawn bottles, placeholder
> prices and notes). Replace or delete them in the admin panel before going live.

## Setup

Requires Node.js 18 or newer.

```bash
npm install
cp .env.example .env      # then edit .env (see below)
npm run seed              # optional: 8 SAMPLE perfumes
npm run dev               # http://localhost:3000
```

### `.env`

| Variable                   | Meaning                                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `PORT`                     | Port to listen on (default 3000)                                                                                 |
| `NODE_ENV`                 | `development` locally, `production` on the server                                                                |
| `SITE_URL`                 | Public address, used for canonical links, sitemap and social cards                                               |
| `SESSION_SECRET`           | Long random string. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`         |
| `ADMIN_PASSWORD`           | Initial admin password (8+ characters)                                                                           |
| `PHONE`, `WHATSAPP_NUMBER` | Contact numbers (`+251...` and digits only)                                                                      |
| `TURSO_DATABASE_URL`       | `libsql://...` address of the Turso database. Required in production; locally it falls back to `data/yannick.db` |
| `TURSO_AUTH_TOKEN`         | Turso database token (required with a `libsql://` URL)                                                           |
| `DATA_DIR`, `UPLOADS_DIR`  | Optional: local dev database folder, and where photos live (photos are files, so they need a persistent disk)    |

## Admin password

On the **first run** the server hashes `ADMIN_PASSWORD` (bcrypt) and stores the hash in the database.
After that the value in `.env` is ignored, so you can delete it. Log in at `/admin` and change the
password any time under **Admin > Password**. Failed logins are rate limited (5 per 15 minutes).

If you forget it: stop the server, delete the `admin_hash` row (`sqlite3 data/yannick.db "DELETE FROM settings WHERE key='admin_hash'"`),
set `ADMIN_PASSWORD` in `.env` and start again.

## Adding and managing products

1. Open `/admin` and log in (works well on a phone).
2. **Add perfume**: fill in name, brand, price (ETB), size, category, collection sections, notes
   (comma separated), longevity/projection, description and a photo (JPG/PNG/WebP, max 5 MB).
   Photos are resized and converted to WebP automatically.
3. From the list you can search, edit, delete (with confirmation), mark **sold out / in stock**,
   **feature**, and move items up or down. Sold-out items stay visible with a "Sold out" badge and the
   button becomes "Ask when back in stock".
4. **Reviews**: add real customer feedback (name, text, rating, optional screenshot). With zero reviews
   the whole section is hidden on the website.

### Descriptions

Each perfume has an English description, a card tagline, a search (meta) description and Amharic versions of the description and tagline. The first drafts were written
by `npm run descriptions` and are listed in `DESCRIPTIONS-REVIEW.md`. They show on the site straight away, and the dashboard tags them **Draft text** until you open Edit, correct them and
tick **Approved** (saving any change to the text also approves it). The Amharic is marked _Needs native review_ until someone who speaks Amharic ticks **Amharic reviewed**.
The language toggle switches the product text too. Longevity and projection show on a product page only after you set them (0 means not set).

## Changing business details

Everything is in **`config/site.js`**: brand copy, tagline, TikTok link, location, **working hours**,
houses, filter chips, FAQ answers, "How to order" steps, story text.
Phone and WhatsApp numbers come from `.env` (`PHONE`, `WHATSAPP_NUMBER`).
Interface strings for the English/Amharic toggle live in `config/i18n.js`
(have a native speaker review the Amharic text; add a language by adding an object there and a button in `views/partials/header.ejs`).

The Our Story photo and words live in **Our Story** in the admin (photo, face position, English text, Amharic draft). The built-in photo is made from `public/img/originals/founder.jpg` by `node scripts/make-story.js` (it crops the Instagram arrows off and writes AVIF + WebP files to `public/img/story/`).
The hero cards are your real products (featured ones first), so uploading a product photo in `/admin` updates the hero automatically. Photograph each bottle on plain white; the cards colour it by scent family.
The hero quote is the first customer review that has text; with no reviews it shows the founder's line from `config/site.js`.

## Design

The look (paper and ink, notched 28px colour cards by scent family, Bricolage Grotesque headings, amber as the only accent) is documented in
**`DESIGN.md`**, with tokens in `public/css/tokens.css`. The live component sheet is at `/styleguide`
(hidden from search engines). Light, Dark and System themes are switched from the header; see the Theme section of `DESIGN.md`.

Card and panel colours come from each photo's own backdrop. They are measured when a photo is saved; run `npm run image-colors` to re-measure all photos (a colour you picked in the admin is never overwritten).

Photo tip: photograph each bottle on a plain white or light background; the site lifts the backdrop off and places the bottle on the scent-colour card. Upload from the product form or from **Images** in the admin (usage, replace, orphan clean-up, share image).

## Scripts

| Command                           | Does                                                                                                                                                                              |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                     | Development server with auto-restart                                                                                                                                              |
| `npm start`                       | Builds minified CSS/JS (`prestart`), then starts the server                                                                                                                       |
| `npm run build`                   | Only builds `public/dist` (run this when deploying with PM2)                                                                                                                      |
| `npm run import:images`           | Creates products from the photos in `public/img/originals` (`-- --replace-samples`, `-- --reset`)                                                                                 |
| `npm run live-prices`             | Reads prices from the old website (`-- --dry` to preview): saves `data/import/live-site-prices.json`, applies exact matches only, writes `data/prices.csv` and `PRICES-REVIEW.md` |
| `npm run import-prices`           | Applies `data/prices.csv` (empty cells skipped, numbers validated; admin-typed prices kept unless `-- --force`; `-- --dry`)                                                       |
| `node scripts/make-og.js`         | Rebuilds `public/img/og-default.png` from the hero bottles                                                                                                                        |
| `npm run descriptions`            | Fills empty descriptions, taglines and meta descriptions (drafts) from `scripts/descriptions-data.js`; writes `DESCRIPTIONS-REVIEW.md`; never overwrites your text                |
| `node scripts/make-footer.js`     | Rebuilds the footer photo (AVIF/WebP) in `public/img/footer/` from `public/img/originals/footer.*`                                                                                |
| `npm run seed`                    | (Re)creates the SAMPLE perfumes; never touches your products                                                                                                                      |
| `npm run build:assets`            | Regenerates favicons and the social card from `favicon.svg`                                                                                                                       |
| `node scripts/contrast.js`        | Prints the WCAG contrast ratios of the colour pairs in use                                                                                                                        |
| `npm run lint` / `npm run format` | ESLint / Prettier                                                                                                                                                                 |

## Security notes

Helmet with a strict CSP (no inline scripts or styles), bcrypt password hashing, `httpOnly` +
`sameSite` session cookies (scoped to `/admin`, `secure` in production), session-bound CSRF tokens on
every admin POST, login rate limiting, server-side validation, auto-escaped templates, and uploads
verified by content (not just file extension).

## Deploy

### Option A: small VPS (Ubuntu) with PM2 + Nginx

```bash
# on the server
sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
sudo npm i -g pm2

git clone <your repo> /var/www/yannick && cd /var/www/yannick
npm ci
cp .env.example .env && nano .env      # NODE_ENV=production, SITE_URL=https://yourdomain, SESSION_SECRET, ADMIN_PASSWORD
npm run build
pm2 start src/server.js --name yannick
pm2 save && pm2 startup
```

Nginx site (`/etc/nginx/sites-available/yannick`), then enable it and run `sudo certbot --nginx -d yourdomain`:

```nginx
server {
  server_name yourdomain.com;
  client_max_body_size 6m;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Back up `uploads/` regularly (photos), and the Turso database (`turso db shell <name> .dump`).
Update later with `git pull && npm ci && npm run build && pm2 restart yannick`.

### Option B: Render / Railway

Create a Web Service from the repo. Build command `npm ci && npm run build`, start command `node src/server.js`.
Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`, plus `NODE_ENV=production`, `SITE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD`.
**Attach a persistent disk** (for example mounted at `/data`) and set `UPLOADS_DIR=/data/uploads`.
Without a disk, uploaded photos are lost on every deploy.

## Project layout

```
config/    site.js (business details, FAQ), i18n.js (UI strings)
src/       app.js, server.js, db.js, seed.js, routes/, middleware/, lib/
views/     EJS templates (partials/, admin/)
public/    css/, js/ (source), fonts/, img/, dist/ (generated)
scripts/   build.js (esbuild), build-assets.js (icons), contrast.js
```

## Hero shader

Two spots on the home page (the centre hero card and the panel beside the order text) have an animated amber glass behind a bottle photo (the `shaders` package,
React island in `public/js/hero/`). It is optional polish and never sits behind text: without WebGPU, with reduced motion, data saver, 4 or fewer cores,
or a 2g connection the CSS amber gradient shows instead. The bundle is about 780 KB gzipped and loads only on the home page, after first paint.
To remove it, delete the `data-shader` attributes from `views/components/hero-card.ejs` and `views/home.ejs`; for a much lighter option see "Shader island" in `DESIGN.md`.
