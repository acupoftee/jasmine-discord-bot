const Rx = require('rx');
const Discord = require('discord.js');

module.exports = {
  name: 'warn',
  description: 'Issue a warning to a user',
  permissions: ['admin', 'mod'],
  args: [
    {
      name: 'user',
      description: 'The user to warn. Valid formats: User mention, userId, or user tag (case sensitive)',
      required: true,
    },
    {
      name: 'reason',
      description: 'The reason for the warning',
      required: false,
      greedy: true,
    },
  ],

  run(context, response) {
    let modLogService = context.nix.getService('modTools', 'ModLogService');
    let userService = context.nix.getService('core', 'UserService');

    let guild = context.guild;
    let userString = context.args.user;
    let reason = context.args.reason;

    return userService
      .findUser(userString)
      .map((member) => {
        if (!member) { throw new Error(ERRORS.USER_NOT_FOUND); }
        return member;
      })
      .flatMap((user) => {
        let warningEmbed = new Discord.MessageEmbed();
        warningEmbed
          .setThumbnail(guild.iconURL())
          .setColor(Discord.Constants.Colors.DARK_GOLD)
          .setTitle('WARNING')
          .setDescription(reason || '')
          .addField('From Server', guild.name)
          .setTimestamp();

        return Rx.Observable
          .fromPromise(user.send({
            content: 'You have been issued a warning.',
            embed: warningEmbed,
          }))
          .map(() => user);
      })
      .flatMap((user) => {
        let modLogEmbed = new Discord.MessageEmbed();
        modLogEmbed
          .setAuthor(`${user.tag} warned`, user.avatarURL())
          .setColor(Discord.Constants.Colors.DARK_GOLD)
          .setDescription(`User ID: ${user.id}`)
          .addField('Warned By', context.member)
          .addField('Reason', reason || '`none given`')
          .setTimestamp();

        return modLogService.addAuditEntry(guild, modLogEmbed).map(user);
      })
      .flatMap((user) => {
        response.content = `${user.tag} has been warned`;
        return response.send();
      })
      .catch((error) => {
        switch (error.message) {
          case ERRORS.USER_NOT_FOUND:
            return response.send({content: `Sorry, but I wasn't able to find that user.`});
          default:
            return Rx.Observable.throw(error);
        }
      });
  },
};
