const crypto = require('node:crypto');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function matches(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/**
 * Synchronizer-token CSRF protection tied to the session.
 * The token is read from the x-csrf-token header, the _csrf query string
 * (needed for multipart forms, parsed after this runs) or the _csrf body field.
 */
function csrf(req, res, next) {
  req.session.csrf ||= crypto.randomBytes(32).toString('hex');
  res.locals.csrfToken = req.session.csrf;
  if (SAFE_METHODS.has(req.method)) return next();

  const sent = req.get('x-csrf-token') || req.query._csrf || req.body?._csrf;
  if (sent && matches(sent, req.session.csrf)) return next();
  const err = new Error('Invalid or missing security token. Reload the page and try again.');
  err.status = 403;
  return next(err);
}

module.exports = csrf;
