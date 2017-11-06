const Rx = require('rx');

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
    {
      name: 'message',
      description: 'An opening message to explain the topic of the discussion',
      required: false,
    },
  ],

  run(context, response) {
    let channelName = context.args.channelName;

    let openCategory = getCategory(context.guild, OPEN_TOPICS_CAT);
    if (!openCategory) {
      response.type = 'message';
      response.content =
        "My apologies, but I was not able to find the Open Discussions category.\n" +
        "Please let SpyMaster know about the issue";
      return response.send();
    }

    return Rx.Observable
      .fromPromise(context.guild.createChannel(channelName, 'text', { parent: openCategory }))
      .flatMap((channel) => channel.setPosition(0))
      .flatMap((channel) => {
        response.type = 'reply';
        response.content = 'I have opened the channel ' + channel.toString() + '.';
        return response.send();
      })
      .catch((error) => {
        if (error.name === 'DiscordAPIError') {
          if (error.message === "Missing Permissions") {
            response.type = 'message';
            response.content = '' +
              'I\'m sorry, but I do not have permission to create channels. I need the "Manage Channels" permission.';
          }
          else {
            response.type = 'message';
            response.content =
              'I\'m sorry, but Discord returned an unexpected error when I tried to create the channel.';
          }
        }
        else {
          response.type = 'message';
          response.content = '' +
            'I\'m sorry, but an unexpected problem occurred.';
        }

        return response.send();
      });
  },
};

function getCategory(guild, name) {
  return guild.channels
    .filter((c) => c.type === 'category')
    .find((c) => c.name.toLowerCase().includes(name.toLowerCase()));
}
