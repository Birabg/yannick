const express = require('express');
const site = require('../../config/site');
const { products, reviews } = require('../db');
const { storeSchema, productSchema, imageUrl } = require('../lib/seo');
const { price } = require('../lib/format');

const router = express.Router();

// The header only links to Reviews when the section will actually render.
router.use((req, res, next) => {
  res.locals.hasReviews = reviews.list().length > 0;
  next();
});

router.get('/', (req, res) => {
  res.render('home', {
    products: products.list(),
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
    return res.render('partials/product-detail', { p: product, modal: true });
  }

  const label = `${product.brand} ${product.name} ${product.size}`;
  return res.render('product', {
    p: product,
    seo: {
      title: `${label} - ${price(product.price)} | ${site.brand.name}`,
      description:
        product.description.slice(0, 155) ||
        `${label} original fragrance, ${price(product.price)}. Free delivery in Addis Ababa.`,
      canonical: `/perfume/${product.slug}`,
      image: product.image ? imageUrl(product) : undefined,
      type: 'product',
      jsonLd: [productSchema(product)],
    },
  });
});

module.exports = router;
