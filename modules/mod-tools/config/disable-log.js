const {LOG_TYPES} = require('../utility');

const VALID_LOG_TYPES_NAMES = LOG_TYPES.map((t) => t.name);

module.exports = {
  name: 'disableLog',
  description: 'disable a log, such as the ModLog or the JoinLog',
  inputs: [
    {
      name: 'type',
      description: `the log type to remove. Valid types: ${VALID_LOG_TYPES_NAMES.join(',')}`,
      required: true,
    },
  ],

  run(context, response) {
    let modLogService = context.nix.getService('modTools', 'ModLogService');

    let guild = context.guild;
    let logTypeName = context.args.input1;

    let logType = modLogService.getLogType(logTypeName);
    if (!logType) {
      return response.send({
        content: `${logTypeName} is not a valid log type. Valid types: ${VALID_LOG_TYPES_NAMES.join(',')}`,
      });
    }

    return context.nix.dataService
      .setGuildData(guild.id, logType.channelDatakey, null)
      .flatMap(() => response.send({content: `I have disabled the ${logType.name}.`}));
  },
};
