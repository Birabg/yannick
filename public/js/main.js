import { initNav } from './nav.js';
import { initReveal } from './reveal.js';
import { initFooter } from './footer.js';
import { initFilters } from './filters.js';
import { initSheet } from './sheet.js';
import { initQuiz } from './quiz.js';
import { initLanguage } from './i18n.js';
import { initHero } from './hero.js';
import { initHeroShader } from './hero-shader.js';
import { initCards, initMood } from './cards.js';
import { initTheme } from './theme.js';
import { initPhotos } from './photo.js';
import { initStory } from './story.js';
import { initFamilies } from './families.js';
import { initFaq } from './faq.js';
import { initOrder } from './order.js';
import { initHours } from './hours.js';
import { initHouses } from './houses.js';
import { initReveals } from './rv.js';
import { loadLateFonts } from './fonts.js';

// What the first screen needs runs straight away.
initTheme();
initPhotos();
initNav();
initLanguage();
initCards();
initHero();

// Everything else waits for an idle moment, one small task each, so the hero entrance is never blocked.
// The guide (the heaviest) waits until the entrance (about 1.4s) is over.
const idle = (fn) =>
  window.requestIdleCallback
    ? window.requestIdleCallback(fn, { timeout: 2000 })
    : setTimeout(fn, 200);
[
  initFilters,
  initSheet,
  initReveals,
  initReveal,
  initStory,
  initFamilies,
  initFaq,
  initOrder,
  initHours,
  initHouses,
  initFooter,
  initMood,
  initHeroShader,
].forEach((init) => idle(init));
setTimeout(() => idle(initQuiz), 2500);
// the two extra faces (Ethiopic, handwriting) load on the visitor's first touch, key or scroll, or when Amharic is chosen
['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach((type) =>
  window.addEventListener(type, loadLateFonts, { once: true, passive: true })
);
