const { schedule } = require('../../config/site');

const DAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const minutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
/** "20:00" -> "8:00 PM" */
const clock = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

/** The weekday (0 = Sunday) and minutes since midnight right now in the shop's time zone. */
function nowInShop(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: schedule.timeZone,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type).value;
  return { dow: DAY[get('weekday')], minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

/** What the hours card shows: one row per weekday (Monday first) and whether the shop is open right now. */
function view(now = new Date()) {
  const at = nowInShop(now);
  const today = schedule.days[at.dow];
  const open = minutes(today.open) <= at.minutes && at.minutes < minutes(today.close);
  const rows = schedule.week.map((dow) => ({
    dow,
    open: schedule.days[dow].open,
    close: schedule.days[dow].close,
    time: `${clock(schedule.days[dow].open)} – ${clock(schedule.days[dow].close)}`,
  }));
  return { rows, today: at.dow, open, timeZone: schedule.timeZone };
}

module.exports = { view, nowInShop };
