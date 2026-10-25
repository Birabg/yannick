const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const { sessionSecret, isProd } = require('../env');
const { toProduct, products, reviews } = require('../db');
const SqliteStore = require('../middleware/sessionStore');
const csrf = require('../middleware/csrf');
const { requireAdmin, safeNext } = require('../middleware/auth');
const { singleImage } = require('../middleware/upload');
const { verifyPassword, changePassword } = require('../lib/adminAuth');
const { parseProduct, parseReview, parsePasswordChange } = require('../lib/validate');
const { slugify, slugSource } = require('../lib/format');
const {
  saveProductImage,
  saveReviewImage,
  removeProductImage,
  removeReviewImage,
  listProductFiles,
} = require('../lib/images');
const { heroProducts } = require('../lib/hero');
const { SLOTS, siteImage, isCustom, saveSiteImage, removeSiteImage } = require('../lib/siteImages');

const {
  getStory,
  saveStoryCopy,
  saveStoryPhoto,
  removeStoryPhoto,
  saveFocus,
} = require('../lib/story');

const router = express.Router();
const intId = (req) => Number.parseInt(req.params.id, 10);
const wantsJson = (req) => req.get('accept')?.includes('application/json');

router.use(
  session({
    name: 'ys.sid',
    secret: sessionSecret,
    store: new SqliteStore(),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/admin',
      maxAge: 8 * 60 * 60 * 1000,
    },
  })
);
router.use(express.urlencoded({ extended: false, limit: '50kb' }));
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.locals.seo = { title: 'Admin', noindex: true };
  res.locals.active = '';
  res.locals.query = req.query;
  next();
});
router.use(csrf);

/* ---------- Auth ---------- */

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).render('admin/login', {
      error: 'Too many attempts. Please wait 15 minutes and try again.',
      next: '/admin',
    }),
});

router.get('/login', (req, res) => {
  if (req.session.admin) return res.redirect('/admin');
  return res.render('admin/login', { error: '', next: safeNext(req.query.next) });
});

router.post('/login', loginLimiter, async (req, res, next) => {
  if (!(await verifyPassword(req.body.password ?? ''))) {
    return res.status(401).render('admin/login', {
      error: 'Incorrect password.',
      next: safeNext(req.body.next),
    });
  }
  const target = safeNext(req.body.next);
  return req.session.regenerate((err) => {
    if (err) return next(err);
    req.session.admin = true;
    return req.session.save((saveErr) => (saveErr ? next(saveErr) : res.redirect(target)));
  });
});

router.post('/logout', (req, res, next) =>
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('ys.sid', { path: '/admin' });
    return res.redirect('/admin/login');
  })
);

router.use(requireAdmin);

/* ---------- Products ---------- */

router.get('/', (req, res) => {
  const list = products.list();
  res.render('admin/dashboard', {
    products: list,
    hasSamples: list.some((p) => p.isSample),
    active: 'products',
  });
});

const renderProductForm = (res, { p, errors = [], fields = {}, status = 200, isNew }) =>
  res.status(status).render('admin/product-form', { p, errors, fields, isNew, active: 'products' });

const blankProduct = () =>
  toProduct({
    id: 0,
    slug: '',
    name: '',
    brand: '',
    price: 0,
    size: '',
    concentration: 'Eau de Parfum',
    category: 'men',
    collections: '[]',
    family: '',
    longevity: 3,
    projection: 3,
    description: '',
    top_notes: '',
    heart_notes: '',
    base_notes: '',
    badges: '',
    image: '',
    in_stock: 1,
    is_sample: 0,
    sort_order: 0,
    updated_at: '',
  });

/** Rebuild a product-shaped object from submitted values so the form can be redisplayed. */
const productFromForm = (value, existing) =>
  toProduct({
    ...value,
    id: existing?.id ?? 0,
    slug: existing?.slug ?? '',
    image: existing?.image ?? '',
    sort_order: 0,
    updated_at: '',
  });

