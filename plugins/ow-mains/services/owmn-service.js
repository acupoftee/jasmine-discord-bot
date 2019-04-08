const Service = require('nix-core').Service;

class OwmnService extends Service {
  isOwmnServer(guild) {
    return (guild.id === this.nix.config.owmnServerId);
  }
}

module.exports = OwmnService;
