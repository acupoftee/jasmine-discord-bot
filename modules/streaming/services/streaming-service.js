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
      .flatMap(() => this.getLiveRoleId(newMember.guild))
      .filter((liveRoleId) => liveRoleId)
      .flatMap((liveRoleId) => {
        let isStreaming = this.memberIsStreaming(newMember);

        if (isStreaming && !newMember.roles.has(liveRoleId)) {
          return Rx.Observable.of('')
            .flatMap(() => newMember.addRole(liveRoleId));
        } else if (!isStreaming && newMember.roles.has(liveRoleId)) {
          return Rx.Observable.of('')
            .flatMap(() => newMember.removeRole(liveRoleId));
        } else {
          return Rx.Observable.empty();
        }
      })
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

  /**
   * Checks if a member is streaming a game
   *
   * @param member {GuildMember}
   * @return {Boolean} true, if the member is streaming
   */
  memberIsStreaming(member) {
    let presence = member.presence;
    if (!presence.game) {
      return false;
    }
    else {
      return presence.game.streaming;
    }
  }
}

module.exports = StreamingService;
