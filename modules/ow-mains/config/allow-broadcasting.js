const {
  DATAKEYS,
  BROADCAST_TYPES,
  BROADCAST_TOKENS,
} = require('../utility');

module.exports = {
  name: 'allowBroadcasting',
  description: `Enable broadcasting from this server.`,

  services: {
    core: [
      'dataService',
    ],
  },

  inputs: [
    {
      name: 'type',
      required: true,
    },
    {
      name: 'token',
      required: true,
    },
  ],

  run(context) {
    let guild = context.guild;
    let typeString = context.args.input1;
    let token = context.args.input2;

    let broadcastType = Object.keys(BROADCAST_TYPES).find((t) => t.toLowerCase() === typeString.toLowerCase());
    if (!broadcastType) {
      return {
        content: `${typeString} is not a valid broadcast type. Valid types: ${Object.keys(BROADCAST_TYPES).join(', ')}`
      };
    }

    if (token !== BROADCAST_TOKENS[broadcastType]) {
      return {
        content: `I'm sorry, but that token is not valid for ${broadcastType} broadcasts`
      };
    }

    return this.dataService.getGuildData(guild.id, DATAKEYS.BROADCAST_TOKENS)
      .do((savedData) => savedData[broadcastType] = token)
      .flatMap((savedData) => this.dataService.setGuildData(guild.id, DATAKEYS.BROADCAST_TOKENS, savedData))
      .map(() => ({
        content: `This server is now allowed to send ${broadcastType} broadcasts.`
      }));
  },
};
