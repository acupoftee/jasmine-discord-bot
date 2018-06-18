const Rx = require('rx');

const {
  DATAKEYS,
  NET_MOD_LOG_TOKEN,
} = require('../utility');

module.exports = {
  name: 'enableNetModLog',
  description: `Enable network mod log reporting to this server.`,

  services: {
    core: [
      'dataService',
    ]
  },

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

  run(context) {
    let guild = context.guild;
    let token = context.args.input1;
    let channelString = context.args.input2;

    if (token !== NET_MOD_LOG_TOKEN) {
      return {
        content: `I'm sorry, but that token is not valid for the network mod log`
      };
    }

    let channel = guild.channels.find((c) => c.toString() === channelString || c.id.toString() === channelString);
    if (!channel) {
      return {
        content: "I was not able to find that channel"
      };
    }

    return this.dataService.setGuildData(guild.id, DATAKEYS.NET_MOD_LOG_TOKEN, token)
      .flatMap(() => this.dataService.setGuildData(guild.id, DATAKEYS.NET_MOD_LOG, channel.id))
      .flatMap(() => channel.send('I will post the network moderation log here now.'))
      .flatMap(() => ({
        content: `This server will now receive the network moderation log.`
      }))
      .catch((error) => {
        switch (error.name) {
          case 'DiscordAPIError':
            if (error.message === "Missing Permissions") {
              return {
                content: `Whoops, I do not have permission to talk in that channel.`
              };
            }
            else {
              return Rx.Observable.throw(error);
            }
          default:
            return Rx.Observable.throw(error);
        }
      });
  },
};
