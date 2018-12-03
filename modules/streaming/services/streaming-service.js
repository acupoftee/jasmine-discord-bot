const Rx = require('rx');
const Service = require('nix-core').Service;

const DATAKEYS = require('../datakeys');

class StreamingService extends Service {
  onNixListen() {
    this.nix.streams
      .presenceUpdate$
      .flatMap(([oldMember, newMember]) => this.handlePresenceUpdate(oldMember, newMember))
      .subscribe();
  }

  handlePresenceUpdate(oldMember, newMember) {
    return Rx.Observable
      .of('')
      .filter(() => newMember.presence.game)
      .filter(() => newMember.presence.game.streaming)
      .flatMap(() => this.getLiveRoleId(newMember.guild))
      .filter((liveRoleId) => liveRoleId)
      .flatMap((liveRoleId) => newMember.addRole(liveRoleId))
      .catch((error) => {
        this.nix.handleError(error, [
          {name: "Service", value: "StreamingService"},
          {name: "Hook", value: "presenceUpdate$"},
          {name: "Guild", value: newMember.guild.toString()},
          {name: "Member", value: newMember.toString()},
        ]);
        return Rx.Observable.empty();
      })
  }

  getLiveRoleId(guild) {
    return this.nix.getGuildData(guild.id, DATAKEYS.LIVE_ROLE);
  }
}

module.exports = StreamingService;
