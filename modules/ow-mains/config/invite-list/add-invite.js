const Rx = require('rx');

const {
  InviteListError,
} = require('../../errors');

module.exports = {
  name: 'addInvite',
  description: `Add a server to the list of OWMN servers`,

  inputs: [
    {
      name: 'guildName',
      description: 'the name of the server',
      required: true,
    },
    {
      name: 'guildCategory',
      description: 'the server category',
      required: true,
    },
    {
      name: 'invite',
      description: 'the invite url for the server',
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
      .flatMap(() => inviteListService.addInvite(guildName, guildCategory, invite))
      .flatMap((guild) =>
        inviteListService.getInviteCategory(guild.category)
          .map((category) => ([guild, category]))
      )
      .map(([guild, category]) => ({
        status: 200,
        content: `Added ${guild.name} to the ${category.name} category, with invite ${guild.invite}`
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

