const {
  DATAKEYS,
  NET_MOD_LOG_TOKEN,
} = require('../utility');

module.exports = {
  name: 'enableNetModLog',
  description: `Enable network mod log reporting to this server.`,
  inputs: [
    {
      name: 'token',
      required: true,
    },
    {
      name: 'channel',
      required: true,
    },
  ],

  run: (context, response) => {
    let dataService = context.nix.dataService;

    let guild = context.guild;
    let token = context.args.input1;
    let channelString = context.args.input2;

    if (token !== NET_MOD_LOG_TOKEN) {
      return response.send({content: `I'm sorry, but that token is not valid for the network mod log`});
    }

    let channel = guild.channels.find((c) => c.toString() === channelString || c.id.toString() === channelString);
    if (!channel) {
      response.content = "I was not able to find that channel";
      return response.send();
    }

    return dataService.setGuildData(guild.id, DATAKEYS.NET_MOD_LOG_TOKEN, token)
      .flatMap(() => dataService.setGuildData(guild.id, DATAKEYS.NET_MOD_LOG, channel.id))
      .flatMap(() => channel.send('I will post the network moderation log here now.'))
      .flatMap(() => response.send({content: `This server will now receive the network moderation log.`}))
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
