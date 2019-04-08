const Rx = require('rx');

const {
  InviteListError,
} = require('../../errors');

module.exports = {
  name: 'setInvitesChannel',
  description: `sets the channel that the invite list will be sent to.`,

  inputs: [
    {
      name: 'channel',
      description: 'the channel to display the invite list in.',
      required: true,
    },
  ],

  run(context) {
    let inviteListService = context.nix.getService('owMains', 'inviteListService');

    let channelString = context.args.input1;
    let guild = context.guild;

    let channel = guild.channels.find((c) => c.toString() === channelString || c.id.toString() === channelString);
    if (!channel) {
      return Rx.Observable.of({
        content: "I was not able to find that channel",
      });
    }

    return Rx.Observable
      .of('')
      .flatMap(() => inviteListService.setListChannel(guild, channel))
      .flatMap(() => inviteListService.updateInviteChannel(guild))
      .map((channel) => ({
        status: 200,
        content: `Updated the invite list in ${channel}`,
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

