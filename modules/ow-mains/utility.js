const config = require('../../config/config.js');
const DATAKEYS = require('./datakeys');

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
  BROADCAST_TYPES,
  BROADCAST_TOKENS,
  NET_MOD_LOG_TOKEN,
};
