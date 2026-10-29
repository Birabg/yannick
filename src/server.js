const { port, siteUrl } = require('./env');
const createApp = require('./app');
const { ensureAdminPassword } = require('./lib/adminAuth');

ensureAdminPassword();
require('./lib/backdrop').warmAll();

createApp().listen(port, () => {
  console.log(`Yannick Scents running at ${siteUrl} (port ${port})`);
});