/** Columns that describe a saved photo (empty when there is none). */
const photoFields = (shot) =>
  shot
    ? {
        image: shot.base,
        img_w: shot.width,
        img_h: shot.height,
        cut_w: shot.cutW,
        cut_h: shot.cutH,
      }
    : { image: '' };
const keepPhoto = (p) => ({
  image: p.image,
  img_w: p.imageW,
  img_h: p.imageH,
  cut_w: p.cutW,
  cut_h: p.cutH,
});

function uniqueSlug(base, exceptId = 0) {
  const root = slugify(base) || 'perfume';
  let slug = root;
  for (let n = 2; products.slugExists(slug, exceptId); n += 1) slug = `${root}-${n}`;
  return slug;
}

router.get('/products/new', (req, res) =>
  renderProductForm(res, { p: blankProduct(), isNew: true })
);

router.post('/products', singleImage('photo'), async (req, res) => {
  const { value, errors, fields } = parseProduct(req.body);
  if (req.uploadError) errors.push(req.uploadError);
  if (errors.length) {
    return renderProductForm(res, {
      p: productFromForm(value),
      errors,
      fields,
      status: 422,
      isNew: true,
    });
  }
  const shot = req.file ? await saveProductImage(req.file.buffer) : null;
  const slug = uniqueSlug(slugSource(value));
  const id = products.create({
    ...value,
    description_status: 'approved',
    slug,
    ...photoFields(shot),
  });
  return res.redirect(`/admin?saved=${id}`);
});

/** Editing any of the copy saves it as the approved version; otherwise the Approved box decides. */
function descriptionStatus(existing, value, body) {
  const edited =
    value.description !== existing.description ||
    value.description_am !== existing.descriptionAm ||
    value.tagline_en !== existing.tagline ||
    value.tagline_am !== existing.taglineAm ||
    value.meta_description !== existing.metaDescription;
  return edited || body.description_approved === 'on' ? 'approved' : 'draft';
}

router.get('/products/:id/edit', (req, res, next) => {
  const p = products.get(intId(req));
  if (!p) return next();
  return renderProductForm(res, { p, isNew: false });
});

router.post('/products/:id', singleImage('photo'), async (req, res, next) => {
  const existing = products.get(intId(req));
  if (!existing) return next();
  const { value, errors, fields } = parseProduct(req.body);
  if (req.uploadError) errors.push(req.uploadError);
  if (errors.length) {
    return renderProductForm(res, {
      p: productFromForm(value, existing),
      errors,
      fields,
      status: 422,
      isNew: false,
    });
  }
  const shot = req.file ? await saveProductImage(req.file.buffer) : null;
  products.update(existing.id, {
    ...value,
    description_status: descriptionStatus(existing, value, req.body),
    slug: existing.slug,
    ...(shot ? photoFields(shot) : keepPhoto(existing)),
  });
  if (req.file) await removeProductImage(existing.image);
  return res.redirect(`/admin?saved=${existing.id}`);
});

router.post('/products/:id/delete', async (req, res, next) => {
  const p = products.get(intId(req));
  if (!p) return next();
  products.remove(p.id);
  await removeProductImage(p.image);
  return res.redirect('/admin?deleted=1');
});

router.post('/products/:id/stock', (req, res, next) => {
  const p = products.get(intId(req));
  if (!p) return next();
  products.setStock(p.id, !p.inStock);
  if (wantsJson(req)) return res.json({ ok: true, inStock: !p.inStock });
  return res.redirect(`/admin#p-${p.id}`);
});

router.post('/products/:id/feature', (req, res, next) => {
  const p = products.get(intId(req));
  if (!p) return next();
  const badges = p.badges.includes('featured')
    ? p.badges.filter((b) => b !== 'featured')
    : [...p.badges, 'featured'];
  products.setBadges(p.id, badges);
  if (wantsJson(req)) return res.json({ ok: true, featured: badges.includes('featured') });
  return res.redirect(`/admin#p-${p.id}`);
});

