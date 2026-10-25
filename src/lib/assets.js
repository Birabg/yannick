const fs = require('node:fs');
const path = require('node:path');
const { root, isProd } = require('../env');

const folders = { css: 'css', js: 'js' };
const versions = new Map();

function version(file) {
  if (!versions.has(file)) {
    try {
      versions.set(file, Math.floor(fs.statSync(path.join(root, 'public', file)).mtimeMs));
    } catch {
      versions.set(file, 0);
    }
  }
  return versions.get(file);
}

/** URL of a front-end entry file: minified bundle in production, raw source in development. */
function asset(name) {
  const ext = path.extname(name).slice(1);
  const file = isProd ? `dist/${folders[ext]}/${name}` : `${folders[ext]}/${name}`;
  return `/${file}?v=${version(file)}`;
}

module.exports = { asset };
