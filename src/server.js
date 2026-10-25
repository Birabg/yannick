const { port, siteUrl } = require('./env');
const createApp = require('./app');
const { ensureAdminPassword } = require('./lib/adminAuth');

ensureAdminPassword();

createApp().listen(port, () => {
  console.log(`Yannick Scents running at ${siteUrl} (port ${port})`);
});
