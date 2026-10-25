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
      '100% original designer perfume in Addis Ababa. Chanel, YSL, Valentino, Hugo Boss, Bentley and Azzaro. Free delivery in Addis. Order on WhatsApp or call.',
  },

  contact: {
    phone: phoneIntl,
    phoneDisplay: displayPhone(phoneIntl),
    whatsapp,
    tiktok: 'https://www.tiktok.com/@yannickscents',
    tiktokHandle: '@yannickscents',
    credit: {
      label: 'Bira Girma',
      url: 'mailto:biragirma4@gmail.com',
    },
  },

  location: {
    city: 'Addis Ababa',
    country: 'Ethiopia',
    countryCode: 'ET',
    text: 'Addis Ababa, Ethiopia. We deliver to your door anywhere in the city, free.',
  },

  // Replace with your real opening hours.
  hours: [
    { days: 'Monday - Saturday', time: '9:00 AM - 8:00 PM' },
    { days: 'Sunday', time: '10:00 AM - 6:00 PM' },
  ],
  hoursNote: 'Message outside these hours and we reply the next morning.',

  currency: 'ETB',

  houses: ['Chanel', 'Yves Saint Laurent', 'Valentino', 'Hugo Boss', 'Bentley', 'Azzaro'],

  /** The three scent families. Each gets its own colour across the whole site. */
  families: [
    { key: 'fresh', label: 'Fresh & Citrus' },
    { key: 'woody', label: 'Woody Aromatic' },
    { key: 'oriental', label: 'Oriental & Gourmand' },
  ],

  /** Public filter chips. "men"/"women" come from the product category. */
  collections: [
    { key: 'men', label: 'Men' },
    { key: 'women', label: 'Women' },
    { key: 'fresh', label: 'Fresh & Citrus' },
    { key: 'woody', label: 'Woody Aromatic' },
    { key: 'oriental', label: 'Oriental & Gourmand' },
    { key: 'affordable', label: 'Affordable' },
    { key: 'handpick', label: "Yannick's Selection" },
  ],

  categories: [
    { key: 'men', label: 'Men' },
    { key: 'women', label: 'Women' },
    { key: 'unisex', label: 'Unisex' },
  ],

  concentrations: ['Eau de Parfum', 'Eau de Toilette', 'Parfum', 'Eau de Cologne', 'Extrait'],

  badges: [
    { key: 'featured', label: 'Featured' },
    { key: 'new', label: 'New' },
    { key: 'bestseller', label: 'Best Seller' },
  ],

  story: {
    statement: 'A small shop in Addis Ababa, with a *real person* on the other end.',
    paragraphs: [
      'Yannick Scents brings in original bottles from famous houses, and helps you choose one you will actually wear.',
      'Tell us what you like and what you can spend. Yannick replies personally, usually with two or three suggestions rather than a long list.',
    ],
  },
  founderPhoto: '/img/founder-placeholder.svg',

  /** "Find your scent" guide. Budgets are in ETB; edit to match your range. */
  quiz: {
    who: [
      { key: 'men', label: 'For him', sub: 'Men and boys' },
      { key: 'women', label: 'For her', sub: 'Women and girls' },
      { key: 'any', label: 'For anyone', sub: 'Show me everything' },
    ],
    vibe: [
      { key: 'fresh', label: 'Fresh and clean', sub: 'Daytime, the office, warm days' },
      { key: 'woody', label: 'Warm and woody', sub: 'Confident, everyday' },
      { key: 'oriental', label: 'Sweet and rich', sub: 'Evenings, weddings, going out' },
      { key: 'any', label: 'Surprise me', sub: 'Any style' },
    ],
    budget: [
      { key: 'low', label: 'Up to 8,000', max: 8000 },
      { key: 'mid', label: '8,000 to 13,000', min: 8000, max: 13000 },
      { key: 'high', label: '13,000 and up', min: 13000 },
      { key: 'any', label: 'No limit' },
    ],
  },

  /** The three acts of a perfume, with example notes. */
  journey: [
    {
      key: 'top',
      title: 'Top notes',
      time: 'The first fifteen minutes',
      text: 'The first hello. Bright and quick, it fades as the heart arrives.',
      notes: ['Bergamot', 'Grapefruit', 'Pink pepper', 'Mint'],
      tone: 'citrus',
      level: 0.82,
    },
    {
      key: 'heart',
      title: 'Heart notes',
      time: 'The next hour or two',
      text: 'The true character. This is what people notice on you.',
      notes: ['Jasmine', 'Rose', 'Ginger', 'Nutmeg'],
      tone: 'amber',
      level: 0.56,
    },
    {
      key: 'base',
      title: 'Base notes',
      time: 'Until the next morning',
      text: 'What lingers on your collar, long after you have left the room.',
      notes: ['Cedar', 'Vanilla', 'Amber', 'Musk'],
      tone: 'honey',
      level: 0.3,
    },
  ],

  /** Scent by mood: each mood tints the bottle and picks three bottles from the shelf. */
  moods: [
    {
      key: 'morning',
      label: 'Morning',
      line: 'Clean and bright, for the first hours.',
      tone: 'citrus',
      level: 0.74,
      collections: ['fresh'],
      keywords: ['citrus', 'bergamot', 'lemon', 'grapefruit', 'orange', 'mint', 'green', 'marine'],
    },
    {
      key: 'evening',
      label: 'Evening',
      line: 'Warm and easy, for dinner and company.',
      tone: 'amber',
      level: 0.62,
      collections: ['women', 'handpick'],
      keywords: ['rose', 'jasmine', 'vanilla', 'sandalwood', 'cedar', 'iris', 'amber', 'floral'],
    },
    {
      key: 'night',
      label: 'Night out',
      line: 'Deep and lasting, made to be noticed.',
      tone: 'honey',
      level: 0.5,
      collections: ['oriental'],
      keywords: [
        'oud',
        'amber',
        'patchouli',
        'incense',
        'leather',
        'tobacco',
        'spice',
        'musk',
        'pepper',
      ],
    },
  ],

  /** Three understated facts under the story. */
  facts: [
    { num: '6', title: 'Houses', text: 'Chanel, YSL, Valentino, Hugo Boss, Bentley, Azzaro.' },
    { num: '100%', title: 'Original', text: 'No copies, and nothing "inspired by".' },
    { num: '0', title: 'Delivery fee', text: 'Free to your door anywhere in Addis Ababa.' },
  ],

  faq: [
    {
      q: 'Are the perfumes original?',
      a: 'Yes. We sell original designer bottles only. No copies, no "inspired by". If you doubt a bottle, message us and ask.',
    },
    {
      q: 'How does delivery work?',
      a: 'Delivery inside Addis Ababa is free. You order on WhatsApp or by phone. We confirm the bottle, your address and a time, then we bring it.',
    },
    {
      q: 'How do I pay?',
      a: 'We agree the payment method with you when you order. Ask on WhatsApp which options work for your delivery.',
    },
    {
      q: 'Can I return a bottle?',
      a: 'Perfume is personal, so opened bottles cannot be returned. If something is wrong with your order, tell us right away and we will sort it out.',
    },
    {
      q: 'How do I choose a scent?',
      a: 'Try "Find your scent" on this page: three questions and you get one to three bottles. Or message us the perfumes you already love and we will suggest similar ones.',
    },
  ],

  howToOrder: [
    { title: 'Choose', text: 'Browse the collection, or let the guide narrow it to two or three.' },
    {
      title: 'Message',
      text: 'WhatsApp opens with your bottle already written in. Send it, or call us.',
    },
    {
      title: 'Delivered',
      text: 'We confirm the details and bring it to your door in Addis. Free.',
    },
  ],
};
