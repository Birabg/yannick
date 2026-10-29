const site = require('../../config/site');
const { siteUrl } = require('../env');
const { productLabel } = require('./format');
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

function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.brand.name,
    url: siteUrl,
    logo: `${siteUrl}/img/brand/logo-384.webp`,
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
    // No price yet means no offer: structured data must not carry a made-up number.
    ...(p.price > 0 && {
      offers: {
        '@type': 'Offer',
        url: `${siteUrl}/perfume/${p.slug}`,
        priceCurrency: site.currency,
        price: String(p.price),
        itemCondition: 'https://schema.org/NewCondition',
        availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: site.brand.name },
      },
    }),
  };
}

module.exports = { imageUrl, storeSchema, organizationSchema, productSchema };
