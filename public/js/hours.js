const DAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const minutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Keeps the hours card true: highlights today's row and shows "Open now" or "Closed" for the
 * shop's own time zone (Africa/Addis_Ababa, from data-tz), whatever the visitor's clock says.
 * The server renders the same state, so the first update changes nothing; it then re-checks every minute.
 */
export function initHours() {
  const card = document.querySelector('[data-hours]');
  if (!card) return;
  const zone = new Intl.DateTimeFormat('en-US', {
    timeZone: card.dataset.tz,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  });
  const rows = [...card.querySelectorAll('tr[data-dow]')];
  const badge = card.querySelector('[data-hours-badge]');

  function update() {
    const parts = zone.formatToParts(new Date());
    const get = (type) => parts.find((p) => p.type === type).value;
    const dow = DAY[get('weekday')];
    const now = Number(get('hour')) * 60 + Number(get('minute'));
    let open = false;
    rows.forEach((row) => {
      const today = Number(row.dataset.dow) === dow;
      row.classList.toggle('is-today', today);
      if (today) row.setAttribute('aria-current', 'date');
      else row.removeAttribute('aria-current');
      row.querySelector('.hd__today').hidden = !today;
      if (today) open = minutes(row.dataset.open) <= now && now < minutes(row.dataset.close);
    });
    badge.classList.toggle('is-open', open);
    badge.querySelector('[data-state="open"]').hidden = !open;
    badge.querySelector('[data-state="closed"]').hidden = open;
  }
  update();
  setInterval(update, 60000);
}
