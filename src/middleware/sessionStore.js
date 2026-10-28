const session = require('express-session');
const { db, ready } = require('../db');

/** SQLite-backed session store (Turso in production), so admin logins survive restarts and new serverless instances. */
class SqliteStore extends session.Store {
  constructor() {
    super();
    // Expired rows are also ignored on read; this just keeps the table small. Harmless on short-lived instances.
    setInterval(
      () => db.run('DELETE FROM sessions WHERE expires <= ?', [Date.now()]).catch(() => {}),
      60 * 60 * 1000
    ).unref();
  }

  get(sid, cb) {
    ready()
      .then(() =>
        db.get('SELECT data FROM sessions WHERE sid = ? AND expires > ?', [sid, Date.now()])
      )
      .then((row) => cb(null, row ? JSON.parse(row.data) : null), cb);
  }

  set(sid, sess, cb) {
    const expires = sess.cookie?.expires
      ? new Date(sess.cookie.expires).getTime()
      : Date.now() + 24 * 60 * 60 * 1000;
    ready()
      .then(() =>
        db.run(
          'INSERT INTO sessions (sid, data, expires) VALUES (?, ?, ?) ON CONFLICT(sid) DO UPDATE SET data = excluded.data, expires = excluded.expires',
          [sid, JSON.stringify(sess), expires]
        )
      )
      .then(
        () => cb?.(null),
        (err) => cb?.(err)
      );
  }

  destroy(sid, cb) {
    ready()
      .then(() => db.run('DELETE FROM sessions WHERE sid = ?', [sid]))
      .then(
        () => cb?.(null),
        (err) => cb?.(err)
      );
  }
}

module.exports = SqliteStore;
