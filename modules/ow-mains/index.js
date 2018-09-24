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
    { keyword: DATAKEYS.NET_MOD_LOG, data: null },
    { keyword: DATAKEYS.NET_MOD_LOG_TOKEN, data: null },
  ],
  services: [
    require('./services/net-mod-log-service'),
    require('./services/broadcast-service'),
  ],
  configActions: [
    require('./config/sub-broadcast'),
    require('./config/unsub-broadcast'),
    require('./config/allow-broadcasting'),
    require('./config/enable-net-mod-log'),
  ],
  commands: [
    require('./commands/broadcast'),
  ],
};
