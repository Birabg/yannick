/** Bundles and minifies the front-end into public/dist (runs automatically before `npm start`). */
const path = require('node:path');
const esbuild = require('esbuild');

const pub = path.join(__dirname, '..', 'public');

esbuild
  .build({
    entryPoints: ['css/main.css', 'css/admin.css', 'js/main.js', 'js/admin.js', 'js/theme.js'].map(
      (file) => path.join(pub, file)
    ),
    outdir: path.join(pub, 'dist'),
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['es2020', 'chrome90', 'safari14'],
    // Fonts and images are served as static files, not bundled.
    external: ['/fonts/*', '/img/*'],
    logLevel: 'info',
  })
  .catch(() => process.exit(1));
