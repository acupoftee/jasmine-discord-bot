module.exports = {
  name: 'topics',
  enabledByDefault: false,
  commands: [
    require('./commands/topic'),
    require('./commands/rename'),
    require('./commands/close'),
    require('./commands/reopen'),
  ],
};
