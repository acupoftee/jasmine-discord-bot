const {DATAKEYS} = require('./utility');

module.exports = {
  name: 'fools',
  enabledByDefault: false,
  permissions: ['admin'],
  defaultData: [
    {
      keyword: DATAKEYS.PREV_NAMES,
      data: {},
    },
  ],
  commands: [
    require('./commands/fools'),
  ],
};
