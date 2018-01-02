const {BROADCAST_TYPES} = require('../utility');

module.exports = {
  name: 'enableBroadcast',
  description: `Set the channel that broadcasts should go to. Broadcast types are: ${Object.keys(BROADCAST_TYPES).join(', ')}`,
  inputs: [
    {
      name: 'type',
      required: true,
    },
    {
      name: 'channel',
      required: true,
    },
  ],

  run(context, response) {
    let guild = context.guild;
    let typeString = context.args.input1;
    let channelString = context.args.input2;

    let broadcastType = Object.keys(BROADCAST_TYPES).find((t) => t.toLowerCase() === typeString.toLowerCase());
    if (!broadcastType) {
      response.content = `${typeString} is not a valid broadcast type. Valid types: ${Object.keys(BROADCAST_TYPES).join(', ')}`;
      return response.send();
    }

    let channel = guild.channels.find((c) => c.toString() === channelString || c.id.toString() === channelString);
    if (!channel) {
      response.content = "I was not able to find that channel";
      return response.send();
    }

    let datakey = BROADCAST_TYPES[broadcastType];
    return context.nix.data
      .setGuildData(guild.id, datakey, channel.id)
      .flatMap(() => channel.send({content: `I will send ${broadcastType} broadcasts here.`}))
      .flatMap(() => response.send({content: `I have enabled ${broadcastType} broadcasts in the channel ${channel}`}))
      .catch((error) => {
        if (error.name === 'DiscordAPIError') {
          if (error.message === "Missing Access") {
            return response.send({content: `Whoops, I do not have permission to talk in that channel.`});
          }

          response.content = `Err... Discord returned an unexpected error when I tried to talk in that channel.`;
          context.nix.messageOwner(
            "I got this error when I tried to talk in a channel",
            {embed: context.nix.createErrorEmbed(context, error)}
          );

          return response.send();
        }

        return Rx.Observable.throw(error);
      });
  },
};
