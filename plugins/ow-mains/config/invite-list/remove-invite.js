const Rx = require('rx');

const {
  InviteListError,
} = require('../../errors');

module.exports = {
  name: 'removeInvite',
  description: `Remove an invite from the list of OWMN servers`,

  inputs: [
    {
      name: 'guildName',
      description: 'The name of the server to remove the invite for',
      required: true,
    },
  ],

  run(context) {
    let inviteListService = context.nix.getService('owMains', 'inviteListService');

    let guildName = context.args.input1;
    let guildCategory = context.args.input2;
    let invite = context.args.input3;

    return Rx.Observable
      .of('')
      .flatMap(() => inviteListService.checkServerIsOWMN(context.guild))
      .flatMap(() => inviteListService.removeInvite(guildName, guildCategory, invite))
      .flatMap((guild) =>
        this.inviteListService.getInviteCategory(guild.category)
          .map((category) => ([guild, category])),
      )
      .map(([guild, category]) => ({
        status: 200,
        content: `Added ${guild.name} to the ${category.name} category, with invite ${guild.invite}`,
      }))
      .catch((error) => {
        if (error instanceof InviteListError) {
          return Rx.Observable.of({
            status: 400,
            content: error.message,
          });
        }
        else {
          return Rx.Observable.throw(error);
        }
      });
  },
};

