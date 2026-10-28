const site = require('../../config/site');
const { siteUrl } = require('../env');
const { productLabel } = require('./format');
const pricing = require('./pricing');
const { photoUrl } = require('./photo');
const { siteImage } = require('./siteImages');

const imageUrl = photoUrl;

function storeSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: site.brand.name,
    description: site.brand.description,
    url: siteUrl,
    image: `${siteUrl}${siteImage('share')}`,
    telephone: site.contact.phone,
    currenciesAccepted: site.currency,
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.location.city,
      addressCountry: site.location.countryCode,
    },
    areaServed: site.location.city,
    sameAs: [site.contact.tiktok],
  };
}

/** schema.org offers for a product with a visible price: one Offer, or an AggregateOffer for several sizes. */
function offers(p) {
  const state = pricing.priceState(p);
  if (state.kind === 'ask') return {};
  const availability = p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  const seller = { '@type': 'Organization', name: site.brand.name };
  if (state.kind === 'from') {
    const prices = pricing.pricedVariants(p).map((v) => pricing.effective(v.price, v.salePrice));
    return {
      offers: {
        '@type': 'AggregateOffer',
        url: `${siteUrl}/perfume/${p.slug}`,
        priceCurrency: site.currency,
        lowPrice: String(Math.min(...prices)),
        highPrice: String(Math.max(...prices)),
        offerCount: prices.length,
        availability,
        seller,
      },
    };
  }
  return {
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/perfume/${p.slug}`,
      priceCurrency: site.currency,
      price: String(state.now),
      itemCondition: 'https://schema.org/NewCondition',
      availability,
      seller,
    },
  };
}

function productSchema(p) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productLabel(p),
    description: p.description || `${p.name} by ${p.brand}`,
    brand: { '@type': 'Brand', name: p.brand },
    sku: p.slug,
    ...(p.image && { image: [`${siteUrl}${imageUrl(p)}`] }),
    // No price (or a hidden one) means no offer: structured data must not carry a made-up number.
    ...offers(p),
  };
}

module.exports = { imageUrl, storeSchema, productSchema };
