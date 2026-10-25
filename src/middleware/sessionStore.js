const session = require('express-session');
const { db } = require('../db');

/** Minimal SQLite-backed session store, so admin logins survive restarts. */
class SqliteStore extends session.Store {
  constructor() {
    super();
    this.selectStmt = db.prepare('SELECT data FROM sessions WHERE sid = ? AND expires > ?');
    this.upsertStmt = db.prepare(
      'INSERT INTO sessions (sid, data, expires) VALUES (?, ?, ?) ON CONFLICT(sid) DO UPDATE SET data = excluded.data, expires = excluded.expires'
    );
    this.deleteStmt = db.prepare('DELETE FROM sessions WHERE sid = ?');
    this.sweepStmt = db.prepare('DELETE FROM sessions WHERE expires <= ?');
    setInterval(() => this.sweepStmt.run(Date.now()), 60 * 60 * 1000).unref();
  }

  get(sid, cb) {
    try {
      const row = this.selectStmt.get(sid, Date.now());
      cb(null, row ? JSON.parse(row.data) : null);
    } catch (err) {
      cb(err);
    }
  }

  set(sid, sess, cb) {
    try {
      const expires = sess.cookie?.expires
        ? new Date(sess.cookie.expires).getTime()
        : Date.now() + 24 * 60 * 60 * 1000;
      this.upsertStmt.run(sid, JSON.stringify(sess), expires);
      cb?.(null);
    } catch (err) {
      cb?.(err);
    }
  }

  destroy(sid, cb) {
    try {
      this.deleteStmt.run(sid);
      cb?.(null);
    } catch (err) {
      cb?.(err);
    }
  }
}

module.exports = SqliteStore;
