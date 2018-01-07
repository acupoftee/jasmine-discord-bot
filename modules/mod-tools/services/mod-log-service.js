const util = require('util');

const {DATAKEYS} = require('../utility');

class ModLogService {
  constructor(nix) {
    this.nix = nix;
  }

  addAuditEntry(guild, embed) {
    this.nix.logger.debug(`Adding audit entry: ${util.inspect(embed)}`);

    return this.nix.dataService
      .getGuildData(guild.id, DATAKEYS.MOD_LOG_CHANNEL)
      .map((channelId) => guild.channels.find("id", channelId))
      .filter((channel) => typeof channel !== 'undefined')
      .flatMap((channel) => channel.send({embed}))
      .catch((error) => {
        if (error.name === 'DiscordAPIError') {
          if (error.message === "Missing Access" || error.message === "Missing Permissions") {
            // Bot does not have permission to send messages, we can ignore.
            return Rx.Observable.empty();
          }
        }

        // Error was not handled, rethrow it
        return Rx.Observable.throw(error);
      })
      .map(true)
      .defaultIfEmpty(true);
  }
}

module.exports = ModLogService;
