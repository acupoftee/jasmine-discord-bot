const Rx = require('rx');
const Discord = require('discord.js');

const {ERRORS} = require('../utility');

module.exports = {
  name: 'unban',
  description: 'unban a user from the server',
  permissions: ['admin', 'mod'],
  args: [
    {
      name: 'user',
      description: 'The user to unban. Valid formats: User mention, userId, or user tag (case sensitive)',
      required: true,
    },
  ],

  run(context, response) {
    let modLogService = context.nix.getService('modTools', 'ModLogService');
    let userService = context.nix.getService('core', 'UserService');

    let guild = context.guild;
    let userString = context.args.user;

    return userService
      .findUser(userString)
      .map((member) => {
        if (!member) { throw new Error(ERRORS.USER_NOT_FOUND); }
        return member;
      })
      .flatMap((user) => guild.unban(user, `Unbanned by ${context.author.tag}`))
      .flatMap((user) => modLogService.addUnbanEntry(guild, user, context.member.user).map(user))
      .flatMap((user) => response.send({content: `${user.tag} has been unbanned`}))
      .catch((error) => {
        if (error.name === 'DiscordAPIError') {
          switch (error.message) {
            case "Unknown Ban":
              response.content = `Looks like that user is not banned.`;
              break;
            case "Missing Permissions":
            case "Privilege is too low...":
              response.content =
                `Whoops, I do not have permission to unban users. Can you check if I have the ` +
                `"Ban members" permission?`;
              break;
            default:
              response.content = `Err... Discord returned an unexpected error when I tried to unban that user.`;
              context.nix.messageOwner(
                "I got this error when I tried to unban a user:",
                {embed: context.nix.createErrorEmbed(context, error)}
              );
          }

          return response.send();
        }

        switch (error.message) {
          case ERRORS.USER_NOT_FOUND:
            return response.send({
              content:
                `Sorry, but I wasn't able to find that user. I can only find users by User Tag if they are in ` +
                `another guild I'm on. If you know their User ID I can find them by that.`,
            });
          default:
            return Rx.Observable.throw(error);
        }
      });
  },
};
