const {BROADCAST_TYPES} = require('../utility');

module.exports = {
  name: 'unsubBroadcast',
  description: `Unsubscribe from a type of broadcast. Broadcast types are: ${Object.keys(BROADCAST_TYPES).join(', ')}`,

  inputs: [
    {
      name: 'type',
      required: true,
    },
  ],

  run(context) {
    let guild = context.guild;
    let typeString = context.args.input1;

    let response = { content: null };

    let broadcastType = Object.keys(BROADCAST_TYPES).find((t) => t.toLowerCase() === typeString.toLowerCase());
    if (!broadcastType) {
      response.content = `${typeString} is not a valid broadcast type. Valid types: ${Object.keys(BROADCAST_TYPES).join(', ')}`;
      return response;
    }

    let datakey = BROADCAST_TYPES[broadcastType];
    return this.nix
      .setGuildData(guild.id, datakey, null)
      .map(() => {
        response.content = `I have disabled ${broadcastType} broadcasts`;
        return response
      });
  },
};
