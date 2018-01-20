module.exports = {
  name: 'topics',
  enabledByDefault: false,
  services: [
    require('./services/topic-service'),
  ],
  commands: [
    require('./commands/topic'),
    require('./commands/rename'),
    require('./commands/close'),
    require('./commands/reopen'),
  ],
};
