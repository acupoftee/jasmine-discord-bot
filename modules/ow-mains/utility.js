const config = require('../../config.js');

const DATAKEYS = {
  BROADCAST_BLIZZARD: 'owMains.broadcast.blizzard',
  BROADCAST_NETWORK: 'owMains.broadcast.network',
  BROADCAST_TOKENS: 'owMains.broadcast.tokens',
};

const BROADCAST_TYPES = {
  'blizzard': DATAKEYS.BROADCAST_BLIZZARD,
  'network': DATAKEYS.BROADCAST_NETWORK,
};

const BROADCAST_TOKENS = config.broadcastTokens;

module.exports = {
  DATAKEYS,
  BROADCAST_TYPES,
  BROADCAST_TOKENS,
};
