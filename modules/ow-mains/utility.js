const config = require('../../config/config.js');

const DATAKEYS = {
  BROADCAST_BLIZZARD: 'owMains.broadcast.blizzard',
  BROADCAST_NETWORK: 'owMains.broadcast.network',
  BROADCAST_TOKENS: 'owMains.broadcast.tokens',
  NET_MOD_LOG_TOKEN: 'owMains.netModLog.token',
};

const BROADCAST_TYPES = {
  'blizzard': DATAKEYS.BROADCAST_BLIZZARD,
  'network': DATAKEYS.BROADCAST_NETWORK,
};

const BROADCAST_TOKENS = config.broadcastTokens;

const ERRORS = {
  TOKEN_INVALID: 'Token is invalid',
};

module.exports = {
  ERRORS,
  DATAKEYS,
  BROADCAST_TYPES,
  BROADCAST_TOKENS,
};
