const Rx = require('rx');

module.exports = {
  name: 'disableAutoBan',
  description: 'Disables autobanning of users',

  run(context) {
    let autoBanService = context.nix.getService('modTools', 'autoBanService');

    let guild = context.guild;

    return autoBanService
      .setAutoBansEnabled(guild, false)
      .map(() => ({
        status: 200,
        content: `*puts away ban hammer*\nAutobanning is now disabled.`
      }));
  },
};