router.post('/products/:id/move', (req, res, next) => {
  const p = products.get(intId(req));
  if (!p) return next();
  products.move(p.id, req.body.dir === 'up' ? -1 : 1);
  return res.redirect(`/admin#p-${p.id}`);
});

/* ---------- Image library ---------- */

const formatBytes = (n) =>
  n >= 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`;

router.get('/images', async (req, res) => {
  const list = products.list();
  const onDisk = await listProductFiles();
  const hero = heroProducts(list).map((p) => p.id);
  const used = new Set(list.map((p) => p.image).filter(Boolean));
  const items = list.map((p) => {
    const disk = onDisk.get(p.image);
    const usage = [];
    if (p.image) {
      usage.push('Collection card', 'Product page');
      const n = hero.indexOf(p.id);
      if (n >= 0) usage.push(`Hero card ${n + 1}`);
      if (hero[0] === p.id) usage.push('Order section');
    }
    return {
      p,
      usage,
      missing: !!p.image && !disk,
      size: disk ? formatBytes(disk.bytes) : '',
      widths: disk ? disk.widths : [],
    };
  });
  const orphans = [...onDisk.entries()]
    .filter(([base]) => !used.has(base))
    .map(([base, d]) => ({ base, size: formatBytes(d.bytes), widths: d.widths }));
  const slots = Object.entries(SLOTS).map(([key, def]) => ({
    key,
    ...def,
    url: siteImage(key),
    custom: isCustom(key),
  }));
  res.render('admin/images', { items, orphans, slots, active: 'images' });
});

router.post('/images/product/:id', singleImage('photo'), async (req, res, next) => {
  const p = products.get(intId(req));
  if (!p) return next();
  if (req.uploadError || !req.file) {
    return res.redirect(
      `/admin/images?error=${encodeURIComponent(req.uploadError || 'Choose a photo first.')}`
    );
  }
  const shot = await saveProductImage(req.file.buffer);
  products.setPhoto(p.id, photoFields(shot));
  await removeProductImage(p.image);
  return res.redirect('/admin/images?saved=1');
});

router.post('/images/orphan', async (req, res) => {
  const base = String(req.body.base || '');
  const inUse = products.list().some((p) => p.image === base);
  if (base && !inUse) await removeProductImage(base);
  return res.redirect('/admin/images?deleted=1');
});

router.post('/images/site/:slot', singleImage('photo'), async (req, res, next) => {
  if (!SLOTS[req.params.slot]) return next();
  if (req.uploadError || !req.file) {
    return res.redirect(
      `/admin/images?error=${encodeURIComponent(req.uploadError || 'Choose a photo first.')}`
    );
  }
  await saveSiteImage(req.params.slot, req.file.buffer);
  return res.redirect('/admin/images?saved=1');
});

router.post('/images/site/:slot/reset', async (req, res, next) => {
  if (!SLOTS[req.params.slot]) return next();
  await removeSiteImage(req.params.slot);
  return res.redirect('/admin/images?deleted=1');
});

/* ---------- Our Story ---------- */

const clip = (v, max) =>
  String(v ?? '')
    .trim()
    .slice(0, max);
const pct = (v, fallback) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : fallback;
};

router.get('/story', (req, res) => {
  res.render('admin/story', { story: getStory(), active: 'story' });
});

router.post('/story', singleImage('photo'), async (req, res) => {
  if (req.uploadError) {
    return res.redirect(`/admin/story?error=${encodeURIComponent(req.uploadError)}`);
  }
  const b = req.body;
  const list = (key, count, max) =>
    Array.from({ length: count }, (_, n) => clip(b[`${key}${n}`], max));
  saveStoryCopy({
    eyebrow: clip(b.eyebrow, 40),
    heading: clip(b.heading, 120),
    paragraphs: list('paragraph', 3, 700),
    stats: [0, 1, 2].map((n) => ({
      value: clip(b[`stat_value${n}`], 24),
      label: clip(b[`stat_label${n}`], 40),
      valueAm: clip(b[`stat_value_am${n}`], 24),
      labelAm: clip(b[`stat_label_am${n}`], 40),
    })),
    caption: clip(b.caption, 60),
    alt: clip(b.alt, 160),
    eyebrowAm: clip(b.eyebrow_am, 40),
    headingAm: clip(b.heading_am, 120),
    paragraphsAm: list('paragraph_am', 3, 900),
    captionAm: clip(b.caption_am, 60),
  });
  const now = getStory().focus;
  saveFocus(pct(b.focus_x, now.x), pct(b.focus_y, now.y));
  if (req.file) await saveStoryPhoto(req.file.buffer);
  else if (b.remove_photo) await removeStoryPhoto();
  return res.redirect('/admin/story?saved=1');
});

/* ---------- Reviews ---------- */

const blankReview = () => ({
  id: 0,
  name: '',
  text: '',
  rating: 5,
  image: '',
  image_w: 0,
  image_h: 0,
});

const renderReviewForm = (res, { r, errors = [], fields = {}, status = 200, isNew }) =>
  res.status(status).render('admin/review-form', { r, errors, fields, isNew, active: 'reviews' });

router.get('/reviews', (req, res) =>
  res.render('admin/reviews', { reviews: reviews.list(), active: 'reviews' })
);

router.get('/reviews/new', (req, res) => renderReviewForm(res, { r: blankReview(), isNew: true }));

router.post('/reviews', singleImage('screenshot'), async (req, res) => {
  const { value, errors, fields } = parseReview(req.body);
  if (req.uploadError) errors.push(req.uploadError);
  if (errors.length) {
    return renderReviewForm(res, {
      r: { ...blankReview(), ...value },
      errors,
      fields,
      status: 422,
      isNew: true,
    });
  }
  const shot = req.file ? await saveReviewImage(req.file.buffer) : null;
  reviews.create({
    ...value,
    image: shot?.name ?? '',
    image_w: shot?.width ?? 0,
    image_h: shot?.height ?? 0,
  });
  return res.redirect('/admin/reviews?saved=1');
});

router.get('/reviews/:id/edit', (req, res, next) => {
  const r = reviews.get(intId(req));
  if (!r) return next();
  return renderReviewForm(res, { r, isNew: false });
});

router.post('/reviews/:id', singleImage('screenshot'), async (req, res, next) => {
  const existing = reviews.get(intId(req));
  if (!existing) return next();
  const { value, errors, fields } = parseReview(req.body);
  if (req.uploadError) errors.push(req.uploadError);
  if (errors.length) {
    return renderReviewForm(res, {
      r: { ...existing, ...value },
      errors,
      fields,
      status: 422,
      isNew: false,
    });
  }
  const removeShot = req.body.remove_image === 'on';
  const shot = req.file ? await saveReviewImage(req.file.buffer) : null;
  const keep = !shot && !removeShot;
  reviews.update(existing.id, {
    ...value,
    image: shot?.name ?? (keep ? existing.image : ''),
    image_w: shot?.width ?? (keep ? existing.image_w : 0),
    image_h: shot?.height ?? (keep ? existing.image_h : 0),
  });
  if (!keep) await removeReviewImage(existing.image);
  return res.redirect('/admin/reviews?saved=1');
});

router.post('/reviews/:id/delete', async (req, res, next) => {
  const r = reviews.get(intId(req));
  if (!r) return next();
  reviews.remove(r.id);
  await removeReviewImage(r.image);
  return res.redirect('/admin/reviews?deleted=1');
});

/* ---------- Password ---------- */

router.get('/password', (req, res) =>
  res.render('admin/password', { errors: [], done: false, active: 'password' })
);

router.post('/password', async (req, res) => {
  const errors = parsePasswordChange(req.body);
  if (!errors.length && !(await verifyPassword(req.body.current))) {
    errors.push('Your current password is incorrect.');
  }
  if (errors.length) {
    return res.status(422).render('admin/password', { errors, done: false, active: 'password' });
  }
  await changePassword(req.body.next);
  return res.render('admin/password', { errors: [], done: true, active: 'password' });
});

module.exports = router;
