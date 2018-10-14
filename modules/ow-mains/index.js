const glob = require('glob');

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
