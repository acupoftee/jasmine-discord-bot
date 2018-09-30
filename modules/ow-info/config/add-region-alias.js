const Rx = require('rx');

const {RegionNotFoundError} = require('../errors');

module.exports = {
  name: 'addRegionAlias',
  description: 'Add an alias for a region',

  services: {
    'ow-info': [
      'regionService',
    ],
  },

  inputs: [
    {
      name: 'alias',
      description: 'the name of alias',
      required: true,
    },
    {
      name: 'region',
      description: 'the name of the region the alias is for',
      required: true,
    },
  ],

  run(context) {
    let guild = context.guild;

    let aliasName = context.args.input1;
    let regionName = context.args.input2;

    if (!aliasName) {
      return Rx.Observable.of({
        status: 400,
        content: `an alias is required`,
      });
    }

    if (!regionName) {
      return Rx.Observable.of({
        status: 400,
        content: `the region to map the alias to is required`,
      });
    }

    return this.regionService
      .mapAlias(guild, aliasName, regionName)
      .map((mappedAlias) => ({
        status: 200,
        content: `Added alias ${mappedAlias.name} for ${mappedAlias.region}`,
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
