const {DATAKEYS} = require('./datakeys');

module.exports = {
  name: 'streaming',
  permissions: [
    'broadcaster',
  ],
  defaultData: [
    {keyword: DATAKEYS.WATCH_ROLE, data: null},
    {keyword: DATAKEYS.RESTRICT_GAMES, data: false},
    {keyword: DATAKEYS.ALLOWED_GAMES, data: null},
    {keyword: DATAKEYS.LIVE_ROLE, data: null},
  ],
  services: [
    require('./services/streaming-service'),
  ],
  configActions: [
  ],
  commands: [
  ],
};
