/**
 * "Find my scent": three taps, then 1-3 bottles from the cards already on the page
 * and a one-tap WhatsApp message that lists them.
 */
const TOP_PICKS = 3;
const BUDGET_SLACK = 0.25; // how far outside the chosen range still counts as "close"

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function readProducts() {
  return [...document.querySelectorAll('[data-card]')].map((card) => ({
    slug: card.dataset.slug,
    label: card.dataset.label,
    name: card.dataset.name,
    brand: card.dataset.brand,
    priceText: card.dataset.priceText,
    price: Number(card.dataset.price),
    category: card.dataset.category,
    collections: card.dataset.collections.split(' '),
    fam: card.dataset.fam,
    inStock: card.dataset.instock === '1',
    order: Number(card.dataset.order),
    image: card.querySelector('.photo__img')?.currentSrc || card.querySelector('.photo__img')?.src,
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

function recommend(products, answers) {
  const attempts = [
    { useBudget: true, useVibe: true, note: '' },
    {
      useBudget: false,
      useVibe: true,
      note: 'Nothing in that budget, so these are the closest matches for the style.',
    },
    {
      useBudget: true,
      useVibe: false,
      note: 'No exact style match, so these fit who it is for and your budget.',
    },
    {
      useBudget: false,
      useVibe: false,
      note: 'No exact match, so these are what we have for who it is for.',
    },
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
  const { steps, whatsapp } = JSON.parse(dataNode.textContent);
  const products = readProducts();
  const panel = root.querySelector('[data-quiz-panel]');
  const answers = {};
  let step = 0;
  const waLink = (text) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;

  function progress(current) {
    const wrap = el('div', 'quiz__progress');
    const dots = el('span', 'quiz__dots');
    steps.forEach((_, i) =>
      dots.append(
        el('span', `quiz__dot${i < current ? ' is-done' : i === current ? ' is-now' : ''}`)
      )
    );
    wrap.append(dots, el('span', '', `${Math.min(current + 1, steps.length)} / ${steps.length}`));
    return wrap;
  }

  function renderQuestion() {
    const { id, question, options } = steps[step];
    const heading = el('h3', 'quiz__q', question);
    heading.tabIndex = -1;
    const list = el('div', `quiz__options quiz__options--${options.length}`);
    options.forEach((option) => {
      const button = el('button', 'quiz__opt');
      button.type = 'button';
      button.append(el('span', 'quiz__opt-label', option.label));
      if (option.sub) button.append(el('span', 'quiz__opt-sub', option.sub));
      button.addEventListener('click', () => {
        answers[id] = option;
        step += 1;
        render();
      });
      list.append(button);
    });
    panel.replaceChildren(progress(step), heading, list);
    if (step > 0) {
      const back = el('button', 'btn btn--paper btn--sm quiz__back', 'Back');
      back.type = 'button';
      back.addEventListener('click', () => {
        step -= 1;
        render();
      });
      panel.append(back);
    }
    return heading;
  }

  function orderMessage(picks) {
    if (picks.length === 1) {
      return `Hello Yannick Scents, I'd like to order ${picks[0].label} (${picks[0].priceText}).`;
    }
    const lines = picks.map((p, i) => `${i + 1}. ${p.label} (${p.priceText})`);
    return `Hello Yannick Scents, I took the Find My Scent quiz and these match me:\n${lines.join('\n')}\nCan you help me pick one and order?`;
  }

  function renderResult() {
    const { picks, note } = recommend(products, answers);
    const summary = `${answers.who.label} · ${answers.vibe.label} · ${answers.budget.label}`;
    const heading = el(
      'h3',
      'quiz__q',
      picks.length ? 'Our suggestions for you.' : 'No match. Ask Yannick directly.'
    );
    heading.tabIndex = -1;
    const wrap = el('div', 'quiz__result');
    wrap.append(el('p', 'quiz__note', summary));
    if (note) wrap.append(el('p', 'quiz__note', note));

    picks.forEach((p, i) => {
      const row = el('div', `quiz__pick fam--${p.fam}`);
      const photo = el('div', 'photo');
      if (p.image) {
        const img = el('img', 'photo__img');
        img.src = p.image;
        img.alt = '';
        img.width = 480;
        img.height = 600;
        photo.append(img);
      }
      const text = el('div', 'quiz__pick-body');
      text.append(el('span', 'quiz__pick-rank', `No. ${i + 1}`));
      text.append(el('p', 'quiz__pick-name', p.name));
      text.append(el('p', 'quiz__pick-meta', `${p.brand} · ${p.priceText}`));
      const link = el('a', 'btn btn--outline btn--sm quiz__pick-link', 'Details');
      link.href = `/perfume/${p.slug}`;
      link.setAttribute('data-open-product', '');
      text.append(link);
      row.append(photo, text);
      wrap.append(row);
    });

    const actions = el('div', 'quiz__actions');
    const order = el(
      'a',
      'btn btn--primary btn--lg',
      picks.length ? 'Order on WhatsApp' : 'Ask on WhatsApp'
    );
    order.href = waLink(
      picks.length
        ? orderMessage(picks)
        : `Hello Yannick Scents, I couldn't find a match in the quiz (${summary}). Can you suggest something?`
    );
    order.target = '_blank';
    order.rel = 'noopener';
    const again = el('button', 'btn btn--paper btn--lg', 'Start over');
    again.type = 'button';
    again.addEventListener('click', () => {
      step = 0;
      render();
    });
    actions.append(order, again);
    wrap.append(actions);
    panel.replaceChildren(progress(steps.length), heading, wrap);
    return heading;
  }

  function render() {
    const heading = step < steps.length ? renderQuestion() : renderResult();
    if (step > 0 || panel.dataset.started) heading.focus({ preventScroll: true });
    panel.dataset.started = 'true';
  }

  render();
}
