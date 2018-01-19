const {DATAKEYS} = require('./utility');

module.exports = {
  name: 'owMains',
  permissions: [
    'broadcaster',
  ],
  defaultData: [
    { keyword: DATAKEYS.BROADCAST_BLIZZARD, data: null },
    { keyword: DATAKEYS.BROADCAST_NETWORK, data: null },
    { keyword: DATAKEYS.BROADCAST_TOKENS, data: {} },
  ],
  configActions: [
    require('./config/sub-broadcast'),
    require('./config/unsub-broadcast'),
    require('./config/enable-broadcast'),
  ],
  commands: [
    require('./commands/broadcast'),
  ],
};
