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

// The hero shader is a React island: its own bundle, loaded only on the home page and never in /admin.
esbuild
  .build({
    entryPoints: [path.join(pub, 'js/hero/island.tsx')],
    outdir: path.join(pub, 'dist/js/hero'),
    bundle: true,
    // one file: the package lazy-loads 200 effect modules, which would be 200 requests
    splitting: false,
    minify: true,
    format: 'esm',
    jsx: 'automatic',
    target: ['es2022', 'chrome113', 'safari26'],
    define: { 'process.env.NODE_ENV': '"production"' },
    legalComments: 'none',
    metafile: false,
    logLevel: 'info',
  })
  .catch(() => process.exit(1));
