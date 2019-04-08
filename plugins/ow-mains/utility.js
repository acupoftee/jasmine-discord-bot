const config = require('../../config.js');

const DATAKEYS = {
  BROADCAST: (type) => `owMains.broadcast.${type}`,
  BROADCAST_TOKENS: 'owMains.broadcast.tokens',
  NET_MOD_LOG: 'owMains.netModLog.channel',
  NET_MOD_LOG_TOKEN: 'owMains.netModLog.token',
};

const BROADCAST_TYPES = {
  'blizzard': DATAKEYS.BROADCAST('blizzard'),
  'network': DATAKEYS.BROADCAST('network'),
  'esports': DATAKEYS.BROADCAST('esports'),
};

const BROADCAST_TOKENS = config.broadcastTokens;

const NET_MOD_LOG_TOKEN = config.networkModLogToken;

const ERRORS = {
  TOKEN_INVALID: 'Token is invalid',
};

module.exports = {
  ERRORS,
  DATAKEYS,
  BROADCAST_TYPES,
  BROADCAST_TOKENS,
  NET_MOD_LOG_TOKEN,
};
