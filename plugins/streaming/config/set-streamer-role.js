const Rx = require('rx');

const { findRole } = require("../../../lib/role-utilities");

module.exports = {
  name: 'setStreamerRole',
  description: `Set a role to limit who can receive the live role`,

  inputs: [
    {
      name: 'role',
      required: true,
    },
  ],

  configureAction() {
    this.streamingService = this.nix.getService('streaming', 'streamingService');
  },

  run(context) {
    let guild = context.guild;

    let roleString = context.inputs.role;
    if (!roleString) {
      return Rx.Observable.of({
        status: 400,
        content: `A role to watch is required`,
      });
    }

    let role = findRole(guild, roleString);
    if (!role) {
      return Rx.Observable.of({
        status: 400,
        content: `The role '${roleString}' could not be found.`,
      });
    }

    return this.streamingService
      .setStreamerRole(guild, role)
      .map((streamerRole) => ({
        status: 200,
        content: `I will now only give the live role to users with the ${streamerRole.name} role`,
      }));
  },
};
