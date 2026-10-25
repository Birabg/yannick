const express = require('express');
const i18n = require('../../config/i18n');
const { siteUrl } = require('../env');
const { products } = require('../db');

const router = express.Router();

router.get('/robots.txt', (req, res) => {
  res
    .type('text/plain')
    .send(`User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
});

router.get('/sitemap.xml', (req, res) => {
  const urls = [
    { loc: `${siteUrl}/` },
    ...products.list().map((p) => ({
      loc: `${siteUrl}/perfume/${p.slug}`,
      lastmod: p.updatedAt.slice(0, 10),
    })),
  ];
  const body = urls
    .map(
      (u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`
    )
    .join('\n');
  res
    .type('application/xml')
    .send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
    );
});

router.get('/i18n/:lang.json', (req, res, next) => {
  const strings = Object.hasOwn(i18n, req.params.lang) ? i18n[req.params.lang] : null;
  if (!strings) return next();
  res.set('Cache-Control', 'public, max-age=3600');
  return res.json(strings);
});

router.get('/healthz', (req, res) => res.type('text/plain').send('ok'));

module.exports = router;
