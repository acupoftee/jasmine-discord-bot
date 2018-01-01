const {DATAKEYS} = require('./utility');

module.exports = {
  name: 'owMains',
  permissions: [
    'broadcast',
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
  ],
  commands: [
  ],
};
