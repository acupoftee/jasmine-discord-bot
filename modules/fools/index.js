const {DATAKEYS} = require('./utility');

module.exports = {
  name: 'fools',
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
