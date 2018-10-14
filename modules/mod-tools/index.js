const glob = require('glob');

module.exports = {
  name: 'modTools',
  permissions: ['mod'],
  defaultData: [
    {
      keyword: DATAKEYS.MOD_LOG_CHANNEL,
      data: null,
    },
    {
      keyword: DATAKEYS.JOIN_LOG_CHANNEL,
      data: null,
    },
    {
      keyword: DATAKEYS.AUTO_BAN_ENABLED,
      data: true,
    },
    {
      keyword: DATAKEYS.AUTO_BAN_USERNAME_HAS_LINK,
      data: true,
    }
  ],
  services: glob
    .sync(`${__dirname}/services/**/*.js`)
    .map((filename) => require(filename)),
  configActions: glob
    .sync(`${__dirname}/config/**/*.js`)
    .map((filename) => require(filename)),
  commands: glob
    .sync(`${__dirname}/commands/**/*.js`)
    .map((filename) => require(filename)),
};
