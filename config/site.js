/**
 * Single source of truth for every business detail on the site.
 * Edit this file (and .env for phone/WhatsApp/URL) - nothing else needs touching.
 */
require('../src/env');

const phoneIntl = process.env.PHONE || '+251942996655';
const whatsapp = (process.env.WHATSAPP_NUMBER || '251942996655').replace(/\D/g, '');

/** "+251942996655" -> "09 4299 6655" */
function displayPhone(intl) {
  const local = intl.replace(/^\+?251/, '0');
  return local.length === 10 ? `${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}` : intl;
}

module.exports = {
  brand: {
    name: 'Yannick Scents',
    tagline: 'A Good Scent Speaks First',
    founder: 'Yannick',
    description:
      '100% original designer fragrances for men and women in Addis Ababa. Chanel, Yves Saint Laurent, Valentino, Hugo Boss, Bentley and Azzaro, with free delivery across Addis Ababa. Order on WhatsApp or by phone.',
  },

  contact: {
    phone: phoneIntl,
    phoneDisplay: displayPhone(phoneIntl),
    whatsapp,
    tiktok: 'https://www.tiktok.com/@yannickscents',
    tiktokHandle: '@yannickscents',
    credit: {
      label: 'Andromeda Technologies',
      url: 'https://www.instagram.com/andro_medatechnologies',
    },
  },

  location: {
    city: 'Addis Ababa',
    country: 'Ethiopia',
    countryCode: 'ET',
    text: 'Addis Ababa, Ethiopia. Free delivery to your door anywhere in the city.',
  },

  // Replace with your real opening hours.
  hours: [
    { days: 'Monday - Saturday', time: '9:00 AM - 8:00 PM' },
    { days: 'Sunday', time: '10:00 AM - 6:00 PM' },
  ],
  hoursNote: 'Messages sent outside these hours are answered the next morning.',

  currency: 'ETB',

  houses: ['Chanel', 'Yves Saint Laurent', 'Valentino', 'Hugo Boss', 'Bentley', 'Azzaro'],

  /** Public filter chips. `key` matches product collections; "men"/"women" come from category. */
  collections: [
    { key: 'men', label: 'Men' },
    { key: 'women', label: 'Women' },
    { key: 'fresh', label: 'Fresh & Citrus' },
    { key: 'woody', label: 'Woody Aromatic' },
    { key: 'oriental', label: 'Oriental & Gourmand' },
    { key: 'affordable', label: 'Affordable' },
    { key: 'handpick', label: "Yannick's Hand Pick" },
  ],

  categories: [
    { key: 'men', label: 'Men' },
    { key: 'women', label: 'Women' },
    { key: 'unisex', label: 'Unisex' },
  ],

  concentrations: ['Eau de Parfum', 'Eau de Toilette', 'Parfum', 'Eau de Cologne', 'Extrait'],

  badges: [
    { key: 'featured', label: 'Featured' },
    { key: 'new', label: 'New Arrival' },
    { key: 'bestseller', label: 'Best Seller' },
  ],

  story: [
    'Yannick Scents is a small, personal perfume house in Addis Ababa. We bring in authentic designer bottles and help each customer find the one that feels like them.',
    'No pressure and no guesswork: tell us what you like, what you wear and where you are going, and Yannick will guide you to a scent worth remembering.',
  ],
  founderPhoto: '/img/founder-placeholder.svg',

  faq: [
    {
      q: 'Are the perfumes original?',
      a: 'Yes. We sell only original designer fragrances, sourced from the houses listed on this site. If you have any doubt about a bottle, message us and we will gladly answer.',
    },
    {
      q: 'How does delivery work?',
      a: 'Delivery inside Addis Ababa is free. After you order on WhatsApp or by phone we confirm the bottle, your address and a delivery time that suits you.',
    },
    {
      q: 'How do I pay?',
      a: 'We agree the payment method with you when you order. Ask us on WhatsApp which options are available for your delivery.',
    },
    {
      q: 'Can I return a bottle?',
      a: 'Because fragrance is a personal product, opened bottles cannot be returned. If something is wrong with your order, contact us right away and we will make it right.',
    },
    {
      q: 'How do I choose a scent?',
      a: 'Use the filters in the collection, or simply message us. Tell us the scents you already love, the occasion and your budget, and we will suggest a few bottles.',
    },
  ],

  howToOrder: [
    {
      title: 'Choose',
      text: 'Browse the collection and pick a scent, or ask us for a recommendation.',
    },
    {
      title: 'Message or call',
      text: 'Tap Order on WhatsApp, call us, or send a TikTok DM. Your chosen bottle is filled in for you.',
    },
    {
      title: 'We deliver',
      text: 'We confirm the details and bring your bottle to your door in Addis Ababa, free of charge.',
    },
  ],

  values: [
    {
      icon: 'shield',
      title: '100% Original',
      text: 'Authentic designer bottles only. Never copies, never imitations.',
    },
    {
      icon: 'truck',
      title: 'Free Delivery',
      text: 'Delivered to your door anywhere in Addis Ababa at no extra cost.',
    },
    {
      icon: 'user',
      title: 'Personal Guidance',
      text: 'Not sure what suits you? Yannick will help you choose, one message away.',
    },
    {
      icon: 'growth',
      title: 'A Growing House',
      text: 'We are small and growing, and every customer matters to us.',
    },
  ],
};
