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

  run(context) {
    let modLogService = context.nix.getService('modTools', 'ModLogService');

    let guild = context.guild;
    let logTypeName = context.inputs.type;

    let logType = modLogService.getLogType(logTypeName);
    if (!logType) {
      return {
        status: 400,
        content: `${logTypeName} is not a valid log type. Valid types: ${VALID_LOG_TYPES_NAMES.join(',')}`,
      };
    }

    return this.nix
      .setGuildData(guild.id, logType.channelDatakey, null)
      .map(() => ({
        status: 200,
        content: `I have disabled the ${logType.name}.`,
      }));
  },
};
