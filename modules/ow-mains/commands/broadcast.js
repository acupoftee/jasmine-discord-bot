const Rx = require('rx');
const Discord = require('discord.js');

const {BROADCAST_TYPES} = require('../utility');

module.exports = {
  name: 'broadcast',
  description: 'broadcast a message to all connected servers',
  permissions: ['broadcaster'],
  args: [
    {
      name: 'type',
      description: `the type of broadcast message. Types: ${Object.keys(BROADCAST_TYPES).join(', ')}`,
      required: true,
    },
    {
      name: 'message',
      description: 'the message to broadcast. @ everyone and @ here are currently not allowed.',
      required: true,
      greedy: true,
    },
  ],
  run(context, response) {
    let nix = context.nix;
    let broadcastType = context.args.type;
    let message = context.args.message + `\n*- ${context.member.displayName}*`;

    if (!BROADCAST_TYPES[broadcastType]) {
      return response.send({
        content: `Broadcast type ${type} is not valid. Valid types: ${Object.keys(BROADCAST_TYPES).join(', ')}`,
      });
    }

    if (message.indexOf('@everyone') !== -1) {
      return response.send({
        content: `Pinging @ everyone is currently not allowed. Please remove the ping from your message.`,
      });
    }

    if (message.indexOf('@here') !== -1) {
      return response.send({
        content: `Pinging @ here is currently not allowed. Please remove the ping from your message.`,
      });
    }

    let datakey = BROADCAST_TYPES[broadcastType];
    return Rx.Observable.from(nix.discord.guilds.values())
      .flatMap((guild) =>
        nix.data
          .getGuildData(guild.id, datakey)
          .filter((channel) => channel !== null)
          .map((channelId) => guild.channels.get(channelId))
      )
      .filter((channel) => channel.permissionsFor(nix.discord.user).has(Discord.Permissions.FLAGS.SEND_MESSAGES))
      .flatMap((channel) => channel.send(message))
      .toArray()
      .flatMap((sentMessages) => {
        return response.send({content: `Sent ${sentMessages.length} messages`});
      });
  },
};
