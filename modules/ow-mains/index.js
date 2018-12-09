const DATAKEYS = require('./datakeys');

module.exports = {
  name: 'owMains',
  permissions: [
    'broadcaster',
  ],
  defaultData: [
    { keyword: DATAKEYS.BROADCAST('blizzard'), data: null },
    { keyword: DATAKEYS.BROADCAST('network'), data: null },
    { keyword: DATAKEYS.BROADCAST('esports'), data: null },
    { keyword: DATAKEYS.BROADCAST_TOKENS, data: {} },
    { keyword: DATAKEYS.NET_MOD_LOG, data: null },
    { keyword: DATAKEYS.NET_MOD_LOG_TOKEN, data: null },
  ],
  services: [
    require('./services/net-mod-log-service'),
    require('./services/broadcast-service'),
    require('./services/server-list-service'),
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
