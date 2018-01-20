const { LOG_TYPES } = require('../utility');

const VALID_LOG_TYPES_NAMES = LOG_TYPES.map((t) => t.name);

module.exports = {
  name: 'enableLog',
  description: 'Enable a log in a channel, such as the ModLog or the JoinLog',
  inputs: [
    {
      name: 'type',
      description: `the log type to add. Valid types: ${VALID_LOG_TYPES_NAMES.join(',')}`,
      required: true,
    },
    {
      name: 'channel',
      description: 'the channel to set the mod log to',
      required: true,
    },
  ],

  run(context, response) {
    let modLogService = context.nix.getService('modTools', 'ModLogService');

    let guild = context.guild;
    let logTypeName = context.args.input1;
    let channelString = context.args.input2;

    let channel = guild.channels.find((c) => c.toString() === channelString || c.id.toString() === channelString);
    if (!channel) {
      response.content = "I was not able to find that channel";
      return response.send();
    }

    let logType = modLogService.getLogType(logTypeName);
    if (!logType) {
      return response.send({
        content: `${logTypeName} is not a valid log type. Valid types: ${VALID_LOG_TYPES_NAMES.join(',')}`,
      });
    }

    return context.nix.dataService
      .setGuildData(guild.id, logType.channelDatakey, channel.id)
      .flatMap(() => channel.send(`I will post the ${logType.name} here now.`))
      .flatMap(() => response.send({content: `I have enabled the ${logType.name} in the channel ${channel}`}))
      .catch((error) => {
        if (error.name === 'DiscordAPIError') {
          if (error.message === "Missing Access") {
            return response.send({content: `Whoops, I do not have permission to talk in that channel.`});
          }

          response.content = `Err... Discord returned an unexpected error when I tried to talk in that channel.`;
          context.nix.messageOwner(
            "I got this error when I tried to post the mod log in a channel",
            {embed: context.nix.createErrorEmbed(context, error)}
          );

          return response.send();
        }

        return Rx.Observable.throw(error);
      });
  },
};
