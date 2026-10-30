const express = require('express');
const site = require('../../config/site');
const { products, reviews } = require('../db');
const { storeSchema, organizationSchema, productSchema, imageUrl } = require('../lib/seo');
const { price } = require('../lib/format');
const { moodPicks } = require('../lib/mood');
const { heroProducts: pickHero } = require('../lib/hero');
const { getStory } = require('../lib/story');
const familyLib = require('../lib/families');
const houseLib = require('../lib/houses');
const lovedLib = require('../lib/loved');
const hoursLib = require('../lib/hours');
const i18n = require('../../config/i18n');
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
  // The houses are the seed list plus every brand on the shelf, most perfumes first (config/houses.js).
  const houses = houseLib.build(list);
  // Filter pills appear only for shelves that have at least one bottle.
  const shelves = site.collections.filter((c) => list.some((p) => p.collections.includes(c.key)));
  // Filter tabs: the configured order, with how many products each holds; empty sections are hidden.
  const tabs = site.filterTabs
    .map((key) => {
      const c = site.collections.find((x) => x.key === key);
      return { key, label: c.label, count: list.filter((p) => p.collections.includes(key)).length };
    })
    .filter((t) => t.count > 0);
  // "Most Loved Right Now": the Best Sellers, topped up from featured and newest so the row is never nearly empty (src/lib/loved.js).
  const loved = lovedLib.pick(list);
  const story = getStory();
  const reviewList = reviews.list();
  const quote = reviewList.find((r) => r.text) || null;
  res.render('home', {
    products: list,
    moods: moodPicks(list),
    families: familyLib.available(list),
    heroProducts,
    // "+N more" beside "Featured bottles": every bottle the five hero cards do not show
    moreCount: Math.max(0, list.length - Math.min(5, heroProducts.length)),
    houses,
    houseCss: houseLib.css(houses),
    hours: hoursLib.view(),
    // The guide is drawn in the browser, so it carries both languages' strings and follows the toggle.
    quizStrings: Object.fromEntries(
      Object.entries(i18n).map(([lang, all]) => [
        lang,
        Object.fromEntries(Object.entries(all).filter(([key]) => key.startsWith('quiz.'))),
      ])
    ),
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
      jsonLd: [storeSchema(), organizationSchema()],
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
  // The quick view asks for a fragment; an unknown name is an empty answer, not an error.
  if (!product) return req.query.partial === '1' ? res.status(204).end() : next();

  // The collection modal fetches this fragment so it shares one template with the full page.
  if (req.query.partial === '1') {
    // "You may also like": bottles from the same scent family (fresh, woody, oriental) or the same house, the closest match first
    const families = ['fresh', 'woody', 'oriental'];
    const score = (x) =>
      families.filter((key) => product.collections.includes(key) && x.collections.includes(key)).length +
      (x.brand === product.brand ? 2 : 0);
    const related = products
      .list()
      .filter((x) => x.id !== product.id && score(x) > 0)
      .sort((a, b) => score(b) - score(a))
      .slice(0, 4);
    return res.render('components/quick-view', { p: product, related: related.length >= 3 ? related : [] });
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
