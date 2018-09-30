const Rx = require('rx');

const {RegionNotFoundError} = require('../errors');

module.exports = {
  name: 'addRegion',
  description: 'Add an Overwatch region, and map it to a role',

  services: {
    'ow-info': [
      'regionService',
    ],
  },

  inputs: [
    {
      name: 'region',
      description: 'the name of alias',
      required: true,
    },
    {
      name: 'role',
      description: 'the name the the role to map the region to',
      required: true,
    },
  ],

  run(context) {
    let guild = context.guild;

    let regionName = context.args.input1;
    let roleString = context.args.input2;

    if (!regionName) {
      return Rx.Observable.of({
        status: 400,
        content: `a region name is required`,
      });
    }

    if (!roleString) {
      return Rx.Observable.of({
        status: 400,
        content: `a role is to map the region to is required`,
      });
    }

    let role = findRole(guild, roleString);
    if (!role) {
      return Rx.Observable.of({
        status: 400,
        content: `The role '${roleString}' could not be found.`
      });
    }

    return this.regionService
      .mapRegion(guild, regionName, role)
      .map((mappedAlias) => ({
        ...mappedAlias,
        role: guild.roles.get(mappedAlias.roleId)
      }))
      .map((mappedAlias) => ({
        status: 200,
        content: `Mapped the region ${mappedAlias.name} to ${mappedAlias.role.name}`,
      }))
      .catch((error) => {
        if (error instanceof RegionNotFoundError) {
          return Rx.Observable.of({status: 400, content: error.message});
        }
        else {
          return Rx.Observable.throw(error);
        }
      });
  },
};

function findRole(guild, roleString) {
  let idRegex = /^\d+$/;
  if (roleString.match(idRegex)) {
    // string is an role ID
    return guild.roles.get(roleString);
  }

  let mentionRegex = /<@&?(\d+)>/;
  if (matches = roleString.match(mentionRegex)) {
    // string is an role mention
    return guild.roles.get(matches[1]);
  }

  // string is a role name
  return guild.roles.find((r) => r.name.toLowerCase() === roleString.toLowerCase());
}
