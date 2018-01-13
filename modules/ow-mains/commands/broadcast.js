const Rx = require('rx');
const Discord = require('discord.js');

const {BROADCAST_TYPES, BROADCAST_TOKENS, DATAKEYS, ERRORS} = require('../utility');

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
    let guild = context.guild;
    let broadcastType = context.args.type;
    let message = context.args.message + `\n*- ${context.member.displayName}*`;

    if (!BROADCAST_TYPES[broadcastType]) {
      return response.send({
        content: `Broadcast type ${broadcastType} is not valid. Valid types: ${Object.keys(BROADCAST_TYPES).join(', ')}`,
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
    return nix.dataService
      .getGuildData(guild.id, DATAKEYS.BROADCAST_TOKENS)
      .map((allowedTokens) => {
        if (allowedTokens[broadcastType] !== BROADCAST_TOKENS[broadcastType]) { throw new Error(ERRORS.TOKEN_INVALID); }
        return true;
      })
      .flatMap(() => Rx.Observable.from(nix.discord.guilds.values()))
      .flatMap((guild) =>
        nix.dataService
          .getGuildData(guild.id, datakey)
          .filter((channel) => channel !== null)
          .map((channelId) => guild.channels.get(channelId))
      )
      .filter((channel) => channel.permissionsFor(nix.discord.user).has(Discord.Permissions.FLAGS.SEND_MESSAGES))
      .flatMap((channel) => channel.send(message))
      .toArray()
      .flatMap((sentMessages) => response.send({content: `Sent ${sentMessages.length} messages`}))
      .catch((error) => {
        switch (error.message) {
          case ERRORS.TOKEN_INVALID:
            return response.send({content: `I'm sorry, but sending ${broadcastType} broadcasts from this server is not allowed.`});
          default:
            return nix.handleError(context, error);
        }
      });
  },
};
