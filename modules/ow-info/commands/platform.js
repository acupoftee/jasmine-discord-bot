const Rx = require('rx');

const platforms = require('../data/platforms');

module.exports = {
  name: 'platform',
  description: 'Sets the platform that you most often play Overwatch on.',
  args: [
    {
      name: 'platform',
      description: 'The platform server/system you play on',
      required: true,
    },
  ],

  run(context, response) {
    if (context.channel.type !== 'text') {
      response.type = 'reply';
      response.content = 'You can only change your platform from a server.';
      return response.send();
    }

    let foundPlatform = findPlatformWithName(context.args.platform);
    if (!foundPlatform) {
      response.type = 'reply';
      response.content = 'I\'m sorry, but \'' + context.args.platform + '\' is not an available platform.';
      return response.send();
    }

    return setPlatformTag(context.member, foundPlatform)
      .map((platform) => {
        response.type = 'reply';
        response.content = 'I\'ve updated your platform to ' + platform.name;
        return response.send();
      })
      .catch((error) => {
        if (error.name === 'DiscordAPIError') {
          response.type = 'message';

          if (error.message === "Missing Permissions" || error.message === "Privilege is too low...") {
            response.content =
              `Whoops, I do not have permission to update your username. Ether I'm missing the "Manage Nicknames", ` +
              `or your permissions outrank mine.`;
            return response.send();
          }

          response.content = `Err... Discord returned an unexpected error when I tried to update your nickname.`;
          context.nix.messageOwner(
            "I got this error when I tried to update someone's platform:",
            {embed: this.createErrorEmbed(context, error)}
          );

          return response.send();
        }

        return Rx.Observable.throw(error);
      });
  },
};

function findPlatformWithName(name) {
  return platforms.find((platform) => platformHasName(platform, name));
}

function platformHasName(platform, name) {
  let platformNames = platform.alias
    .map((alias) => alias.toLowerCase());
  platformNames.push(platform.name.toLowerCase());

  return platformNames.indexOf(name.toLowerCase()) !== -1;
}

function setPlatformTag(member, newPlatform) {
  let currentNickname = member.nickname ? member.nickname : member.user.username;
  let newNickname;

  let platformTag = '[' + newPlatform.tag + ']';

  if (currentNickname.search(/\[\w+\]$/) !== -1) {
    newNickname = currentNickname.replace(/\[\w+\]$/, platformTag);
  } else {
    newNickname = currentNickname + ' ' + platformTag;
  }

  return Rx.Observable.fromPromise(member.setNickname(newNickname))
    .map(() => newPlatform);
}

