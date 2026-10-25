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
function translate(strings) {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.dataset.en ??= el.innerHTML;
    const text = strings[el.dataset.i18n];
    if (text !== undefined) el.innerHTML = rich(text);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.dataset.en ??= el.placeholder;
    el.placeholder = strings[el.dataset.i18nPlaceholder] ?? el.dataset.en;
  });
}

function restoreEnglish() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    if (el.dataset.en !== undefined) el.innerHTML = el.dataset.en;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    if (el.dataset.en !== undefined) el.placeholder = el.dataset.en;
  });
}

async function setLanguage(buttons, lang) {
  if (lang === 'am') translate(await load('am'));
  else restoreEnglish();
  current = lang;
  document.documentElement.lang = lang;
  buttons.forEach((button) => {
    button.textContent = lang === 'am' ? 'EN' : 'አማ';
    button.lang = lang === 'am' ? 'en' : 'am';
    button.setAttribute(
      'aria-label',
      lang === 'am' ? 'EN - switch language to English' : 'አማ - switch language to Amharic'
    );
  });
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* storage unavailable: the choice just won't persist */
  }
}

export function initLanguage() {
  const buttons = [...document.querySelectorAll('[data-lang-toggle]')];
  if (!buttons.length) return;
  buttons.forEach((button) =>
    button.addEventListener('click', () => setLanguage(buttons, current === 'en' ? 'am' : 'en'))
  );
  let saved = 'en';
  try {
    saved = localStorage.getItem(KEY) || 'en';
  } catch {
    /* storage unavailable */
  }
  if (saved === 'am') setLanguage(buttons, 'am');
}
