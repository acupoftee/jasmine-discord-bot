const Rx = require('rx');

module.exports = {
  name: 'close',
  description: 'Close the current topic, or specify a topic to close.',
  scope: 'text',

  args: [
    {
      name: 'channelName',
      description: 'The name of the channel to close',
      required: false,
    },
  ],

  run(context, response) {
    let topicService = context.nix.getService('topics', 'TopicService');

    let topicChannel = null;
    let guild = context.guild;
    let channelName = context.args.channelName;

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

    if (channelName) {
      topicChannel =
        guild.channels
          .filter((channel) => channel.type === 'text')
          .find((channel) => channel.name.toLowerCase() === channelName.toLowerCase());
    }
    else {
      topicChannel = context.channel;
    }

    if (!topicChannel) {
      response.type = 'message';
      response.content =
        "My apologies, I was not able to find that topic.";
      return response.send();
    }

    if (!topicChannel.parent || topicChannel.parent.id !== openCategory.id) {
      response.type = 'message';
      response.content =
        `My apologies, I can not close ${topicChannel.toString()} as it is not in the open topics category.`;
      return response.send();
    }

    return Rx.Observable
      .fromPromise(topicChannel.setParent(closedCategory))
      .flatMap((topicChannel) => topicChannel.setPosition(0).then(() => topicChannel))
      .flatMap((topicChannel) => topicChannel.send('===== Closed =====').then(() => topicChannel))
      .flatMap((topicChannel) => {
        if (topicChannel.id !== context.channel.id) {
          response.type = 'reply';
          response.content = `I have closed the channel ${topicChannel.toString()}.`;
          return response.send();
        }
        return Rx.Observable.return();
      })
      .catch((error) => {
        response.type = 'message';

        if (error.name === 'DiscordAPIError') {
          if (error.message === "Missing Permissions") {
            response.content = `I'm sorry, but I do not have permission to move channels. I need the "Manage Channels" permission.`;
          }
          else {
            response.content = `I'm sorry, Discord returned an unexpected error when I tried to move the channel.`;
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
