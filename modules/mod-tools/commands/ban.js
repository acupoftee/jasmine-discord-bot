const Rx = require('rx');
const Discord = require('discord.js');

const {ERRORS} = require('../utility');

module.exports = {
  name: 'ban',
  description: 'Ban a user from the server',
  permissions: ['admin', 'mod'],
  flags: [
    {
      name: 'days',
      shortAlias: 'd',
      description: 'Number of days of messages to delete',
      default: 2,
      type: 'int',
    },
  ],
  args: [
    {
      name: 'user',
      description: 'The user to ban. Valid formats: User mention, User ID, or User Tag (case sensitive)',
      required: true,
    },
    {
      name: 'reason',
      description: 'The reason for the ban',
      required: false,
      greedy: true,
    },
  ],

  run(context, response) {
    let modLogService = context.nix.getService('modTools', 'ModLogService');
    let userService = context.nix.getService('core', 'UserService');
    let commandService = context.nix.getService('core', 'CommandService');

    let guild = context.guild;
    let userString = context.args.user;
    let reason = context.args.reason;
    let days = context.flags.days;

    return userService
      .findUser(userString)
      .map((member) => {
        if (!member) { throw new Error(ERRORS.USER_NOT_FOUND); }
        return member;
      })
      .flatMap((user) => guild.ban(user, {reason, days}).then(() => user))
      .flatMap((user) => {
        let prefix = commandService.getPrefix(context.guild.id);
        let unbanCmd = `${prefix}unban ${user.id}`;

        let modLogEmbed = new Discord.RichEmbed();
        modLogEmbed
          .setAuthor(`${user.tag} banned`, user.avatarURL())
          .setColor(Discord.Constants.Colors.DARK_RED)
          .setDescription(`User ID: ${user.id}`)
          .addField('Banned By', context.member)
          .addField('Reason', reason || '`none given`')
          .addField('Unban command', '```' + unbanCmd + '```')
          .setTimestamp();

        return modLogService.addAuditEntry(guild, modLogEmbed).map(user);
      })
      .flatMap((user) => {
        response.content = `${user.tag} has been banned`;
        return response.send();
      })
      .catch((error) => {
        if (error.name === 'DiscordAPIError') {
          switch (error.message) {
            case "Missing Permissions":
            case "Privilege is too low...":
              response.content =
                `Whoops, I do not have permission to unban users. Can you check if I have the ` +
                  `"Ban members" permission?`;
              break;
            default:
              response.content = `Err... Discord returned an unexpected error when I tried to ban that user.`;
              context.nix.messageOwner(
                "I got this error when I tried to ban a user:",
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
