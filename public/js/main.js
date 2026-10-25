import { initNav } from './nav.js';
import { initReveal } from './reveal.js';
import { initFooter } from './footer.js';
import { initFilters } from './filters.js';
import { initSheet } from './sheet.js';
import { initQuiz } from './quiz.js';
import { initLanguage } from './i18n.js';
import { initHeroShader } from './hero-shader.js';
import { initCards, initMood } from './cards.js';
import { initTheme } from './theme.js';
import { initPhotos } from './photo.js';

initTheme();
initPhotos();
initNav();
initReveal();
initFooter();
initFilters();
initSheet();
initLanguage();
initCards();
initMood();
initHeroShader();

// The guide is below the fold, so it can wait for an idle moment.
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
idle(initQuiz);
