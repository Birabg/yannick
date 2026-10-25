const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const site = require('../config/site');
const i18n = require('../config/i18n');
const { root, isProd, siteUrl, uploadsDir } = require('./env');
const { asset } = require('./lib/assets');
const format = require('./lib/format');
const { imageUrl } = require('./lib/seo');
const publicRoutes = require('./routes/public');
const seoRoutes = require('./routes/seo');
const adminRoutes = require('./routes/admin');

const forever = { maxAge: '365d', immutable: true, index: false };

function createApp() {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.join(root, 'views'));
  app.disable('x-powered-by');
  if (isProd) app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
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
      fmt: format,
      imageUrl,
      icon: (name, cls = '') =>
        `<svg class="icon ${cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`,
      t: (key) => i18n.en[key] ?? key,
      i: (key) => `data-i18n="${key}"`,
      year: new Date().getFullYear(),
      seo: {},
      path: req.path,
    });
    next();
  });

  app.use(seoRoutes);
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
