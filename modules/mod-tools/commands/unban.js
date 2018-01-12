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
      .flatMap((user) => guild.members.unban(user))
      .flatMap((user) => {
        let modLogEmbed = new Discord.MessageEmbed();
        modLogEmbed
          .setAuthor(`${user.tag} unbanned`, user.avatarURL())
          .setColor(Discord.Constants.Colors.DARK_GREEN)
          .setDescription(`User ID: ${user.id}`)
          .addField('Unbanned By', context.member)
          .setTimestamp();

        return modLogService.addAuditEntry(guild, modLogEmbed).map(user);
      })
      .flatMap((user) => response.send({content: `${user.tag} has been unbanned`}))
      .catch((error) => {
        if (error.name === 'DiscordAPIError') {
          response.type = 'message';

          if (error.message === "Missing Permissions" || error.message === "Privilege is too low...") {
            response.content =
              `Whoops, I do not have permission to unban users. Can you check if I have the "Ban members" permission?`;
            return response.send();
          }

          response.content = `Err... Discord returned an unexpected error when I tried to ban that user.`;
          context.nix.messageOwner(
            "I got this error when I tried to ban a user:",
            {embed: context.nix.createErrorEmbed(context, error)}
          );

          return response.send();
        }

        return Rx.Observable.throw(error);
      });
  },
};
