const express = require('express');
const site = require('../../config/site');
const { products, reviews } = require('../db');
const { storeSchema, productSchema, imageUrl } = require('../lib/seo');
const { price } = require('../lib/format');
const { moodPicks } = require('../lib/mood');
const { heroProducts: pickHero } = require('../lib/hero');
const { getStory } = require('../lib/story');
const familyLib = require('../lib/families');
const { families: familyConfig } = require('../../config/families');

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
  // Filter pills appear only for shelves that have at least one bottle.
  const shelves = site.collections.filter((c) => list.some((p) => p.collections.includes(c.key)));
  // Filter tabs: the configured order, with how many products each holds; empty sections are hidden.
  const tabs = site.filterTabs
    .map((key) => {
      const c = site.collections.find((x) => x.key === key);
      return { key, label: c.label, count: list.filter((p) => p.collections.includes(key)).length };
    })
    .filter((t) => t.count > 0);
  // "Most Loved Right Now": only what the owner ticked Best Seller, in the owner's order. Nothing else fills it.
  const loved = list
    .filter((p) => p.badges.includes('bestseller'))
    .sort((a, b) => (a.bestOrder || 999) - (b.bestOrder || 999))
    .slice(0, 8);
  const story = getStory();
  const reviewList = reviews.list();
  const quote = reviewList.find((r) => r.text) || null;
  res.render('home', {
    products: list,
    moods: moodPicks(list),
    families: familyLib.available(list),
    heroProducts,
    houses,
    shelves,
    story,
    tabs,
    loved,
    filterKeys: site.collections.map((c) => c.key),
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


router.get('/families/:key', (req, res, next) => {
  const family = familyLib.find(products.list(), req.params.key);
  if (!family) return next();
  const copy = familyConfig.find((f) => f.key === family.key).en;
  return res.render('family', {
    family,
    copy,
    seo: {
      title: `${copy.title} perfumes | ${site.brand.name}`,
      description: `${copy.sub}. ${copy.text}`.slice(0, 155),
      canonical: `/families/${family.key}`,
      image: family.cover ? imageUrl(family.cover) : undefined,
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
