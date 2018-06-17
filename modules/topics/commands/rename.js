const Rx = require('rx');

module.exports = {
  name: 'rename',
  description: 'rename the current topic',
  scope: 'text',

  services: {
    topics: [
      'TopicService',
    ]
  },

  args: [
    {
      name: 'channelName',
      description: 'The new name of the channel to close',
      required: true,
      greedy: true,
    },
  ],

  run(context, response) {
    let topicService = context.nix.getService('topics', 'TopicService');

    let topicChannel = context.channel;
    let guild = context.guild;
    let channelName = this.TopicService.channelNameSafeString(context.args.channelName);

    context.nix.logger.debug(`renaming channel: ${topicChannel.name} => ${channelName}`);

    let openCategory = topicService.getOpenTopicsCategory(guild);
    if (!openCategory) {
      response.type = 'message';
      response.content =
        "My apologies, I was not able to find the open topics category.";
      return response.send();
    }

    let closedCategory = topicService.getClosedTopicsCategory(guild);
    if (!closedCategory) {
      response.type = 'message';
      response.content =
        "My apologies, I was not able to find the closed topics category.";
      return response.send();
    }

    if (!topicChannel.parent || (topicChannel.parent.id !== openCategory.id && topicChannel.parent.id !== closedCategory.id)) {
      response.content =
        `My apologies, I can not rename ${topicChannel.toString()} as it is not in the open or closed topics categories.`;
      return response.send();
    }

    return Rx.Observable
      .fromPromise(topicChannel.setName(channelName))
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
