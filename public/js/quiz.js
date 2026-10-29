import { prefersReducedMotion } from './motion.js';

/**
 * "Find my scent": three steps, then one to three bottles drawn with the shop's own product card
 * and a one-tap WhatsApp message that lists them. The questions come from site.quiz, the words around
 * them from the i18n files (both languages are embedded, and the guide follows the language toggle).
 */
const TOP_PICKS = 3;
const BUDGET_SLACK = 0.25; // how far outside the chosen range still counts as "close"
const SLIDE_MS = 300;
const EASE = 'cubic-bezier(.22, .8, .2, 1)';

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

/** The bottles on the shelf, read from the collection grid (not from the cards this guide draws). */
function readProducts() {
  return [...document.querySelectorAll('#grid [data-card]')].map((card) => ({
    node: card,
    slug: card.dataset.slug,
    label: card.dataset.label,
    priceText: card.dataset.priceText,
    price: Number(card.dataset.price),
    category: card.dataset.category,
    collections: card.dataset.collections.split(' '),
    inStock: card.dataset.instock === '1',
    order: Number(card.dataset.order),
  }));
}

/** Higher is better; null means the bottle is excluded. */
function score(p, answers, { useBudget, useVibe }) {
  if (!p.inStock) return null;
  let points = 0;
  if (answers.who.key !== 'any') {
    if (p.category === answers.who.key) points += 2;
    else if (p.category !== 'unisex') return null;
  }
  if (useVibe && answers.vibe.key !== 'any' && p.collections.includes(answers.vibe.key))
    points += 4;
  else if (useVibe && answers.vibe.key !== 'any') return null;
  if (useBudget && answers.budget.key !== 'any') {
    const { min = 0, max = Infinity } = answers.budget;
    if (p.price >= min && p.price <= max) points += 3;
    else {
      const slackMax = max === Infinity ? Infinity : max * (1 + BUDGET_SLACK);
      const slackMin = min * (1 - BUDGET_SLACK);
      if (p.price > slackMax || p.price < slackMin) return null;
      points += 1;
    }
  }
  return points;
}

/** Tries the exact answers first, then drops the budget, then the style, and says which it did. */
function recommend(products, answers) {
  const attempts = [
    { useBudget: true, useVibe: true, note: '' },
    { useBudget: false, useVibe: true, note: 'quiz.noteBudget' },
    { useBudget: true, useVibe: false, note: 'quiz.noteStyle' },
    { useBudget: false, useVibe: false, note: 'quiz.noteWho' },
  ];
  for (const attempt of attempts) {
    const ranked = products
      .map((p) => ({ p, s: score(p, answers, attempt) }))
      .filter((r) => r.s !== null)
      .sort((a, b) => b.s - a.s || a.p.order - b.p.order)
      .slice(0, TOP_PICKS)
      .map((r) => r.p);
    if (ranked.length) return { picks: ranked, note: attempt.note };
  }
  return { picks: [], note: '' };
}

