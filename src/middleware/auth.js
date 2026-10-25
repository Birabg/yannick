function requireAdmin(req, res, next) {
  if (req.session.admin) return next();
  const target = req.method === 'GET' ? req.originalUrl : '/admin';
  return res.redirect(`/admin/login?next=${encodeURIComponent(target)}`);
}

const ADMIN_PATH = /^\/admin(\/[\w\-/?=&.%]*)?$/;

/** Only allow redirects back into /admin (blocks open redirects). */
const safeNext = (value) => (ADMIN_PATH.test(String(value)) ? String(value) : '/admin');

module.exports = { requireAdmin, safeNext };
