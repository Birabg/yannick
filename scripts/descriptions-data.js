/**
 * Draft copy for each perfume, written from the brand and name on the bottle only.
 * It describes the general character (fresh, woody, sweet, spicy ...) and never states notes,
 * hours of wear, awards, release years, perfumers or anything about authenticity or sourcing.
 * `confidence` is how sure the writer is that the general character matches the real fragrance.
 * Notes are left empty everywhere on purpose: the exact top/heart/base notes differ between
 * versions of a fragrance and were not confirmed.
 *
 * Match is by brand + name as stored in the database (case-insensitive).
 */
module.exports = [
  {
    brand: 'Chanel',
    name: 'Bleu de Chanel',
    confidence: 'high',
    description_en:
      'Crisp and woody, with a clean aromatic freshness that reads more like cold air and pressed shirts than anything sweet. It is easy to wear to the office, to dinner or on a warm day. Spray it on the neck and keep the rest of your look simple.',
    description_am:
      'ጥርት ያለና ከእንጨት ጠረን ጋር የተቀላቀለ ትኩስነት ያለው ሽቶ ነው፤ ከጣፋጭ ይልቅ ንጹህ አየርና የተተኮሰ ሸሚዝ ይመስላል። ለቢሮ፣ ለራት እና ለሞቃት ቀን በቀላሉ ይሄዳል። አንገትዎ ላይ ይርጩት፤ የቀረውን አለባበስዎን ቀላል ያድርጉት።',
    tagline_en: 'Clean, woody and easy to wear',
    tagline_am: 'ንጹሕ፣ እንጨታማና ለመልበስ ቀላል',
    meta_description:
      'Bleu de Chanel: a crisp, woody-aromatic scent for the office, dinner and warm days. Order from Yannick Scents in Addis Ababa.',
  },
  {
    brand: 'Versace',
    name: 'Eros',
    confidence: 'high',
    description_en:
      'Eros opens cool and minty, then settles into a sweet, warm base that feels bold without being heavy. It suits evenings out, parties and nights when you want to be noticed. Go light on the sprays and let it do the talking.',
    description_am:
      'ኤሮስ በቀዝቃዛ የአዝሙድ ጠረን ይጀምርና ወደ ጣፋጭና ሞቅ ያለ መሠረት ይሸጋገራል፤ ደፋር ነው፣ ግን አይከብድም። ለምሽት መውጫ፣ ለድግስና ትኩረት ማግኘት ለሚፈልጉባቸው ምሽቶች ይስማማል። በጥቂቱ ይርጩት፤ ቀሪውን ራሱ ይናገራል።',
    tagline_en: 'Cool mint meets warm sweetness',
    tagline_am: 'ቀዝቃዛ አዝሙድ ከሞቅ ጣፋጭነት ጋር',
    meta_description:
      'Versace Eros: cool mint over a sweet, warm base, made for evenings out and parties. Order from Yannick Scents in Addis Ababa.',
  },
  {
    brand: 'Louis Vuitton',
    name: 'Ombré Nomade',
    confidence: 'medium',
    description_en:
      'Smoky and resinous, Ombré Nomade smells like dark wood and incense drifting through a warm room. It belongs to cooler evenings, special occasions and anyone who likes a fragrance with a story to it. A single spray on the wrist is enough to start a conversation.',
    description_am:
      'ጭስ መሰልና ሙጫ መሰል ጠረን ያለው ኦምብሬ ኖማድ፣ በሞቀ ክፍል ውስጥ የሚንሳፈፍ ጥቁር እንጨትና ዕጣን ይመስላል። ለቀዝቃዛ ምሽቶች፣ ለልዩ ዝግጅቶችና ታሪክ ያለው ሽቶ ለሚወዱ ይሆናል። አንጓ ላይ አንድ ርጭት ውይይት ለመጀመር ይበቃል።',
    tagline_en: 'Smoky, resinous, made for evenings',
    tagline_am: 'ጭስ መሰል፣ ለምሽት የተሠራ',
    meta_description:
      'Louis Vuitton Ombré Nomade: a smoky, resinous scent for cool evenings and special occasions. Order from Yannick Scents in Addis Ababa.',
  },
  {
    brand: 'Creed',
    name: 'Aventus',
    confidence: 'high',
    description_en:
      'A fruity opening gives way to a smoky, musky dry-down, which makes Aventus feel confident and a little sharp. It works for meetings, the office and dressed-up evenings, especially in mild weather. Pair it with tailoring and skip any other scent on your skin.',
    description_am:
      'የፍራፍሬ ጠረን ወደ ጭስ መሰልና ሙስክ መሰል መጨረሻ ይሸጋገራል፤ በራስ መተማመን ያለውና ትንሽ ሹል ነው። ለስብሰባ፣ ለቢሮና ለሚያምር ምሽት፣ በተለይ በመካከለኛ የአየር ሁኔታ ይመጥናል። ከተሰፋ ልብስ ጋር ያጣምሩት፤ ሌላ ሽቶ አይጨምሩ።',
    tagline_en: 'Fruity, smoky and quietly bold',
    tagline_am: 'ፍራፍሬ መሰል፣ ጭስ መሰል፣ ደፋር',
    meta_description:
      'Creed Aventus: a fruity, smoky scent that feels confident, for meetings and dressed-up evenings. Order from Yannick Scents in Addis Ababa.',
  },
  {
    brand: 'Prada',
    name: 'Prada Black',
    confidence: 'low',
    description_en:
      'Dark, smooth and understated, this black-bottled Prada leans toward warm wood rather than anything bright. It is a natural choice for evenings, colder days and the hours after work. Wear it with dark denim or a plain jacket.',
    description_am:
      'ጥቁር፣ ለስላሳና የተረጋጋ ጠረን ያለው ይህ የፕራዳ ሽቶ፣ ከብርሃን ይልቅ ወደ ሞቅ ያለ እንጨት ያደላል። ለምሽት፣ ለቀዝቃዛ ቀናትና ከሥራ በኋላ ላሉት ሰዓታት ተመራጭ ነው። ከጥቁር ጂንስ ወይም ከተራ ጃኬት ጋር ያድርጉት።',
    tagline_en: 'Dark, smooth and made for after hours',
    tagline_am: 'ጥቁር፣ ለስላሳና ለምሽት',
    meta_description:
      'Prada Black: a dark, smooth scent leaning to warm wood, for evenings and cooler days. Order from Yannick Scents in Addis Ababa.',
  },
  {
    brand: 'Valentino',
    name: 'Uomo Born in Roma Coral Fantasy',
    confidence: 'low',
    description_en:
      'Born in Roma Coral Fantasy is a modern take on the studded Valentino bottle, leaning bright and fruity rather than heavy. Think weekends, daytime plans and warm evenings. Ask us on WhatsApp and we will tell you how it wears.',
    description_am:
      'ቦርን ኢን ሮማ ኮራል ፋንታሲ የቫለንቲኖ ባለጌጥ ጠርሙስ ዘመናዊ ስሪት ነው፤ ከክብደት ይልቅ ወደ ብሩህና ፍራፍሬ መሰል ጠረን ያደላል። ለቅዳሜና እሁድ፣ ለቀን ዕቅዶችና ለሞቁ ምሽቶች ይሆናል። በዋትስአፕ ይጠይቁን፤ እንዴት እንደሚሸት እንነግርዎታለን።',
    tagline_en: 'Bright, easygoing and made for daytime',
    tagline_am: 'ብሩህ፣ ቀላልና ለቀን የተሠራ',
    meta_description:
      'Valentino Uomo Born in Roma Coral Fantasy: a bright, easygoing scent in the studded bottle. Order from Yannick Scents in Addis Ababa.',
  },
  {
    brand: 'Azzaro',
    name: 'The Most Wanted Parfum',
    confidence: 'medium',
    description_en:
      'Warm spice meets a sweet, amber-like finish in The Most Wanted Parfum, a scent that feels close and inviting. It is made for evenings, dates and cooler weather. Spray it on a shirt collar and let it follow you in.',
    description_am:
      'ሞቅ ያለ ቅመም ከጣፋጭና አምበር መሰል መጨረሻ ጋር በዘ ሞስት ዋንትድ ፓርፉም ይገናኛሉ፤ ቅርብና ጋባዥ ጠረን አለው። ለምሽት፣ ለቀጠሮና ለቀዝቃዛ የአየር ጠባይ የተሠራ ነው። ሸሚዝ አንገትጌ ላይ ይርጩትና ይከተልዎ።',
    tagline_en: 'Warm spice with a sweet finish',
    tagline_am: 'ሞቅ ያለ ቅመምና ጣፋጭ መጨረሻ',
    meta_description:
      'Azzaro The Most Wanted Parfum: warm spice and a sweet, amber-like finish for evenings and dates. Order from Yannick Scents in Addis Ababa.',
  },
  {
    brand: 'Hugo Boss',
    name: 'Bottled Night',
    confidence: 'medium',
    description_en:
      'Bottled Night is woody and softly aromatic, a darker and calmer sibling of the classic Boss bottle. It suits evenings, the hours after work and the cooler months. Try it with a dark shirt, and spray the neck and chest rather than the wrists.',
    description_am:
      'ቦትልድ ናይት እንጨታማና ለስለስ ያለ የቅመም ጠረን አለው፤ ከታወቀው የቦስ ጠርሙስ ይልቅ ጠቆር ያለና የተረጋጋ ነው። ለምሽት፣ ከሥራ በኋላ ላለ ጊዜና ለቀዝቃዛ ወራት ይመጥናል። ከጥቁር ሸሚዝ ጋር ይሞክሩት፤ ከአንጓ ይልቅ አንገትና ደረት ላይ ይርጩት።',
    tagline_en: 'Woody freshness for after dark',
    tagline_am: 'ለምሽት የሚሆን እንጨታማ ትኩስነት',
    meta_description:
      'Hugo Boss Bottled Night: a woody, softly aromatic scent for evenings and cooler months. Order from Yannick Scents in Addis Ababa.',
  },
  {
    brand: 'Afnan',
    name: '9pm',
    confidence: 'medium',
    description_en:
      'Sweet, warm and a little spicy, 9pm is a gourmand-leaning scent that smells like dessert for the evening. It suits nights out and cold weather. Add a spray to your jacket before you head out.',
    description_am:
      'ጣፋጭ፣ ሞቅ ያለና ቀለል ያለ ቅመም ያለው 9pm፣ የምሽት ጣፋጭ ምግብ የሚመስል ጠረን ነው። ለምሽት መውጫና ለብርዳማ ቀናት ይሆናል። ከመውጣትዎ በፊት ጃኬትዎ ላይ አንድ ርጭት ይጨምሩ።',
    tagline_en: 'Sweet, warm and made for night',
    tagline_am: 'ጣፋጭ፣ ሞቅ ያለ፣ ለምሽት',
    meta_description:
      'Afnan 9pm: a sweet, warm and lightly spiced scent for nights out and cold weather. Order from Yannick Scents in Addis Ababa.',
  },
  {
    brand: 'Afnan',
    name: '9pm Night Out',
    confidence: 'low',
    description_en:
      'Dense and warm, Night Out is made for the late part of the evening, with a sweet, rounded character and a dark, textured bottle to match. It suits dinners, parties and cold nights more than the heat of midday. One or two sprays is plenty.',
    description_am:
      'ናይት አውት ጥቅጥቅና ሞቅ ያለ ጠረን ያለው ሲሆን፣ ለምሽቱ ዘግይቶ ለሚኖረው ክፍል የተሠራ ነው፤ ክብ ጣፋጭነቱ ከጠቆረው ጠርሙሱ ጋር ይሄዳል። ለራት፣ ለድግስና ለቀዝቃዛ ምሽቶች ይሆናል፤ ለቀትር ሙቀት ግን አይሆንም። አንድ ወይም ሁለት ርጭት ይበቃል።',
    tagline_en: 'Deeper sweetness for the late evening',
    tagline_am: 'ለምሽቱ ዘግይቶ ክፍል የሚሆን ጣፋጭነት',
    meta_description:
      'Afnan 9pm Night Out: a dense, warm and sweet scent for late evenings, dinners and cold nights. Order from Yannick Scents in Addis Ababa.',
  },
  {
    brand: 'Dior',
    name: 'Sauvage',
    confidence: 'high',
    description_en:
      'Fresh spice over a warm, ambery base, Sauvage is open, outdoorsy and easy to like. It works from a weekday morning to a Saturday night, in most seasons. Keep it to the pulse points and let it settle.',
    description_am:
      'ትኩስ ቅመም በሞቅ አምበር መሰል መሠረት ላይ ያረፈበት ሳቫጅ፣ ክፍትና ለመውደድ ቀላል ነው። ከሰኞ ጠዋት እስከ ቅዳሜ ምሽት በአብዛኛው ወቅት ይሄዳል። አንጓና አንገት ላይ ብቻ ይርጩትና እንዲረጋጋ ይተዉት።',
    tagline_en: 'Fresh spice with an amber glow',
    tagline_am: 'ትኩስ ቅመም ከአምበር ብርሃን ጋር',
    meta_description:
      'Dior Sauvage: fresh spice over a warm, ambery base, easy to wear from morning to night. Order from Yannick Scents in Addis Ababa.',
  },
];
