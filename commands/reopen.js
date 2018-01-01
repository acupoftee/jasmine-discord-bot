const Rx = require('rx');

const util = require('./../lib/utilities');

const OPEN_TOPICS_CAT = '!topic';
const CLOSED_TOPICS_CAT = '!close';

module.exports = {
  name: 'reopen',
  description: 'reopen the current topic, or specify a topic to reopen.',
  scope: 'text',
  enabledByDefault: false,

  args: [
    {
      name: 'channelName',
      description: 'The name of the channel to reopen',
      required: false,
    },
  ],

  run(context, response) {
    let topicChannel = null;
    let channelName = context.args.channelName;

    let openCategory = util.findCategory(context.guild, OPEN_TOPICS_CAT);
    let closedCategory = util.findCategory(context.guild, CLOSED_TOPICS_CAT);

    if (!openCategory) {
      response.type = 'message';
      response.content =
        "My apologies, I was not able to find the open topics category.\n" +
        "Please let SpyMaster know about the issue";
      return response.send();
    }

    if (channelName) {
      topicChannel = util.getChannel(context.guild, channelName);
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

    if (!topicChannel.parent || topicChannel.parent.id !== closedCategory.id) {
      response.type = 'message';
      response.content =
        `My apologies, I can not move ${topicChannel.toString()} as it is not in the closed topics category.`;
      return response.send();
    }

    return Rx.Observable
      .fromPromise(topicChannel.setParent(openCategory))
      .flatMap((topicChannel) => topicChannel.setPosition(0))
      .flatMap((topicChannel) => topicChannel.send('===== Reopened =====').then(() => topicChannel))
      .flatMap((topicChannel) => {
        if (topicChannel.id !== context.channel.id) {
          response.type = 'reply';
          response.content = `I have reopened the channel ${topicChannel.toString()}.`;
          return response.send();
        }
        return Rx.Observable.return(topicChannel);
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
