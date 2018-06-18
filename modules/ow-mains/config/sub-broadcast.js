const Rx = require('rx');

const {BROADCAST_TYPES} = require('../utility');

module.exports = {
  name: 'subBroadcast',
  description: `Subscribe to a type of broadcast in a channel. Broadcast types are: ${Object.keys(BROADCAST_TYPES).join(', ')}`,

  services: {
    core: [
      'dataService',
    ]
  },

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
    return this.dataService
      .setGuildData(guild.id, datakey, channel.id)
      .flatMap(() => channel.send(`I will send ${broadcastType} broadcasts here.`))
      .flatMap(() => response.send({content: `I have enabled ${broadcastType} broadcasts in the channel ${channel}`}))
      .catch((error) => {
        switch (error.name) {
          case 'DiscordAPIError':
            if (error.message === "Missing Access") {
              return response.send({content: `Whoops, I do not have permission to talk in that channel.`});
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
