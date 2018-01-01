const Rx = require('rx');

const util = require('../../../lib/utilities');

const OPEN_TOPICS_CAT = '!topic';
const CLOSED_TOPICS_CAT = '!close';

module.exports = {
  name: 'rename',
  description: 'rename the current topic',
  scope: 'text',

  args: [
    {
      name: 'channelName',
      description: 'The new name of the channel to close',
      required: true,
    },
  ],

  run(context, response) {
    let topicChannel = context.channel;
    let newName = context.args.channelName;

    let openCategory = util.findCategory(context.guild, OPEN_TOPICS_CAT);
    if (!openCategory) {
      response.type = 'message';
      response.content =
        "My apologies, I was not able to find the open topics category.\n" +
        "Please let SpyMaster know about the issue";
      return response.send();
    }

    let closedCategory = util.findCategory(context.guild, CLOSED_TOPICS_CAT);
    if (!closedCategory) {
      response.type = 'message';
      response.content =
        "My apologies, I was not able to find the closed topics category.\n" +
        "Please let SpyMaster know about the issue";
      return response.send();
    }

    if (!topicChannel.parent || (topicChannel.parent.id !== openCategory.id && topicChannel.parent.id !== closedCategory.id)) {
      response.content =
        `My apologies, I can not rename ${topicChannel.toString()} as it is not in the open or closed topics categories.`;
      return response.send();
    }

    return Rx.Observable
      .fromPromise(topicChannel.setName(newName))
      .flatMap((topicChannel) => topicChannel.send('===== Renamed =====').then(() => topicChannel))
      .catch((error) => {
        response.type = 'message';

        if (error.name === 'DiscordAPIError') {
          if (error.message === "Missing Permissions") {
            response.content = `I'm sorry, but I do not have permission to rename channels. I need the "Manage Channels" permission.`;
          }
          else {
            response.content = `I'm sorry, Discord returned an unexpected error when I tried to rename the channel.`;
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
