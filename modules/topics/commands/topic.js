const Rx = require('rx');

const util = require('../../../lib/utilities');

const OPEN_TOPICS_CAT = '!topic';

module.exports = {
  name: 'topic',
  description: 'Open a new discussion channel',
  scope: 'text',

  args: [
    {
      name: 'channelName',
      description: 'The name of the channel to open',
      required: true,
    },
  ],

  run(context, response) {
    let channelName = context.args.channelName;

    let openCategory = util.findCategory(context.guild, OPEN_TOPICS_CAT);
    if (!openCategory) {
      response.type = 'message';
      response.content =
        "My apologies, but I was not able to find the open topics category.\n" +
        "Please let SpyMaster know about the issue";
      return response.send();
    }

    return Rx.Observable
      .fromPromise(context.guild.createChannel(channelName, 'text', { parent: openCategory }))
      .flatMap((channel) => channel.setPosition(1))
      .flatMap((channel) => {
        response.type = 'reply';
        response.content = 'I have opened the channel ' + channel.toString() + '.';
        return response.send();
      })
      .catch((error) => {
        response.type = 'message';

        if (error.name === 'DiscordAPIError') {
          if (error.message === "Missing Permissions") {
            response.content = `I'm sorry, but I do not have permission to create channels. I need the "Manage Channels" permission.`;
          }
          else if (error.message.includes("Invalid Form Body")) {
            response.content = `I'm sorry, Discord does not allow that channel name.`;
          }
          else {
            response.content = `I'm sorry, Discord returned an unexpected error when I tried to create the channel.`;
            context.nix.handleError(context, error, false);
          }
        }
        else {
          response.content = `I'm sorry, I ran into an unexpected problem.`;
          context.nix.handleError(context, error, false);
        }

        return response.send();
      });
  },
};
