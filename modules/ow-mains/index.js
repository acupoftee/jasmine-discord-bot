const {DATAKEYS} = require('./utility');

module.exports = {
  name: 'owMains',
  permissions: [
    'broadcaster',
  ],
  defaultData: [
    {
      keyword: DATAKEYS.BROADCAST_BLIZZARD,
      data: null,
    },
    {
      keyword: DATAKEYS.BROADCAST_NETWORK,
      data: null,
    },
  ],
  configActions: [
    require('./config/enable-broadcast'),
    require('./config/disable-broadcast'),
  ],
  commands: [
    require('./commands/broadcast'),
  ],
};
