const Rx = require('rx');

const {
  InviteListError,
} = require('../../errors');

module.exports = {
  name: 'updateInvites',
  description: `Updates invite lists in all servers`,

  inputs: [],

  run(context) {
    let inviteListService = context.nix.getService('owMains', 'inviteListService');

    return Rx.Observable
      .of('')
      .flatMap(() => inviteListService.checkServerIsOWMN(context.guild))
      .flatMap(() => inviteListService.updateAllInviteChannels())
      .map(() => ({
        status: 200,
        content: `All invite lists have been updated`,
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

