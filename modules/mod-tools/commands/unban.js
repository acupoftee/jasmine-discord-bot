const Rx = require('rx');
const Discord = require('discord.js');

module.exports = {
  name: 'unban',
  description: 'unban a user from the server',
  permissions: ['admin', 'mod'],
  args: [
    {
      name: 'user',
      description: 'The user to unban, by mention or user id',
      required: true,
    },
  ],

  run(context, response) {
    let modLogService = context.nix.getService('modTools', 'ModLogService');

    let guild = context.guild;
    let userString = context.args.user;

    let member = guild.members.find((u) => u.toString() === userString);
    return Rx.Observable
      .if(
        () => member,
        Rx.Observable.return().map(() => member.user),
        Rx.Observable.return().flatMap(() => context.nix.discord.users.fetch(userString))
      )
      .flatMap((user) => modLogService.addUnbanEntry(guild, user, context.member).map(user))
      .flatMap((user) => guild.unban(user, `Unbanned by ${context.author.tag}`))
      .flatMap((user) => response.send({content: `${user.tag} has been unbanned`}))
      .catch((error) => {
        if (error.name === 'DiscordAPIError') {
          response.type = 'message';

          if (error.message === "Missing Permissions" || error.message === "Privilege is too low...") {
            response.content =
              `Whoops, I do not have permission to ban that user. Either I'm missing the "Ban members" permission, ` +
              `or their permissions outrank mine.`;
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
