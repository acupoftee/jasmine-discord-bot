const Path = require('path');
const fs = require('fs');

const config = {
  ownerUserId: null,
  loginToken: null,

  logger: {
    level: "info",
  },

  dataSource: {
    type: 'disk',
    dataDir: Path.join(__dirname, '../data'),
  },

  broadcastTokens: {},
  networkModLogToken: null,
};

if (fs.existsSync(Path.join(__dirname, '../config.js'))) {
  const localConfig = require('../config.js');
  Object.assign(config, localConfig);
}

module.exports = config;