export function initQuiz() {
  const root = document.getElementById('quiz');
  const dataNode = document.getElementById('quiz-data');
  if (!root || !dataNode) return;
  const { steps, whatsapp, strings } = JSON.parse(dataNode.textContent);
  const products = readProducts();
  const panel = root.querySelector('[data-quiz-panel]');
  const answers = {};
  let step = 0;
  let focusNext = false;

  const lang = () => (document.documentElement.lang === 'am' ? 'am' : 'en');
  const t = (key, vars = {}) =>
    (strings[lang()][key] ?? strings.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k]);
  const waLink = (text) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;

  /** Three amber segments and the words "Step 1 of 3" (the words carry the meaning, the colour only echoes it). */
  function progress() {
    const done = step >= steps.length;
    const wrap = el('div', 'quiz__top');
    const bar = el('div', 'quiz__bar');
    bar.setAttribute('aria-hidden', 'true');
    steps.forEach((_, i) => {
      const seg = el('span', 'quiz__seg');
      if (done || i < step) seg.classList.add('is-done');
      else if (i === step) seg.classList.add('is-now');
      seg.append(el('span', 'quiz__fill'));
      bar.append(seg);
    });
    const label = done ? t('quiz.done') : t('quiz.stepOf', { n: step + 1, total: steps.length });
    wrap.append(bar, el('p', 'quiz__step', label));
    return wrap;
  }

  /** One question: a radio group of big option cards. Arrow keys move, Enter or Space chooses. */
  function question() {
    const { id, question: text, options } = steps[step];
    const slide = el('div', 'quiz__slide');
    const heading = el('h3', 'quiz__q', text);
    heading.id = `quiz-q-${id}`;
    heading.tabIndex = -1;
    const group = el('div', `quiz__options quiz__options--${options.length}`);
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-labelledby', heading.id);
    const chosen = answers[id];
    const buttons = options.map((option, n) => {
      const button = el('button', 'quiz__opt');
      button.type = 'button';
      button.setAttribute('role', 'radio');
      const picked = chosen ? chosen.key === option.key : false;
      button.setAttribute('aria-checked', String(picked));
      button.tabIndex = picked || (!chosen && n === 0) ? 0 : -1;
      const body = el('span', 'quiz__opt-body');
      body.append(el('span', 'quiz__opt-label', option.label));
      if (option.sub) body.append(el('span', 'quiz__opt-sub', option.sub));
      const arrow = el('span', 'quiz__opt-go');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.innerHTML =
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
      const mark = el('span', 'quiz__mark');
      mark.setAttribute('aria-hidden', 'true');
      button.append(mark, body, arrow);
      button.addEventListener('click', () => choose(id, option));
      button.addEventListener('keydown', (event) => {
        const move = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
        if (!move) return;
        event.preventDefault();
        const next = buttons[(n + move + buttons.length) % buttons.length];
        buttons.forEach((b) => (b.tabIndex = b === next ? 0 : -1));
        next.focus();
      });
      return button;
    });
    group.append(...buttons);
    slide.append(heading, el('p', 'quiz__hint', t('quiz.hint')), group);
    if (step > 0) slide.append(backButton());
    return { slide, focus: heading };
  }

  function backButton() {
    const back = el('button', 'quiz__back');
    back.type = 'button';
    back.innerHTML =
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
    back.append(el('span', '', t('quiz.back')));
    back.addEventListener('click', () => go(step - 1, -1));
    return back;
  }

  function orderMessage(picks) {
    if (picks.length === 1) {
      return `Hello Yannick Scents, I'd like to order ${picks[0].label} (${picks[0].priceText}).`;
    }
    const lines = picks.map((p, i) => `${i + 1}. ${p.label} (${p.priceText})`);
    return `Hello Yannick Scents, I took the Find My Scent quiz and these match me:\n${lines.join('\n')}\nCan you help me pick one and order?`;
  }

  /** The result: up to three of the shop's own product cards (copies of the ones in the collection). */
  function result() {
    const { picks, note } = recommend(products, answers);
    const summary = `${answers.who.label} · ${answers.vibe.label} · ${answers.budget.label}`;
    const slide = el('div', 'quiz__slide');
    const heading = el('h3', 'quiz__q', picks.length ? t('quiz.resultTitle') : t('quiz.noneTitle'));
    heading.tabIndex = -1;
    slide.append(heading, el('p', 'quiz__summary', summary));
    if (note) slide.append(el('p', 'quiz__note', t(note)));

    if (picks.length) {
      const list = el('ul', `quiz__picks quiz__picks--${picks.length}`);
      picks.forEach((p, i) => {
        const item = el('li', 'quiz__pick');
        item.append(el('span', 'quiz__rank', `No. ${i + 1}`));
        const card = p.node.querySelector('.card').cloneNode(true);
        item.append(card);
        list.append(item);
      });
      slide.append(list);
    }

    const actions = el('div', 'quiz__actions');
    const order = el(
      'a',
      'btn btn--primary btn--lg',
      picks.length ? t('quiz.order') : t('quiz.ask')
    );
    order.href = waLink(
      picks.length
        ? orderMessage(picks)
        : `Hello Yannick Scents, I couldn't find a match in the quiz (${summary}). Can you suggest something?`
    );
    order.target = '_blank';
    order.rel = 'noopener';
    const again = el('button', 'btn btn--outline btn--lg', t('quiz.again'));
    again.type = 'button';
    again.addEventListener('click', () => {
      Object.keys(answers).forEach((key) => delete answers[key]);
      go(0, -1);
    });
    actions.append(order, again);
    slide.append(actions, backButton());
    return { slide, focus: heading };
  }

  /** Draws the current step. `dir` is 1 going forward, -1 going back, 0 for no movement (language change). */
  function render(dir) {
    const old = panel.querySelector('.quiz__slide');
    const { slide, focus } = step < steps.length ? question() : result();
    const top = progress();
    const stage = el('div', 'quiz__stage');
    stage.append(slide);
    const calm = prefersReducedMotion() || dir === 0;

    if (!calm && old) {
      // the old slide fades out over the new one, which slides in: transform and opacity only
      const leaving = old.cloneNode(true);
      leaving.classList.add('is-leaving');
      leaving.setAttribute('aria-hidden', 'true');
      leaving.querySelectorAll('button, a').forEach((n) => (n.tabIndex = -1));
      stage.append(leaving);
      leaving
        .animate(
          [
            { opacity: 1, transform: 'translate3d(0, 0, 0)' },
            { opacity: 0, transform: `translate3d(${-24 * dir}px, 0, 0)` },
          ],
          { duration: SLIDE_MS * 0.7, easing: EASE, fill: 'forwards' }
        )
        .finished.then(
          () => leaving.remove(),
          () => leaving.remove()
        );
      slide.animate(
        [
          { opacity: 0, transform: `translate3d(${24 * dir}px, 0, 0)` },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        ],
        { duration: SLIDE_MS, easing: EASE }
      );
    }
    panel.replaceChildren(top, stage);
    if (focusNext && dir !== 0) focus.focus({ preventScroll: true });
  }

  function go(to, dir) {
    step = to;
    focusNext = true;
    render(dir);
  }
  function choose(id, option) {
    answers[id] = option;
    go(step + 1, 1);
  }

  render(0);
  // keep the panel's words in step with the language toggle
  new MutationObserver(() => render(0)).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang'],
  });
}
