const { port, siteUrl } = require('./env');
const createApp = require('./app');

// The database is created and the admin password stored on the first request (see `boot` in app.js),
// so this file only has to start listening.
createApp().listen(port, () => {
  console.log(`Yannick Scents running at ${siteUrl} (port ${port})`);
});
