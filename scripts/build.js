/** Bundles and minifies the front-end into public/dist (runs automatically before `npm start`). */
const path = require('node:path');
const esbuild = require('esbuild');

const pub = path.join(__dirname, '..', 'public');

esbuild
  .build({
    entryPoints: [
      'css/main.css',
      'css/critical.css',
      'css/admin.css',
      'css/styleguide.css',
      'js/main.js',
      'js/admin.js',
    ].map((file) => path.join(pub, file)),
    outdir: path.join(pub, 'dist'),
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['es2022', 'chrome100', 'safari15.4'],
    // Fonts and images are served as static files, not bundled.
    external: ['/fonts/*', '/img/*'],
    logLevel: 'info',
  })
  .catch(() => process.exit(1));
