const express = require('express');
const site = require('../../config/site');
const { products, reviews } = require('../db');
const { storeSchema, productSchema, imageUrl } = require('../lib/seo');
const { price } = require('../lib/format');
const { moodPicks } = require('../lib/mood');
const { heroProducts: pickHero } = require('../lib/hero');

const router = express.Router();

// The header only links to Reviews when the section will actually render.
router.use((req, res, next) => {
  res.locals.hasReviews = reviews.list().length > 0;
  next();
});

router.get('/', (req, res) => {
  const list = products.list();
  // Hero cards: featured bottles first, then the rest of the shelf. Photos are the product photos, so the admin controls them.
  const heroProducts = pickHero(list);
  // The houses on the site are the brands actually on the shelf (the configured list is only a fallback).
  const brands = [...new Set(list.map((p) => p.brand))];
  const houses = brands.length ? brands : site.houses;
  const facts = site.facts.map((f, n) =>
    n === 0 && brands.length
      ? {
          ...f,
          num: String(brands.length),
          text:
            brands.length > 6
              ? `${brands.slice(0, 5).join(', ')} and ${brands.length - 5} more.`
              : `${brands.join(', ')}.`,
        }
      : f
  );
  // Filter pills appear only for shelves that have at least one bottle.
  const shelves = site.collections.filter((c) => list.some((p) => p.collections.includes(c.key)));
  const reviewList = reviews.list();
  const quote = reviewList.find((r) => r.text) || null;
  res.render('home', {
    products: list,
    moods: moodPicks(list),
    heroProducts,
    houses,
    shelves,
    facts,
    quote,
    reviews: reviews.list(),
    seo: {
      title: `${site.brand.name} | ${site.brand.tagline} - Original Perfumes in Addis Ababa`,
      description: site.brand.description,
      canonical: '/',
      jsonLd: [storeSchema()],
    },
  });
});

router.get('/perfume/:slug', (req, res, next) => {
  const product = products.getBySlug(req.params.slug);
  if (!product) return next();

  // The collection modal fetches this fragment so it shares one template with the full page.
  if (req.query.partial === '1') {
    return res.render('components/product-detail', { p: product, sheet: true });
  }

  const label = `${product.brand} ${product.name} ${product.size}`;
  return res.render('product', {
    p: product,
    seo: {
      title: `${label.trim()}${product.price > 0 ? ` - ${price(product.price)}` : ''} | ${site.brand.name}`,
      description:
        product.metaDescription ||
        product.description.slice(0, 155) ||
        `${label.trim()} original fragrance${product.price > 0 ? `, ${price(product.price)}` : ''}. Free delivery in Addis Ababa.`,
      canonical: `/perfume/${product.slug}`,
      image: product.image ? imageUrl(product) : undefined,
      type: 'product',
      jsonLd: [productSchema(product)],
    },
  });
});

module.exports = router;
