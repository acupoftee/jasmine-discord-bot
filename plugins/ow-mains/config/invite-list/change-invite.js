const Rx = require('rx');

const {
  InviteListError,
} = require('../../errors');

module.exports = {
  name: 'changeInviteUrl',
  description: `update the invite for a server in the list of OWMN servers`,

  inputs: [
    {
      name: 'guildName',
      description: 'the name of the server',
      required: true,
    },
    {
      name: 'newInvite',
      description: 'the new invite url for the server',
      required: true,
    },
  ],

  run(context) {
    let inviteListService = context.nix.getService('owMains', 'inviteListService');

    let guildName = context.args.input1;
    let invite = context.args.input2;

    return Rx.Observable
      .of('')
      .flatMap(() => inviteListService.checkServerIsOWMN(context.guild))
      .flatMap(() => inviteListService.changeInviteUrl(guildName, invite))
      .map((guild) => ({
        status: 200,
        content: `Updated the invite for ${guild.name} to ${guild.invite}`,
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

