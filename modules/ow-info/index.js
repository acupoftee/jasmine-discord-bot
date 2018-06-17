module.exports = {
  name: 'ow-info',
  enabledByDefault: false,
  commands: [
    require('./commands/platform'),
    require('./commands/region'),
  ],
};
