const path = require('node:path');
const crypto = require('node:crypto');
require('dotenv').config({ quiet: true });

const root = path.join(__dirname, '..');
const isProd = process.env.NODE_ENV === 'production';

let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (isProd) throw new Error('SESSION_SECRET must be set in production (see .env.example).');
  sessionSecret = crypto.randomBytes(32).toString('hex');
  console.warn('SESSION_SECRET not set: using a temporary one (admin sessions reset on restart).');
}

const port = Number(process.env.PORT) || 3000;

module.exports = {
  root,
  isProd,
  port,
  sessionSecret,
  adminPassword: process.env.ADMIN_PASSWORD || '',
  siteUrl: (process.env.SITE_URL || `http://localhost:${port}`).replace(/\/+$/, ''),
  dataDir: path.resolve(root, process.env.DATA_DIR || 'data'),
  uploadsDir: path.resolve(root, process.env.UPLOADS_DIR || 'uploads'),
};
