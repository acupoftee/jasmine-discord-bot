const Path = require('path');

const privateConfig = require('./private.js');

module.exports = {
  ownerUserId: privateConfig.ownerUserId,
  loginToken: privateConfig.loginToken,

  logger: {
    level: 'silly',
  },

  dataSource: {
    type: 'disk',
    dataDir: Path.join(__dirname, '../data'),
  },

  broadcastTokens: privateConfig.broadcastTokens,
  networkModLogToken: privateConfig.networkModLogToken,

  owmnServerId: privateConfig.owmnServerId,
};
