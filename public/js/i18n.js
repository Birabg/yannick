import { loadLateFonts } from './fonts.js';
const KEY = 'ys-lang';
const cache = {};
let current = 'en';

async function load(lang) {
  if (!cache[lang]) {
    const response = await fetch(`/i18n/${lang}.json`);
    cache[lang] = await response.json();
  }
  return cache[lang];
}

/** Escapes text, then turns *word* into an emphasised word (same rule as the server). */
function rich(text) {
  const escaped = text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  return escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

/** English markup is remembered on first translation so it can be restored exactly. */
function translate(strings, root = document) {
  translateProducts(root, true);
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.dataset.en ??= el.innerHTML;
    const text = strings[el.dataset.i18n];
    if (text !== undefined) el.innerHTML = rich(text);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.dataset.en ??= el.placeholder;
    el.placeholder = strings[el.dataset.i18nPlaceholder] ?? el.dataset.en;
  });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.dataset.enAria ??= el.getAttribute('aria-label');
    el.setAttribute('aria-label', strings[el.dataset.i18nAria] ?? el.dataset.enAria);
  });
}

/** Product copy carries its Amharic text in data-am; the English text is kept to switch back. */
function translateProducts(root, toAmharic) {
  root.querySelectorAll('[data-am]').forEach((el) => {
    if (toAmharic) {
      el.dataset.enText ??= el.textContent;
      el.textContent = el.dataset.am;
      el.lang = 'am';
    } else if (el.dataset.enText !== undefined) {
      el.textContent = el.dataset.enText;
      el.removeAttribute('lang');
    }
  });
}

/** Called after new markup is inserted (the product panel), so it follows the chosen language. */
export function refreshLanguage(root) {
  if (current === 'am') load('am').then((strings) => translate(strings, root));
}

function restoreEnglish() {
  translateProducts(document, false);
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    if (el.dataset.en !== undefined) el.innerHTML = el.dataset.en;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    if (el.dataset.en !== undefined) el.placeholder = el.dataset.en;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    if (el.dataset.enAria !== undefined) el.setAttribute('aria-label', el.dataset.enAria);
  });
}

async function setLanguage(buttons, lang) {
  if (lang === 'am') {
    loadLateFonts();
    translate(await load('am'));
  } else restoreEnglish();
  current = lang;
  document.documentElement.lang = lang;
  buttons.forEach((button) =>
    button.setAttribute('aria-pressed', String(button.dataset.langSet === lang))
  );
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* storage unavailable: the choice just won't persist */
  }
}

export function initLanguage() {
  const buttons = [...document.querySelectorAll('[data-lang-set]')];
  if (!buttons.length) return;
  buttons.forEach((button) =>
    button.addEventListener('click', () => {
      if (button.dataset.langSet !== current) setLanguage(buttons, button.dataset.langSet);
    })
  );
  let saved = 'en';
  try {
    saved = localStorage.getItem(KEY) || 'en';
  } catch {
    /* storage unavailable */
  }
  if (saved === 'am') setLanguage(buttons, 'am');
}
