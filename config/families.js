/**
 * The scent families shown in the home page accordion and on /families/<key>.
 * `key` is a collection key from config/site.js, so a family lists every product tagged with it.
 * A family with no bottles is left out of the accordion. Edit the words here; they are merged into
 * the English / Amharic strings in config/i18n.js (family.<key>.title / .sub / .text).
 *
 * The Amharic copy is a draft and needs a native review before launch, like the rest of the site's Amharic.
 */
const families = [
  {
    key: 'fresh',
    en: {
      title: 'Fresh & Citrus',
      sub: 'Light, bright, made for Addis afternoons',
      text: 'Bright and quick, it opens like cut citrus and fades gently as the heart arrives. Easy to wear from the first coffee to the last meeting.',
    },
    am: {
      title: 'ትኩስ እና ሲትረስ',
      sub: 'ቀላል፣ ብሩህ፣ ለአዲስ አበባ ከሰዓት በኋላ',
      text: 'እንደተቆረጠ ሎሚ ብሩህ ሆኖ ይከፈታል፣ ልብ ማስታወሻው ሲመጣ ቀስ ብሎ ይሸፈናል። ከጠዋት ቡና እስከ መጨረሻ ስብሰባ ለመልበስ ቀላል።',
    },
  },
  {
    key: 'woody',
    en: {
      title: 'Woody Aromatic',
      sub: 'Calm, dry, quietly confident',
      text: 'Cedar, vetiver and herbs on warm skin. A steady scent that feels put together without asking for attention.',
    },
    am: {
      title: 'የእንጨት መዓዛ',
      sub: 'ረጋ ያለ፣ ደረቅ፣ በጸጥታ የሚተማመን',
      text: 'ዝግባ፣ ቬቲቨር እና ቅጠላ ቅመም በሞቀ ቆዳ ላይ። ትኩረት ሳይጠይቅ የተስተካከለ የሚያስመስል ቋሚ መዓዛ።',
    },
  },
  {
    key: 'oriental',
    en: {
      title: 'Oriental & Gourmand',
      sub: 'Warm, sweet, impossible to miss',
      text: 'Amber, vanilla and spice wrapped around something sweet. Rich bottles for evenings, weddings and nights out.',
    },
    am: {
      title: 'ምስራቃዊ እና ጣፋጭ',
      sub: 'ሞቅ ያለ፣ ጣፋጭ፣ የማይታለፍ',
      text: 'አምበር፣ ቫኒላ እና ቅመም በጣፋጭ ነገር ተጠቅልለው። ለምሽት፣ ለሠርግ እና ለመዝናኛ የሚሆኑ የበለጸጉ ጠርሙሶች።',
    },
  },
  {
    key: 'men',
    en: {
      title: 'For Him',
      sub: 'Bottles he will actually wear',
      text: 'From crisp daily scents to deep evening ones, every bottle here is original and chosen for men.',
    },
    am: {
      title: 'ለወንዶች',
      sub: 'በእርግጥ የሚለብሱት ጠርሙሶች',
      text: 'ከንጹህ የዕለት መዓዛዎች እስከ ጥልቅ የምሽት መዓዛዎች፣ እዚህ ያለው እያንዳንዱ ጠርሙስ ኦሪጅናል ሲሆን ለወንዶች የተመረጠ ነው።',
    },
  },
  {
    key: 'women',
    en: {
      title: 'For Her',
      sub: 'Soft, floral, personal',
      text: 'Flowers, fruit and warm musk, from light day scents to something for the evening.',
    },
    am: {
      title: 'ለሴቶች',
      sub: 'ለስላሳ፣ የአበባ፣ የግል',
      text: 'አበባ፣ ፍራፍሬ እና ሞቅ ያለ ምስክ፣ ከቀላል የቀን መዓዛ እስከ ለምሽት የሚሆን።',
    },
  },
  {
    key: 'handpick',
    en: {
      title: "Yannick's Hand Pick",
      sub: 'What we would wear ourselves',
      text: 'A short list chosen by Yannick. Bottles that earn compliments and keep their promise on the skin.',
    },
    am: {
      title: 'የያኒክ ምርጫ',
      sub: 'እኛ ራሳችን የምንለብሰው',
      text: 'በያኒክ የተመረጠ አጭር ዝርዝር። አድናቆት የሚያስገኙ እና በቆዳ ላይ የገቡትን ቃል የሚጠብቁ ጠርሙሶች።',
    },
  },
  {
    key: 'affordable',
    en: {
      title: 'Affordable',
      sub: 'Good scent, fair price',
      text: 'Original perfume that respects your budget. Still sealed, still authentic, still delivered free in Addis.',
    },
    am: {
      title: 'ተመጣጣኝ ዋጋ',
      sub: 'ጥሩ መዓዛ፣ ተገቢ ዋጋ',
      text: 'ከበጀትዎ ጋር የሚሄድ ኦሪጅናል ሽቶ። አሁንም የታሸገ፣ አሁንም እውነተኛ፣ አሁንም በአዲስ አበባ በነጻ የሚደርስ።',
    },
  },
];

/** Section and page strings, plus each family's title / sub / text, as flat i18n keys for one language. */
const common = {
  en: {
    'families.label': 'Scent Families',
    'families.title': 'Find your *family*',
    'families.lead': 'Slide across to meet each family of scents. Open one to see every bottle in it.',
    'family.explore': 'Explore',
    'family.back': 'Back to Collection',
    'family.bottles': 'Bottles in this family',
    'family.notes': 'Notes you will find here',
    'family.top': 'Top',
    'family.heart': 'Heart',
    'family.base': 'Base',
    'family.empty': 'No bottles here yet. Message us and we will find one for you.',
  },
  am: {
    'families.label': 'የመዓዛ ቤተሰቦች',
    'families.title': 'የእርስዎን *ቤተሰብ* ያግኙ',
    'families.lead': 'እያንዳንዱን የመዓዛ ቤተሰብ ለማየት ያንሸራትቱ። ሁሉንም ጠርሙሶች ለማየት አንዱን ይክፈቱ።',
    'family.explore': 'ይመልከቱ',
    'family.back': 'ወደ ስብስቡ ተመለስ',
    'family.bottles': 'በዚህ ቤተሰብ ውስጥ ያሉ ጠርሙሶች',
    'family.notes': 'እዚህ የሚያገኟቸው ማስታወሻዎች',
    'family.top': 'የላይ',
    'family.heart': 'የልብ',
    'family.base': 'የታች',
    'family.empty': 'እስካሁን እዚህ ጠርሙስ የለም። መልዕክት ይላኩልን እናፈላልግልዎታለን።',
  },
};

function strings(lang) {
  const out = { ...common[lang] };
  families.forEach((f) => {
    out[`family.${f.key}.title`] = f[lang].title;
    out[`family.${f.key}.sub`] = f[lang].sub;
    out[`family.${f.key}.text`] = f[lang].text;
  });
  return out;
}

module.exports = { families, strings };
