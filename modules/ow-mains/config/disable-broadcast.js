const {BROADCAST_TYPES} = require('../utility');

module.exports = {
  name: 'disableBroadcast',
  description: `Disable receiving broadcast for a broadcast type. Broadcast types are: ${Object.keys(BROADCAST_TYPES).join(', ')}`,
  inputs: [
    {
      name: 'type',
      required: true,
    },
  ],

  run(context, response) {
    let guild = context.guild;
    let typeString = context.args.input1;

    let broadcastType = Object.keys(BROADCAST_TYPES).find((t) => t.toLowerCase() === typeString.toLowerCase());
    if (!broadcastType) {
      response.content = `${typeString} is not a valid broadcast type. Valid types: ${Object.keys(BROADCAST_TYPES).join(', ')}`;
      return response.send();
    }

    let datakey = BROADCAST_TYPES[broadcastType];
    return context.nix.data
      .setGuildData(guild.id, datakey, null)
      .flatMap(() => response.send({content: `I have disabled ${broadcastType} broadcasts`}));
  },
};
