let Rx = require('rx');

module.exports = {
  name: 'setLiveRole',
  description: `Set role to assign when a user goes live`,

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
        content: `A role is to assign users is required`,
      });
    }

    let role = findRole(guild, roleString);
    if (!role) {
      return Rx.Observable.of({
        status: 400,
        content: `The role '${roleString}' could not be found.`
      });
    }

    return this.streamingService
      .setLiveRole(guild, role)
      .map((role) => ({
        status: 200,
        content: `Live streamers will now be given the ${role.name} role.`
      }));
  },
};

function findRole(guild, roleString) {
  let idRegex = /^\d+$/;
  let mentionRegex = /^<@&?(\d+)>$/;

  if (roleString.match(idRegex)) {
    // string is an role ID
    return guild.roles.get(roleString);
  }

  let matches = roleString.match(mentionRegex);
  if (matches) {
    // string is an role mention
    return guild.roles.get(matches[1]);
  }

  // string is a role name
  return guild.roles.find((r) => r.name.toLowerCase() === roleString.toLowerCase());
}
