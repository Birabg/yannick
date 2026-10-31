const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const site = require('../config/site');
const i18n = require('../config/i18n');
const { root, isProd, siteUrl, uploadsDir } = require('./env');
const { asset, distAsset } = require('./lib/assets');
const format = require('./lib/format');
const { imageUrl } = require('./lib/seo');
const photo = require('./lib/photo');
const backdrop = require('./lib/backdrop');
const { siteImage, isCustom: siteImageIsCustom } = require('./lib/siteImages');
const publicRoutes = require('./routes/public');

/** Sizes of the footer photo written by scripts/make-footer.js; null (gradient fallback) if it was not run. */
function readFooterPhoto() {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'public/img/footer/footer.json'), 'utf8')
    );
  } catch {
    return null;
  }
}
const footerPhoto = readFooterPhoto();
const seoRoutes = require('./routes/seo');
const adminRoutes = require('./routes/admin');
const styleguideRoutes = require('./routes/styleguide');

const forever = { maxAge: '365d', immutable: true, index: false };
const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );

/** Critical CSS is inlined in production (built by scripts/build.js). */
function readCriticalCss() {
  if (!isProd) return '';
  try {
    return fs.readFileSync(path.join(root, 'public/dist/css/critical.css'), 'utf8');
  } catch {
    return '';
  }
}

function createApp() {
  const app = express();
  const criticalCss = readCriticalCss();
  app.set('view engine', 'ejs');
  app.set('views', path.join(root, 'views'));
  app.disable('x-powered-by');
  if (isProd) app.set('trust proxy', 1);

  // A fresh nonce per request lets us inline the critical CSS without 'unsafe-inline'.
  app.use((req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
    next();
  });
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
          styleSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
          imgSrc: ["'self'", 'data:', 'blob:'],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: isProd ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(compression());

  // The untouched originals are a backup, not part of the site.
  app.use('/img/originals', (req, res) => res.sendStatus(404));
  app.use('/uploads', express.static(uploadsDir, forever));
  app.use('/dist', express.static(path.join(root, 'public/dist'), forever));
  app.use('/fonts', express.static(path.join(root, 'public/fonts'), forever));
  app.use(express.static(path.join(root, 'public'), { maxAge: isProd ? '7d' : 0 }));

  app.use(
    rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false })
  );

  app.use((req, res, next) => {
    Object.assign(res.locals, {
      site,
      siteUrl,
      asset,
      distAsset,
      fmt: format,
      imageUrl,
      photo,
      backdrop,
      siteImage,
      footerPhoto,
      siteImageIsCustom,
      criticalCss,
      icon: (name, cls = '') =>
        `<svg class="icon ${cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`,
      t: (key) => i18n.en[key] ?? key,
      /** The Amharic string, for markup that must switch language before any script loads (the intro splash). */
      tAm: (key) => i18n.am[key] ?? i18n.en[key] ?? key,
      i: (key) => `data-i18n="${key}"`,
      /** Escapes text, then turns *word* into the italic serif accent. */
      rich: (text) => escapeHtml(text).replace(/\*([^*]+)\*/g, '<em>$1</em>'),
      year: new Date().getFullYear(),
      seo: {},
      path: req.path,
    });
    next();
  });

  app.use(seoRoutes);
  app.use('/styleguide', styleguideRoutes);
  app.use('/admin', adminRoutes);
  app.use(publicRoutes);

  app.use((req, res) =>
    res.status(404).render('404', { seo: { title: 'Page not found', noindex: true } })
  );

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status >= 400 && err.status < 600 ? err.status : 500;
    if (status === 500) console.error(err);
    res.status(status).render('500', {
      seo: { title: 'Something went wrong', noindex: true },
      message: status < 500 ? err.message : '',
    });
  });

  return app;
}

module.exports = createApp;
