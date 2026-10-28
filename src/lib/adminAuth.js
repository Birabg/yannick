const bcrypt = require('bcryptjs');
const { settings } = require('../db');
const { adminPassword, isProd } = require('../env');

const KEY = 'admin_hash';
const COST = 12;
const PLACEHOLDER = 'change-this-password';

/** On first run, hash ADMIN_PASSWORD from the environment and store it. Later runs ignore the env value. */
async function ensureAdminPassword() {
  if (await settings.fetch(KEY)) return;
  if (!adminPassword) {
    throw new Error('Set ADMIN_PASSWORD before the first run (see .env.example).');
  }
  if (isProd && (adminPassword === PLACEHOLDER || adminPassword.length < 8)) {
    throw new Error('Choose a real ADMIN_PASSWORD (8+ characters) before running in production.');
  }
  await settings.set(KEY, await bcrypt.hash(adminPassword, COST));
  console.log(
    'Admin password hashed and stored. You can now remove ADMIN_PASSWORD from the environment.'
  );
}

async function verifyPassword(plain) {
  const hash = await settings.fetch(KEY);
  return !!hash && bcrypt.compare(String(plain).slice(0, 200), hash);
}

const changePassword = async (plain) => settings.set(KEY, await bcrypt.hash(plain, COST));

module.exports = { ensureAdminPassword, verifyPassword, changePassword };
